from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict
from pydantic import BaseModel
import uuid
import io

from app.config.database import get_db
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateCreate, CandidateResponse
from app.services.assessment_dispatch_service import check_and_dispatch_assessment
from app.services.pdf_extractor import PDFExtractor
from app.schemas.cv_extraction import extract_resume_fields

router = APIRouter()


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    summary: Optional[str] = None
    applied_job: Optional[str] = None


@router.get("/", response_model=List[CandidateResponse])
def list_candidates(db: Session = Depends(get_db)):
    """Return all candidate profiles."""
    return db.query(Candidate).order_by(Candidate.created_at.desc()).all()


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.post("/", response_model=CandidateResponse, status_code=201)
def create_or_update_candidate(payload: CandidateCreate, db: Session = Depends(get_db)):
    """
    Upsert a candidate profile by drive_file_id.
    Used by the orchestrator to push newly-processed resumes into the DB.
    If the file was already processed, it updates the existing record.
    """
    existing = db.query(Candidate).filter(
        Candidate.drive_file_id == payload.drive_file_id
    ).first()

    if existing:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        check_and_dispatch_assessment(db, existing.id)
        return existing

    candidate = Candidate(**payload.model_dump())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    check_and_dispatch_assessment(db, candidate.id)
    return candidate


@router.post("/upload", response_model=CandidateResponse)
async def upload_manual_candidate(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    applied_job: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Handle manual CV upload. 
    1. Extract text from file.
    2. AI parse the text.
    3. Apply manual overrides.
    4. Save to DB.
    """
    contents = await file.read()
    filename = file.filename
    
    # 1. Extract Text
    text = ""
    if filename.lower().endswith(".pdf"):
        extractor = PDFExtractor(file_stream=io.BytesIO(contents))
        text = extractor.extract_text()
    else:
        # Fallback for plain text or others
        text = contents.decode("utf-8", errors="ignore")
    
    # 2. AI Extract
    # We get all job titles to help the AI match
    from app.models.job import Job
    job_titles = [j.title for j in db.query(Job).all()]
    extracted = extract_resume_fields(text, existing_job_titles=job_titles)
    
    # 3. Create Candidate Record
    # Generate a unique "manual" drive_file_id
    manual_id = f"manual-{uuid.uuid4()}"
    
    db_candidate = Candidate(
        drive_file_id=manual_id,
        filename=filename,
        name=name or extracted.name or "New Candidate",
        email=email or extracted.email,
        phone=phone or extracted.phone,
        summary=extracted.summary,
        skills=extracted.skills,
        experience=extracted.experience,
        education=extracted.education,
        applied_job=applied_job or extracted.applied_job,
        raw_text=text
    )
    
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    
    # 4. Trigger Assessment Flow
    check_and_dispatch_assessment(db, db_candidate.id)
    
    return db_candidate


@router.put("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(candidate_id: int, payload: CandidateUpdate, db: Session = Depends(get_db)):
    """Update editable fields of a candidate profile."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(candidate, field, value)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.delete("/{candidate_id}", status_code=204)
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(candidate)
    db.commit()

@router.post("/{candidate_id}/dispatch-assessment")
def dispatch_assessment(candidate_id: int, db: Session = Depends(get_db)):
    """Manually trigger the assessment email dispatch."""
    success = check_and_dispatch_assessment(db, candidate_id)
    if not success:
        # Check why it failed
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
             raise HTTPException(status_code=404, detail="Candidate not found")
        
        # If score is too low, we might want to force it anyway in a manual trigger?
        # For now, let's just report failure.
        raise HTTPException(status_code=400, detail="Criteria not met for assessment dispatch (low score or missing email/job)")
    
    return {"message": "Assessment dispatched successfully"}

@router.post("/{candidate_id}/status-email")
def status_email(candidate_id: int, status: str, db: Session = Depends(get_db)):
    """Send a Hire or Reject email to the candidate."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    from app.services.email_service import send_status_email
    success = send_status_email(
        to_email=candidate.email,
        candidate_name=candidate.name,
        status=status,
        job_title=candidate.applied_job or "the position"
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send status email")
    
    return {"message": f"{status.capitalize()} email sent successfully"}
