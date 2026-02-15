from pydantic import BaseModel
from typing import List

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
