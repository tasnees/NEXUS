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
    Uses Claude to extract structured resume fields from raw resume text.
    """
    client = anthropic.Anthropic()

    prompt = f"""You are a resume parser. Extract the following fields from the resume below and return ONLY a valid JSON object — no explanation, no markdown.

Fields to extract:
- name: Full name of the candidate
- email: Email address
- phone: Phone number
- skills: List of technical and soft skills
- experience: List of work experience entries (each as a string: "Title at Company (dates): description")
- education: List of education entries (each as a string: "Degree in Field, Institution (year)")
- summary: A brief professional summary if present, otherwise null

Resume:
\"\"\"
{resume_text}
\"\"\"

Return only this JSON structure:
{{
  "name": "...",
  "email": "...",
  "phone": "...",
  "skills": ["...", "..."],
  "experience": ["...", "..."],
  "education": ["...", "..."],
  "summary": "..."
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    data = json.loads(raw)
    return CandidateProfile(**data)


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
