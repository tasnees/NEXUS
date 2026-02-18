from pydantic import BaseModel, EmailStr
from typing import List, Optional

class CandidateProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    skills: List[str] = []
    experience: List[str] = []
    education: List[str] = []
    summary: Optional[str] = None
    
class ExtractedDocument(BaseModel):
    filename: str
    content: str
    metadata: Optional[dict] = None
    candidate_profile: Optional[CandidateProfile] = None
