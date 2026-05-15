from pydantic import BaseModel
from typing import List, Optional

class JobCreate(BaseModel):
    title: str
    company: Optional[str] = "HireSync AI"
    salary: Optional[str] = None
    timePerWeek: Optional[str] = "40 hours"
    nature: Optional[str] = "online"
    requirements: Optional[str] = None
    description: Optional[str] = None
    postedAt: Optional[str] = None
    status: Optional[str] = "active"
    location: Optional[str] = None
    department: Optional[str] = None
    tags: Optional[List[str]] = []

class JobBase(BaseModel):
    title: str
    company_logo: Optional[str] = None
    location: Optional[str] = None
    posted_at: Optional[str] = None
    status: Optional[str] = None
    applicants: Optional[int] = 0
    match_rate: Optional[int] = 0
    interviewed: Optional[int] = 0
    tags: Optional[List[str]] = []
    department: Optional[str] = None
    company: Optional[str] = None
    salary: Optional[str] = None
    nature: Optional[str] = None
    requirements: Optional[str] = None
    description: Optional[str] = None

class JobResponse(JobBase):
    id: int

    class Config:
        from_attributes = True
