from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.config.database import get_db
from app.models.submission import AssessmentSubmission
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from dotenv import load_dotenv
import os

load_dotenv()
PUTER_TOKEN = os.getenv("PUTER_TOKEN")

router = APIRouter()

@router.post("/", response_model=SubmissionResponse)
def create_submission(payload: SubmissionCreate, db: Session = Depends(get_db)):
    # Check if a submission already exists for this email and assessment
    existing = db.query(AssessmentSubmission).filter(
        AssessmentSubmission.assessment_id == payload.assessment_id,
        AssessmentSubmission.candidate_email == payload.candidate_email
    ).first()
    
    if existing:
        existing.answer = payload.answer
        db.commit()
        db.refresh(existing)
        return existing

    submission = AssessmentSubmission(**payload.model_dump())
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

from app.models.candidate import Candidate
from app.models.assessment import Assessment
import json
import re

@router.get("/assessment/{assessment_id}", response_model=List[SubmissionResponse])
def get_submissions_for_assessment(assessment_id: int, db: Session = Depends(get_db)):
    return db.query(AssessmentSubmission).filter(AssessmentSubmission.assessment_id == assessment_id).all()

@router.get("/by-candidate", response_model=Optional[SubmissionResponse])
def get_submission_by_candidate(email: str, assessment_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific submission by candidate email and assessment ID."""
    from sqlalchemy import func
    return db.query(AssessmentSubmission).filter(
        func.lower(AssessmentSubmission.candidate_email) == email.lower(),
        AssessmentSubmission.assessment_id == assessment_id
    ).first()

def _sync_grade_to_candidate(db: Session, submission: AssessmentSubmission):
    """Internal helper to update Candidate.assessment_results (Case Insensitive)."""
    from sqlalchemy import func
    from app.models.candidate import Candidate
    from app.models.assessment import Assessment

    candidate = db.query(Candidate).filter(func.lower(Candidate.email) == func.lower(submission.candidate_email)).first()
    
    if candidate:
        print(f"SYNC: Found candidate {candidate.email} for submission {submission.id}")
        
        # Get assessment title for better UI
        assessment = db.query(Assessment).filter(Assessment.id == submission.assessment_id).first()
        assessment_title = assessment.title if assessment else f"Assessment #{submission.assessment_id}"

        # Update or add to assessment_results JSON
        results = list(candidate.assessment_results or [])
        # Find if this assessment already exists in results
        existing_idx = -1
        for i, res in enumerate(results):
            if res.get("assessment_id") == submission.assessment_id:
                existing_idx = i
                break
        
        entry = {
            "assessment_id": submission.assessment_id,
            "assessment_title": assessment_title,
            "grade": submission.grade,
            "score": submission.score,
            "feedback": submission.feedback,
            "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None
        }
        
        if existing_idx >= 0:
            results[existing_idx] = entry
        else:
            results.append(entry)
            
        candidate.assessment_results = results
        db.commit()
    else:
        print(f"SYNC WARNING: No candidate found with email {submission.candidate_email}")

@router.put("/{submission_id}/grade", response_model=SubmissionResponse)
def grade_submission(submission_id: int, grade: str, feedback: str, db: Session = Depends(get_db)):
    submission = db.query(AssessmentSubmission).filter(AssessmentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission.grade = grade
    submission.feedback = feedback
    db.commit()
    db.refresh(submission)
    
    _sync_grade_to_candidate(db, submission)
    return submission

@router.post("/{submission_id}/ai-grade", response_model=SubmissionResponse)
async def ai_grade_submission(submission_id: int, db: Session = Depends(get_db)):
    submission = db.query(AssessmentSubmission).filter(AssessmentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    assessment = db.query(Assessment).filter(Assessment.id == submission.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment context not found")

    # Use Puter AI to grade
    try:
        import puter
        if not PUTER_TOKEN:
            raise ValueError("PUTER_TOKEN not found in environment")
        ai = puter.PuterAI(token=PUTER_TOKEN)
    except Exception as e:
        print(f"Puter Init Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Service unavailable: {str(e)}")

    prompt = f"""You are a senior technical recruiter. Grade the following candidate response to an assessment challenge.
    
    Required Format: {assessment.required_format or 'text'}
    Primary Evaluation Nodes: {", ".join(assessment.evaluation_nodes or ["Technical Accuracy", "Clarity"])}
    Passing Threshold: {assessment.grading_threshold or 70}%
    Assessment Description: {assessment.description}
    
    Candidate's Email: {submission.candidate_email}
    Candidate's Response:
    \"\"\"
    {submission.answer}
    \"\"\"
    
    CRITICAL EVALUATION STEPS:
    1. Check if the candidate used the correct format ({assessment.required_format or 'text'}).
    2. Focus heavily on these nodes: {", ".join(assessment.evaluation_nodes or ["Technical Accuracy", "Clarity"])}.
    3. Determine a score (0-100). If the score is below {assessment.grading_threshold or 70}%, the grade should be 'D' or 'F'.
    
    Return ONLY a valid JSON object. Do not include markdown code blocks or extra text.
    {
        "grade": "Letter grade (A, B, C, D, or F)",
        "score": Integer between 0 and 100,
        "feedback": "2-3 sentence technical evaluation"
    }
    """
    
    try:
        # Resilient chat call (attempt gpt-4o first, then fallback)
        try:
            response = ai.chat(prompt, model="gpt-4o")
        except:
            response = ai.chat(prompt)

        raw_str = str(response).strip()
        print(f"DEBUG: RAW AI RESPONSE: {raw_str}")
        # Clean JSON match
        match = re.search(r"\{.*\}", raw_str, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            submission.grade = data.get("grade", "U")
            submission.score = data.get("score")
            submission.feedback = data.get("feedback", "AI Analysis Completed.")
            db.commit()
            db.refresh(submission)
            _sync_grade_to_candidate(db, submission)

            # Auto-Reject Logic
            if assessment.auto_reject == 1 and submission.grade in ['D', 'F']:
                from app.models.candidate import Candidate
                candidate = db.query(Candidate).filter(Candidate.email == submission.candidate_email).first()
                if candidate:
                    candidate.status = "Archived"
                    db.commit()
            
            return submission
        else:
            raise ValueError("AI returned non-JSON output")
    except Exception as e:
        print(f"AI Grading Internal Error: {e}")
        db.rollback() # Ensure DB state is clean
        submission.grade = "Pending"
        submission.feedback = f"Automated grading failed: {str(e)}"
        db.commit()
        return submission
