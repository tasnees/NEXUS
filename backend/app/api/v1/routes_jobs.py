from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.config.database import get_db
from app.models.job import Job
from app.schemas.job import JobResponse, JobCreate

router = APIRouter()

@router.post("/", response_model=JobResponse)
async def create_job(job: JobCreate, db: Session = Depends(get_db)):
    try:
        from app.utils.job_enrichment import enrich_job_details

        # Enrich missing information with AI if needed
        ai_data = await enrich_job_details(job.title)
        
        # Merge AI data if user fields are empty
        description = job.description or ai_data.get("description", "")
        requirements = job.requirements or ai_data.get("requirements", "")
        salary = job.salary or ai_data.get("salary", "Competitive")
        tags = job.tags if job.tags and len(job.tags) > 0 else ai_data.get("tags", ["Gen AI", "Modern Talent"])

        location_map = {"onsite": "Onsite", "online": "Remote", "hybrid": "Hybrid"}
        location = location_map.get(job.nature.lower(), "Remote")
        
        db_job = Job(
            title=job.title,
            company_logo="https://lh3.googleusercontent.com/aida-public/AB6AXuBXUe0dmBI_6Ahqs12jg49xCqnskPbWVbJiDJo-a8JpMvraRUoQRiVW2GPG0395sCABn0bzSPqmE4NlyGxXLNTx_YyDFK6QXj51d6Rf8aDLbxfrwWO4bUxQ_ixa3KvJaqDCBNZK5t-66FlUyxvWpYp0dOSwdLAoGZlEF5CtWnRYOC9K9L1GMnUZ9zbZnpADAd0E38c0U_DmPBkK0mMmYJzOwQ-AwpFqF1GOJethPdY5gsGaKxVbl2Z4pyv_nCU7EB_cA9aoDwjyEENM",
            location=location,
            posted_at="Posted just now", 
            status=job.status,
            applicants=0,
            match_rate=0,
            interviewed=0,
            tags=tags,
            company=job.company,
            salary=salary,
            time_per_week=job.timePerWeek,
            nature=job.nature,
            requirements=requirements,
            description=description
        )
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        return db_job
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise

from app.models.candidate import Candidate
from app.models.interview import Interview
from sqlalchemy import func

@router.get("/", response_model=List[JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    
    # Process each job to calculate dynamic metrics
    for job in jobs:
        # 1. Total Applicants: Count candidates where applied_job matches job.title
        applicant_count = db.query(Candidate).filter(Candidate.applied_job == job.title).count()
        job.applicants = applicant_count
        
        # 2. Total Interviewed: Count interviews where role matches job.title
        interview_count = db.query(Interview).filter(Interview.role == job.title).count()
        job.interviewed = interview_count
        
        # 3. Avg Match Rate: For now, we simulate this based on a random seed or skill match 
        # (In a real scenario, this would be an average of candidate.match_score)
        # For demo purposes, we'll return a dynamic yet stable value if there are applicants
        if applicant_count > 0:
            job.match_rate = min(98, 75 + (applicant_count % 20)) # Simulating higher quality for more applicants
        else:
            job.match_rate = 0
            
    return jobs


class JobDetail(JobResponse):
    """Extended response that includes requirements and description for heuristic analysis."""
    company: str | None = None
    salary: str | None = None
    requirements: str | None = None
    description: str | None = None

    class Config:
        from_attributes = True


@router.get("/by-title/{title}", response_model=JobDetail)
def get_job_by_title(title: str, db: Session = Depends(get_db)):
    """
    Fetch a single job by its title (case-insensitive).
    Used by the candidate profile to derive dynamic heuristic categories.
    """
    from sqlalchemy import func as sql_func
    job = db.query(Job).filter(
        sql_func.lower(Job.title) == title.lower()
    ).first()
    if not job:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job not found")
    return job
