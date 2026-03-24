from pydantic import BaseModel
from typing import List, Optional

class AssessmentBase(BaseModel):
    title: str
    duration: str
    difficulty: str
    focus: List[str]
    description: str
    job_id: int

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentResponse(AssessmentBase):
    id: int

    class Config:
        from_attributes = True
