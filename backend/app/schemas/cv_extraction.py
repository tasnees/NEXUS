import json
import re
import anthropic
from pydantic import BaseModel, EmailStr
from typing import List, Optional


class CandidateProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
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


def extract_resume_fields(resume_text: str) -> CandidateProfile:
    """
    Tries heuristic extraction (regex/keywords) from PDFExtractor.
    If an Anthropic API Key is eventually provided, we can re-enable AI extraction here.
    """
    from app.services.pdf_extractor import PDFExtractor
    
    # Use the existing PDFExtractor heuristic logic
    extractor = PDFExtractor()
    data = extractor.extract_key_fields(resume_text)
    
    # Map dictionary to CandidateProfile model
    return CandidateProfile(
        name=data.get("name"),
        email=data.get("email"),
        phone=data.get("phone"),
        # Heuristics return strings, CandidateProfile expects Lists for these:
        skills=[data.get("skills")] if data.get("skills") else [],
        experience=[data.get("experience")] if data.get("experience") else [],
        education=[data.get("education")] if data.get("education") else [],
        summary=data.get("summary")
    )


def process_document(filename: str, content: str, metadata: Optional[dict] = None) -> ExtractedDocument:
    """
    Processes a raw resume document and returns an ExtractedDocument
    with the candidate_profile populated.
    """
    profile = extract_resume_fields(content)

    return ExtractedDocument(
        filename=filename,
        content=content,
        metadata=metadata,
        candidate_profile=profile,
    )