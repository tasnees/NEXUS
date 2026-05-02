from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class CandidateBase(BaseModel):
    name:       Optional[str] = None
    email:      Optional[str] = None
    phone:      Optional[str] = None
    summary:    Optional[str] = None
    skills:     List[str] = []
    experience: List[str] = []
    education:  List[str] = []
    applied_job: Optional[str] = None


class CandidateCreate(CandidateBase):
    drive_file_id: str
    filename:      str
    raw_text:      Optional[str] = None


class CandidateResponse(CandidateBase):
    id:            int
    drive_file_id: str
    filename:      str
    assessment_results: Optional[List[dict]] = []
    created_at:    Optional[datetime] = None

    class Config:
        from_attributes = True
