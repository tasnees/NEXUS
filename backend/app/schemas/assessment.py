from pydantic import BaseModel
from typing import List, Optional

class AssessmentBase(BaseModel):
    title: str
    duration: str
    difficulty: str
    focus: List[str]
    description: str
    steps: Optional[List[str]] = []
    required_format: Optional[str] = "text"
    grading_threshold: Optional[int] = 70
    auto_reject: Optional[int] = 0
    evaluation_nodes: Optional[List[str]] = []
    job_id: int

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentResponse(AssessmentBase):
    id: int

    class Config:
        from_attributes = True
