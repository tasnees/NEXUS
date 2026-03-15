from pydantic import BaseModel
from typing import List, Optional

class JobCreate(BaseModel):
    title: str
    company: str
    salary: str
    timePerWeek: str
    nature: str
    requirements: str
    description: str
    postedAt: str
    status: str
    tags: List[str]

class JobBase(BaseModel):
    title: str
    company_logo: str
    location: str
    posted_at: str
    status: str
    applicants: int
    match_rate: int
    interviewed: int
    tags: List[str]

class JobResponse(JobBase):
    id: int

    class Config:
        from_attributes = True
