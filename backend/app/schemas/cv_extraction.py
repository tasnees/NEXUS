import json
import re
import os
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from dotenv import load_dotenv

# Step 1: Force Load Token
load_dotenv()
PUTER_TOKEN = os.getenv("PUTER_TOKEN")

class CandidateProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    experience: List[str] = []
    education: List[str] = []
    summary: Optional[str] = None
    applied_job: Optional[str] = None
    seniority: Optional[str] = None
    years_of_experience: Optional[int] = 0
    links: List[str] = []

class ExtractedDocument(BaseModel):
    filename: str
    content: str
    metadata: Optional[dict] = None
    candidate_profile: Optional[CandidateProfile] = None

def extract_resume_fields(resume_text: str, existing_job_titles: Optional[List[str]] = None) -> CandidateProfile:
    """
    Primary: Uses Puter SDK for high-fidelity AI-powered CV extraction.
    Secondary: Heuristic-based extraction.
    """
    from app.services.pdf_extractor import PDFExtractor
    
    puter = None
    try:
        import puter as p
        puter = p
        # Attempt to set the token for those SDK versions that look at it globally
        if PUTER_TOKEN and hasattr(puter, "config"):
            puter.config.token = PUTER_TOKEN
    except ImportError:
        pass

    # Support for guided matching
    job_context = "Available Jobs: " + ", ".join(existing_job_titles) if existing_job_titles else "No specific job list provided."

    # --- PUTER AI EXTRACTION (ULTRA-PRECISION VERSION 0.5.0) ---
    if puter:
        try:
            # Step 2: Initialize Puter AI Brain using the confirmed token=... constructor
            ai_instance = None
            if hasattr(puter, "PuterAI"):
                ai_instance = puter.PuterAI(token=PUTER_TOKEN)
            elif hasattr(puter, "ai") and hasattr(puter.ai, "PuterAI"):
                ai_instance = puter.ai.PuterAI(token=PUTER_TOKEN)
            elif hasattr(puter, "ai"):
                ai_instance = puter.ai

            if not ai_instance:
                raise AttributeError("Could not initialize Puter AI Brain.")

            prompt = (
                "You are a world-class talent acquisition agent. "
                "Parse the resume content below into a strict JSON object.\n\n"
                f"CONTEXT:\n{job_context}\n\n"
                "STRICT JSON FIELDS:\n"
                '1. "name": Full name (string)\n'
                '2. "email": Email (string)\n'
                '3. "phone": Best phone number (string)\n'
                '4. "skills": List of technical and soft skills (array of strings)\n'
                '5. "experience": Work history entries (array of strings)\n'
                '6. "education": Education history (array of strings)\n'
                '7. "summary": Executive summary (string)\n'
                '8. "applied_job": Match against one of the Available Jobs below. '
                'Use "Uncategorized" if there is no clear match. (string)\n'
                '9. "seniority": One of [Junior, Mid, Senior, Lead] (string)\n'
                '10. "years_of_experience": Total professional years (integer)\n'
                '11. "links": Professional URLs found (array of strings)\n\n'
                f"RESUME RAW TEXT:\n---\n{resume_text}\n---\n\n"
                "Return ONLY a valid JSON object. No explanation, no markdown fences."
            )

            response = None
            # Find the correct method on the brain
            for method in ["chat", "complete", "chat_complete"]:
                if hasattr(ai_instance, method):
                    try:
                        # Try with gpt-4o-mini first
                        response = getattr(ai_instance, method)(prompt, model="gpt-4o-mini")
                        break
                    except:
                        try:
                            # Try without model
                            response = getattr(ai_instance, method)(prompt)
                            break
                        except:
                            continue

            if not response:
                raise RuntimeError("All Puter AI methods failed.")

            raw_str = str(response).strip()
            start_idx = raw_str.find("{")
            end_idx = raw_str.rfind("}")
            if start_idx != -1 and end_idx != -1:
                data = json.loads(raw_str[start_idx : end_idx + 1])
                
                return CandidateProfile(
                    name=data.get("name"),
                    email=data.get("email"),
                    phone=data.get("phone"),
                    skills=data.get("skills", []),
                    experience=data.get("experience", []),
                    education=data.get("education", []),
                    summary=data.get("summary"),
                    applied_job=data.get("applied_job"),
                    seniority=data.get("seniority"),
                    years_of_experience=data.get("years_of_experience", 0),
                    links=data.get("links", [])
                )
        except Exception as e:
            print(f"Puter AI Brain failed: {e}. Trying heuristics fallback.")

    # --- HEURISTIC FALLBACK (ULTRA-ROBUST) ---
    extractor = PDFExtractor()
    data_ext = extractor.extract_key_fields(resume_text)
    
    # Improved Name Detection
    cand_name = data_ext.get("name")
    if not cand_name or cand_name == "None" or cand_name == "Unknown":
        lines = [l.strip() for l in resume_text.split("\n") if l.strip()]
        if lines:
            first_line = lines[0]
            if len(first_line) < 40 and not any(c.isdigit() for c in first_line):
                cand_name = first_line

    applied_job = data_ext.get("applied_job")
    if not applied_job and existing_job_titles:
        lower_text = resume_text.lower()
        for j in existing_job_titles:
            if j.lower() in lower_text:
                applied_job = j
                break

    return CandidateProfile(
        name=cand_name or "Unknown Candidate",
        email=data_ext.get("email"),
        phone=data_ext.get("phone"),
        skills=data_ext.get("skills", []) if isinstance(data_ext.get("skills"), list) else [],
        experience=data_ext.get("experience", []) if isinstance(data_ext.get("experience"), list) else [],
        education=[str(data_ext.get("education"))] if data_ext.get("education") else [],
        summary=data_ext.get("summary"),
        applied_job=applied_job,
        seniority="Mid-Level",
        years_of_experience=0,
        links=[]
    )