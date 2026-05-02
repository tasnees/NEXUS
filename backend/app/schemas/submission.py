from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SubmissionBase(BaseModel):
    assessment_id: int
    candidate_email: str
    answer: str
    grade: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionResponse(SubmissionBase):
    id: int
    submitted_at: datetime

    class Config:
        from_attributes = True
