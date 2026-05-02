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
    print(f"DEBUG: Generating AI assessment for {job.title}...")
    ai = puter.PuterAI(token=PUTER_TOKEN)
    default_duration = "3 Hours" 
    prompt = f"""Generate a Minimalist Technical Spec for a {job.title} assessment.
JOB REQUIREMENTS: {job.requirements}
JOB KEY-SKILLS: {job.tags}
DIFFICULTY: {difficulty}
DURATION: {default_duration}

CRITICAL: The brief must be CONCISE, ATOMIC, and COMPLETELY DOABLE in {default_duration}.
CRITICAL: The task MUST BE DIRECTLY RELEVANT to the {job.title} role.
- IF DESIGN ROLE: Focus on visual hierarchy, user interface components, responsiveness, and aesthetic functionalism (like your EcoTrack example).
- IF ENGINEERING ROLE: Focus on logic, data structures, algorithms, or system architecture (like PyTorch modules).

CHALLENGE FORMAT:
1. THE TASK: Exactly one sentence describing the technical feature to build.
2. REQUIREMENTS: 3-4 bullet points of specific, non-vague constraints.
3. OUTPUT: What exactly goes in the box (e.g. 'One React component', 'One Python function').

EXPECTED OUTPUT (Strict JSON only):
{{
  "title": "Short descriptive title",
  "required_format": "python" (or "javascript", "css", "java", "sql", "html", etc. based on job requirements),
  "description": "### THE TASK\n[One sentence task description]\n\n### REQUIREMENTS\n- [Constraint 1]\n- [Constraint 2]\n- [Constraint 3]",
  "steps": [
    "Write the [specific component/function] signature.",
    "Implement the [specific logic] functionality.",
    "Handle the [specific edge case] explicitly.",
    "Verify [specific result] matches expectations."
  ],
  "duration": "{default_duration}",
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
        
        # Aggressive JSON list parsing
        def to_list(val, fallback):
            if not val: return fallback
            if isinstance(val, list): return val
            if isinstance(val, str):
                try: 
                    # Try direct load
                    res = json.loads(val)
                    return res if isinstance(res, list) else [res]
                except: 
                    # Try cleaning brackets if it's a mangled string
                    try:
                        import re
                        clean = re.sub(r'^[^\[]*|[^\]]*$', '', val)
                        res = json.loads(clean)
                        return res if isinstance(res, list) else [res]
                    except: return [val]
            return [str(val)]

        steps_raw = to_list(data.get("steps"), [])
        focus_raw = to_list(data.get("focus"), ["Innovation", "Optimization", "Architecture"])

        assessment = Assessment(
            title=data.get("title", f"{job.title} Evaluation"),
            description=data.get("description", "Task details pending..."),
            steps=steps_raw,
            duration=data.get("duration", default_duration),
            difficulty=difficulty,
            focus=focus_raw,
            required_format=data.get("required_format", "text"),
            job_id=job_id
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        return assessment
    except Exception as e:
        print(f"CRITICAL AI ERROR: {e}")
        db.rollback() # CRITICAL: Reset the session after the failure
        # Patching description for a safe fallback if AI fails entirely
        safe_assessment = Assessment(
            title=f"{job.title} Evaluation",
            description="### THE TASK\nImplement a core feature related to your role.\n\n### REQUIREMENTS\n- Maintain clean code standards.\n- Handle basic error cases.\n- Ensure responsiveness/performance.",
            steps=["Analyze requirements","Setup environment","Execute core logic","Test functionality"],
            duration="2 Hours",
            difficulty=difficulty,
            focus=["Engineering", "Execution", "Problem Solving"],
            required_format="text",
            job_id=job_id
        )
        db.add(safe_assessment)
        db.commit()
        db.refresh(safe_assessment)
        return safe_assessment

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
