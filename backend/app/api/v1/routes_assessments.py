import json
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from dotenv import load_dotenv
import puter # type: ignore

from app.config.database import get_db
from app.models.assessment import Assessment
from app.models.job import Job
from app.schemas.assessment import AssessmentCreate, AssessmentResponse

load_dotenv()
PUTER_TOKEN = os.getenv("PUTER_TOKEN")

router = APIRouter()

@router.get("/", response_model=List[AssessmentResponse])
def list_assessments(db: Session = Depends(get_db)):
    return db.query(Assessment).all()

@router.post("/generate", response_model=AssessmentResponse)
async def generate_ai_assessment(
    job_id: int, 
    difficulty: str = "Intermediate",
    context: str = "",
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not PUTER_TOKEN:
        raise HTTPException(status_code=500, detail="PUTER_TOKEN not found for AI generation")

    # 1. FETCH PREVIOUS ASSESSMENTS to avoid repetition
    previous_assessments = db.query(Assessment).filter(Assessment.job_id == job_id).all()
    past_topics = ", ".join([f"'{a.title}'" for a in previous_assessments])
    
    ai = puter.PuterAI(token=PUTER_TOKEN)
    
    prompt = f"""Generate a unique, high-fidelity technical assessment challenge for a {job.title} role.
DIFFICULTY LEVEL: {difficulty}
OPTIONAL CONTEXT: {context}

CRITICAL CALIBER CONSTRAINTS:
- if EASY: Focus on core syntax, basic problem-solving, and implementation of a single module. (Junior/Entry level)
- if INTERMEDIATE: Focus on architecture, best practices, integration, and performance optimization. (Mid/Senior level)
- if EXPERT: Focus on high-scale distributed systems, complex edge cases, strategic design decisions, and hyper-optimization under constraints. (Lead/Architect level)

CRITICAL: DO NOT REPEAT THE TOPICS OF THESE PREVIOUS ASSESSMENTS:
{past_topics if past_topics else "None"}

EXPECTED OUTPUT (Strict JSON only):
{{
  "title": "A unique, compelling title",
  "description": "A deep, multi-paragraph brief (200-400 words) with real-world context, specific tasks, and clear deliverables.",
  "duration": "e.g. 4 Hours",
  "focus": ["Skill 1", "Skill 2", "Skill 3"]
}}
"""
    try:
        response = ai.chat(prompt, model="gpt-4o")
        raw_str = str(response).strip()
        start_idx = raw_str.find("{")
        end_idx = raw_str.rfind("}")
        if start_idx == -1 or end_idx == -1:
            raise HTTPException(status_code=500, detail="AI output is not valid JSON")

        data = json.loads(raw_str[start_idx : end_idx + 1])
        
        assessment = Assessment(
            title=data.get("title", f"{job.title} Advanced Vetting"),
            description=data.get("description", "Challenge description pending..."),
            duration=data.get("duration", "3 Hours"),
            difficulty=difficulty,
            focus=data.get("focus", ["Innovation", "Optimization", "Architecture"]),
            job_id=job_id
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        return assessment
    except Exception as e:
        print(f"AI Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=AssessmentResponse)
def create_assessment(payload: AssessmentCreate, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    assessment = Assessment(**payload.model_dump())
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment

@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(assessment_id: int, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.put("/{assessment_id}", response_model=AssessmentResponse)
def update_assessment(assessment_id: int, payload: AssessmentCreate, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    if payload.job_id != assessment.job_id:
        job = db.query(Job).filter(Job.id == payload.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

    for key, value in payload.model_dump().items():
        setattr(assessment, key, value)
    
    db.commit()
    db.refresh(assessment)
    return assessment

@router.delete("/{assessment_id}")
def delete_assessment(assessment_id: int, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    db.delete(assessment)
    db.commit()
    return {"message": "Assessment deleted successfully"}
