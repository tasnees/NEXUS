from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.config.database import get_db
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateCreate, CandidateResponse

router = APIRouter()


@router.get("/", response_model=List[CandidateResponse])
def list_candidates(db: Session = Depends(get_db)):
    """Return all candidate profiles."""
    candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).all()
    
    # If no candidates exist, return demo data to seed the DB
    if not candidates:
        demo_candidates = [
            {
                "drive_file_id": "demo_1",
                "filename": "maya_sterling_cv.pdf",
                "name": "Maya Sterling",
                "email": "maya.s@neural.ai",
                "skills": ["Python", "PyTorch", "Node.js"],
                "summary": "AI Architect with 10+ years of experience.",
                "applied_job": "Principal Neural Architect"
            },
            {
                "drive_file_id": "demo_2",
                "filename": "lex_corvus_cv.pdf",
                "name": "Lex Corvus",
                "email": "lex@cyber.io",
                "skills": ["Rust", "WASM", "Distributed Systems"],
                "summary": "Systems engineer specializing in high-performance computing.",
                "applied_job": "Senior MLOps Engineer"
            },
            {
                "drive_file_id": "demo_3",
                "filename": "sara_oak_cv.pdf",
                "name": "Sara Oak",
                "email": "sara@green.tech",
                "skills": ["React", "TypeScript", "D3.js"],
                "summary": "Frontend lead and data visualization expert.",
                "applied_job": "Director of Product (Gen AI)"
            }
        ]
        for data in demo_candidates:
            c = Candidate(**data)
            db.add(c)
        db.commit()
        candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).all()
        
    return candidates


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.post("/", response_model=CandidateResponse, status_code=201)
def create_or_update_candidate(payload: CandidateCreate, db: Session = Depends(get_db)):
    """
    Upsert a candidate profile by drive_file_id.
    Used by the orchestrator to push newly-processed resumes into the DB.
    If the file was already processed, it updates the existing record.
    """
    existing = db.query(Candidate).filter(
        Candidate.drive_file_id == payload.drive_file_id
    ).first()

    if existing:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing

    candidate = Candidate(**payload.model_dump())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.delete("/{candidate_id}", status_code=204)
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(candidate)
    db.commit()
