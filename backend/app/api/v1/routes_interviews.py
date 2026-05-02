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

try:
    from calendar_sync_orchestrator import create_gcal_event, delete_gcal_event, update_gcal_event
except ImportError:
    # Fallback/Mock for cases where Google dependencies are missing during dev
    def create_gcal_event(x): return None
    def delete_gcal_event(x): return False
    def update_gcal_event(x, y): return False

router = APIRouter()

@router.post("/", response_model=InterviewResponse)
def create_interview(interview: InterviewCreate, db: Session = Depends(get_db)):
    # 1. Create on GCal first if possible
    gcal_id = create_gcal_event({
        "candidate_name": interview.candidate_name,
        "role": interview.role,
        "date": interview.date,
        "interview_type": interview.interview_type
    })

    # 2. Save to DB
    db_interview = Interview(
        candidate_name=interview.candidate_name,
        role=interview.role,
        date=interview.date,
        interview_type=interview.interview_type,
        status=interview.status,
        gcal_event_id=gcal_id
    )
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)
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
        update_gcal_event(db_interview.gcal_event_id, update_data)
    
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
        delete_gcal_event(db_interview.gcal_event_id)
    
    # 2. DELETE from DB
    db.delete(db_interview)
    db.commit()
    return {"message": "Interview deleted successfully"}
