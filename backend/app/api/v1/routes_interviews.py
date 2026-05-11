from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import sys
from pathlib import Path

from app.config.database import get_db
from app.models.interview import Interview
from app.schemas.interview import InterviewCreate, InterviewResponse, InterviewUpdate

# Injecting backend root into sys.path to allow importing orchestrators
backend_dir = Path(__file__).parent.parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# orchestrator imports moved inside functions to prevent circular dependencies

router = APIRouter()

from app.services.email_service import send_interview_email
from app.models.candidate import Candidate

@router.post("/", response_model=InterviewResponse)
def create_interview(interview: InterviewCreate, db: Session = Depends(get_db)):
    # Local import to avoid circular dependency
    try:
        from calendar_sync_orchestrator import create_gcal_event
    except ImportError:
        def create_gcal_event(x): return None, None

    # 1. Create on GCal first if possible
    gcal_id, meet_link = create_gcal_event({
        "candidate_name": interview.candidate_name,
        "role": interview.role,
        "date": interview.date,
        "interview_type": interview.interview_type,
        "interview_mean": interview.interview_mean
    })

    # 2. Save to DB - Use GCal link if generated, otherwise fallback to manual user link
    db_interview = Interview(
        candidate_name=interview.candidate_name,
        role=interview.role,
        date=interview.date,
        interview_type=interview.interview_type,
        interview_mean=interview.interview_mean,
        status=interview.status,
        gcal_event_id=gcal_id,
        meet_link=meet_link or interview.meet_link
    )
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)

    # 3. Send Email to Candidate if they exist in our DB
    candidate = db.query(Candidate).filter(Candidate.name == interview.candidate_name).first()
    if candidate and candidate.email:
        send_interview_email(
            to_email=candidate.email,
            candidate_name=interview.candidate_name,
            role=interview.role,
            date=str(interview.date),
            meet_link=meet_link
        )

    return db_interview

@router.get("/", response_model=List[InterviewResponse])
def get_interviews(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    interviews = db.query(Interview).order_by(Interview.date.asc()).offset(skip).limit(limit).all()
    return interviews

@router.put("/{interview_id}", response_model=InterviewResponse)
def update_interview(interview_id: int, interview_update: InterviewUpdate, db: Session = Depends(get_db)):
    db_interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not db_interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    update_data = interview_update.dict(exclude_unset=True)
    
    # 1. Sync with GCal if we have an ID
    if db_interview.gcal_event_id:
        try:
            from calendar_sync_orchestrator import update_gcal_event
            update_gcal_event(db_interview.gcal_event_id, update_data)
        except ImportError:
            pass
    
    # 2. Update DB
    for key, value in update_data.items():
        setattr(db_interview, key, value)
    
    db.commit()
    db.refresh(db_interview)
    return db_interview

@router.delete("/{interview_id}")
def delete_interview(interview_id: int, db: Session = Depends(get_db)):
    db_interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not db_interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # 1. DELETE from GCal if ID exists
    if db_interview.gcal_event_id:
        try:
            from calendar_sync_orchestrator import delete_gcal_event
            delete_gcal_event(db_interview.gcal_event_id)
        except ImportError:
            pass
    
    # 2. DELETE from DB
    db.delete(db_interview)
    db.commit()
    return {"message": "Interview deleted successfully"}
