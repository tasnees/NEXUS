from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class InterviewBase(BaseModel):
    candidate_name: str
    role: str
    date: datetime
    interview_type: str
    status: Optional[str] = "scheduled"

class InterviewCreate(InterviewBase):
    pass

class InterviewResponse(InterviewBase):
    id: int

    class Config:
        from_attributes = True
