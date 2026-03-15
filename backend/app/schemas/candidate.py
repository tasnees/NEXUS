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


class CandidateCreate(CandidateBase):
    drive_file_id: str
    filename:      str
    raw_text:      Optional[str] = None


class CandidateResponse(CandidateBase):
    id:            int
    drive_file_id: str
    filename:      str
    created_at:    Optional[datetime] = None

    class Config:
        from_attributes = True
