from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class InterviewBase(BaseModel):
    candidate_name: str
    role: str
    date: datetime
    interview_type: str
    status: Optional[str] = "scheduled"
    gcal_event_id: Optional[str] = None

class InterviewCreate(InterviewBase):
    pass

class InterviewUpdate(BaseModel):
    candidate_name: Optional[str] = None
    role: Optional[str] = None
    date: Optional[datetime] = None
    interview_type: Optional[str] = None
    status: Optional[str] = None

class InterviewResponse(InterviewBase):
    id: int

    class Config:
        from_attributes = True
