from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.config.database import get_db
from app.models.submission import AssessmentSubmission
from app.schemas.submission import SubmissionCreate, SubmissionResponse

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

def _sync_grade_to_candidate(db: Session, submission: AssessmentSubmission):
    """Internal helper to update Candidate.assessment_results."""
    candidate = db.query(Candidate).filter(Candidate.email == submission.candidate_email).first()
    if candidate:
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
            "grade": submission.grade,
            "feedback": submission.feedback,
            "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None
        }
        
        if existing_idx >= 0:
            results[existing_idx] = entry
        else:
            results.append(entry)
            
        candidate.assessment_results = results
        db.commit()

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
def ai_grade_submission(submission_id: int, db: Session = Depends(get_db)):
    submission = db.query(AssessmentSubmission).filter(AssessmentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    assessment = db.query(Assessment).filter(Assessment.id == submission.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment context not found")

    # Use Puter AI to grade
    try:
        import puter
    except ImportError:
        raise HTTPException(status_code=500, detail="Puter SDK not installed")

    prompt = f"""You are a senior technical recruiter. Grade the following candidate response to an assessment challenge.
    
    Assessment Title: {assessment.title}
    Assessment Description: {assessment.description}
    
    Candidate's Email: {submission.candidate_email}
    Candidate's Response:
    \"\"\"
    {submission.answer}
    \"\"\"
    
    Return ONLY a valid JSON object with:
    - grade: A letter grade (A, B, C, D, or F)
    - feedback: A 2-3 sentence technical evaluation.
    
    Example: {{"grade": "B+", "feedback": "Clear explanation of the architecture but missed edge cases related to concurrent writes."}}
    """
    
    try:
        # Attempt to use Puter AI (resilient version)
        try:
            response = puter.ai.chat(prompt, model="gpt-4o")
        except AttributeError:
            response = puter.ai.complete(prompt, model="gpt-4o")
        except:
            response = puter.ai.chat(prompt)

        raw_str = str(response).strip()
        # Clean JSON match
        match = re.search(r"\{.*\}", raw_str, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            submission.grade = data.get("grade", "U")
            submission.feedback = data.get("feedback", "No feedback provided by AI.")
            db.commit()
            db.refresh(submission)
            _sync_grade_to_candidate(db, submission)
            return submission
        else:
            raise ValueError("AI returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Grading failed: {str(e)}")
