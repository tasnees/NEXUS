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
    
    return {"agent_message": interview.transcript[-1]["content"], "status": "active"}

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
    
    # 3. Get AI agent's response
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
    if any(phrase in agent_msg.lower() for phrase in ["thank you for your time", "we will be in touch", "goodbye"]):
        interview.status = InterviewStatus.COMPLETED
        # Trigger evaluation in background or here
        evaluation = await InterviewAgentService.evaluate_interview(current_transcript, interview.role)
        interview.ai_evaluation = evaluation
    
    db.commit()
    
    return ChatResponse(agent_message=agent_msg, status=interview.status)

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
