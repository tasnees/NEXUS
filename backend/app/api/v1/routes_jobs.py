from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.config.database import get_db
from app.models.job import Job
from app.schemas.job import JobResponse, JobCreate

router = APIRouter()

@router.post("/", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    try:
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
            tags=job.tags,
            company=job.company,
            salary=job.salary,
            time_per_week=job.timePerWeek,
            nature=job.nature,
            requirements=job.requirements,
            description=job.description
        )
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        return db_job
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise

@router.get("/", response_model=List[JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    
    # If no jobs exist, return the demo data from the UI to initialize the DB or just for testing
    if not jobs:
        demo_jobs = [
            {
                "title": "Principal Neural Architect",
                "company_logo": "https://lh3.googleusercontent.com/aida-public/AB6AXuBXUe0dmBI_6Ahqs12jg49xCqnskPbWVbJiDJo-a8JpMvraRUoQRiVW2GPG0395sCABn0bzSPqmE4NlyGxXLNTx_YyDFK6QXj51d6Rf8aDLbxfrwWO4bUxQ_ixa3KvJaqDCBNZK5t-66FlUyxvWpYp0dOSwdLAoGZlEF5CtWnRYOC9K9L1GMnUZ9zbZnpADAd0E38c0U_DmPBkK0mMmYJzOwQ-AwpFqF1GOJethPdY5gsGaKxVbl2Z4pyv_nCU7EB_cA9aoDwjyEENM",
                "location": "Austin, TX",
                "posted_at": "Posted 2 days ago",
                "status": "Live Posting",
                "applicants": 48,
                "match_rate": 92,
                "interviewed": 12,
                "tags": ["PyTorch", "Distributed Systems"]
            },
            {
                "title": "Senior MLOps Engineer",
                "company_logo": "https://lh3.googleusercontent.com/aida-public/AB6AXuBXAJqZSdeZJRJgYbzeqjAKNplDLbJ3PTxuzQUNkJKQ643lr8SN-_cuiwlcKmYoxqUslVFau2cGeWenp1IHW4FR4xWTNJ6vDGFA2scYZsKqtI5-CGAnrJwureBfaVPVS9Zh9JdgBnbtlY4f1lsAB-8H_bXC2XvqjLB9Sz9bN4pTvhvJDVRFbLbcuUHd9vSZmJJlqdyWuhHpprAWUt65ZWDrv5WDABgWptGPCNRQkXfFRk9gU_SM9myUtJBQrmjNkRUfQRUDMw18ckTT",
                "location": "Remote",
                "posted_at": "Posted 5 days ago",
                "status": "Action Required",
                "applicants": 156,
                "match_rate": 85,
                "interviewed": 3,
                "tags": ["Kubernetes", "Terraform"]
            },
            {
                "title": "Director of Product (Gen AI)",
                "company_logo": "https://lh3.googleusercontent.com/aida-public/AB6AXuByDir7XIdCHyPtSmLy31zsy9FR3d_l2pfX44YKo8Frwz-Gn1CGuq7qxLV6ZUjRhw4lXMvyNP8-wPTSiX8sExN5woHDWKNQv9QtMdPCMn3yRPTEcmU4W8n1MLhOu-0w27drP843bMYODrgv8ulizjprqMoZ6ZkH0HfL4pa498QS7dqqdgIl5qQOCn7WXE1_BZUpqBQzruC2uX8wFyHlslrelaaSrb5poJC6QuVkIeBK958I2S7D0Fa6Tto9uqwcpBM0rASkvIj1Qcnn",
                "location": "London, UK",
                "posted_at": "Posted 1 week ago",
                "status": "Live Posting",
                "applicants": 32,
                "match_rate": 97,
                "interviewed": 8,
                "tags": ["Product Strategy", "NLP"]
            }
        ]
        # Seed the DB with demo data if empty
        for job_data in demo_jobs:
            db_job = Job(**job_data)
            db.add(db_job)
        db.commit()
        jobs = db.query(Job).all()
        
    return jobs
