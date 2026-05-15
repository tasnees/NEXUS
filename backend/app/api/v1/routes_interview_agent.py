from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.config.database import get_db
from app.models.interview import Interview, InterviewStatus
from app.models.candidate import Candidate
from app.services.interview_agent_service import InterviewAgentService

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    agent_message: Optional[str] = None

class ChatResponse(BaseModel):
    agent_message: str
    status: str

@router.get("/{interview_id}/init")
async def initialize_interview(interview_id: int, db: Session = Depends(get_db)):
    """
    Initializes the interview and gets the first message from the agent.
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview.status == InterviewStatus.COMPLETED:
        return {"agent_message": "This interview has already been completed. Thank you!", "status": "completed"}

    # Get candidate info for context
    candidate = db.query(Candidate).filter(Candidate.name == interview.candidate_name).first()
    summary = candidate.summary if candidate else ""
    
    # If transcript is empty, get the first message
    if not interview.transcript:
        first_msg = await InterviewAgentService.get_next_response(
            candidate_name=interview.candidate_name,
            role=interview.role,
            transcript=[],
            candidate_summary=summary
        )
        interview.transcript = [{"role": "agent", "content": first_msg}]
        db.commit()
        return {"agent_message": first_msg, "status": "active"}
    
    return {
        "agent_message": interview.transcript[-1]["content"], 
        "status": interview.status,
        "candidate_name": interview.candidate_name,
        "role": interview.role,
        "candidate_summary": summary
    }

@router.post("/{interview_id}/chat", response_model=ChatResponse)
async def continue_interview(interview_id: int, payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Continues the conversation between the candidate and the AI agent.
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview.status == InterviewStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Interview already completed")

    # 1. Save candidate's message
    current_transcript = list(interview.transcript)
    current_transcript.append({"role": "candidate", "content": payload.message})
    
    # 2. Get candidate context
    candidate = db.query(Candidate).filter(Candidate.name == interview.candidate_name).first()
    summary = candidate.summary if candidate else ""
    
    # 3. Get AI agent's response (or use the one provided by client)
    if payload.agent_message:
        agent_msg = payload.agent_message
    else:
        agent_msg = await InterviewAgentService.get_next_response(
            candidate_name=interview.candidate_name,
            role=interview.role,
            transcript=current_transcript,
            candidate_summary=summary
        )
    
    # 4. Save agent's message
    current_transcript.append({"role": "agent", "content": agent_msg})
    interview.transcript = current_transcript
    
    # Check if the agent is wrapping up
    termination_phrases = [
        "thank you for your time", 
        "we will be in touch", 
        "goodbye", 
        "have a great day", 
        "wish you the best",
        "finished our interview",
        "gathered all the information",
        "contact you soon"
    ]
    
    agent_msg_lower = agent_msg.lower()
    is_wrapping_up = any(phrase in agent_msg_lower for phrase in termination_phrases)
    
    # Hard limit: If more than 10 candidate turns, force completion
    candidate_turns = [t for t in current_transcript if t["role"] == "candidate"]
    if len(candidate_turns) >= 10:
        is_wrapping_up = True
        if not any(p in agent_msg_lower for p in ["thank", "bye", "touch"]):
            agent_msg = "Thank you so much for your time today! I've gathered plenty of information. Our team will review your profile and get back to you soon. Have a wonderful day!"
            current_transcript[-1]["content"] = agent_msg

    if is_wrapping_up:
        interview.status = InterviewStatus.COMPLETED
        # Evaluation is now handled by the recruiter's frontend to avoid Puter API 403 errors
        # evaluation = await InterviewAgentService.evaluate_interview(current_transcript, interview.role)
        # interview.ai_evaluation = evaluation
    
    db.commit()
    
    return ChatResponse(agent_message=agent_msg, status=interview.status)

@router.post("/{interview_id}/finalize")
async def finalize_interview(interview_id: int, payload: dict = None, db: Session = Depends(get_db)):
    """
    Finalizes an interview. Accepts an optional evaluation from the frontend.
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview.status == InterviewStatus.COMPLETED and not (payload and payload.get("evaluation")):
        return {"message": "Already completed", "evaluation": interview.ai_evaluation}

    # Use provided evaluation if available (preferred to avoid 403 on backend)
    evaluation = payload.get("evaluation") if payload else None
    
    if not evaluation:
        try:
            # Try server-side evaluation (might fail with 403 in some environments)
            evaluation = await InterviewAgentService.evaluate_interview(interview.transcript, interview.role)
        except Exception as e:
            print(f"Server-side evaluation failed: {e}")
            evaluation = None
    
    if evaluation:
        interview.ai_evaluation = evaluation
    interview.status = InterviewStatus.COMPLETED
    
    db.commit()
    return {"message": "Interview finalized and evaluated", "evaluation": evaluation}

@router.post("/{interview_id}/evaluation")
async def update_interview_evaluation(interview_id: int, evaluation: dict, db: Session = Depends(get_db)):
    """
    Allows recruiters to override or update the AI-generated evaluation.
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Merge or replace evaluation
    if not interview.ai_evaluation:
        interview.ai_evaluation = evaluation
    else:
        current = dict(interview.ai_evaluation)
        current.update(evaluation)
        interview.ai_evaluation = current
        
    db.commit()
    return interview.ai_evaluation

@router.get("/{interview_id}/evaluation")
async def get_interview_evaluation(interview_id: int, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    return {
        "status": interview.status,
        "evaluation": interview.ai_evaluation,
        "transcript": interview.transcript
    }
