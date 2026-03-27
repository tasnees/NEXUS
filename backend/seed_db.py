
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.config.database import SessionLocal, engine, Base
from app.models.candidate import Candidate
from app.models.job import Job

from app.models.assessment import Assessment

def seed():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if we already have jobs (demo or otherwise)
        if db.query(Job).count() <= 3: # Allow re-seeding if we only have the basics
            print("Seeding demo jobs...")
            demo_jobs = [
                {
                    "title": "Principal Neural Architect",
                    "company": "Neural Dynamics",
                    "location": "Remote",
                    "status": "Live Posting",
                    "tags": ["AI", "PyTorch", "Rust"],
                    "description": "Lead the design of next-gen neural network architectures."
                },
                {
                    "title": "Senior MLOps Engineer",
                    "company": "Cyber Systems",
                    "location": "Hybrid",
                    "status": "Live Posting",
                    "tags": ["Kubernetes", "MLflow", "Cloud"],
                    "description": "Scale machine learning workloads across distributed clusters."
                },
                {
                    "title": "Graphic Designer",
                    "company": "Aura Studios",
                    "location": "London, UK",
                    "status": "Live Posting",
                    "tags": ["Figma", "Branding", "Motion"],
                    "description": "We are seeking a creative powerhouse to lead our visual identity and craft world-class branding experiences."
                }
            ]
            for job_data in demo_jobs:
                # Check for existing title to avoid duplicates
                existing = db.query(Job).filter(Job.title == job_data["title"]).first()
                if not existing:
                    job = Job(**job_data)
                    db.add(job)
            db.commit()

        # Check for candidates
        if db.query(Candidate).count() <= 3:
            print("Seeding demo candidates...")
            demo_candidates = [
                {
                    "drive_file_id": "demo_4",
                    "filename": "casper_designer.pdf",
                    "name": "Casper Vibe",
                    "email": "casper@aura.design",
                    "skills": ["Figma", "AfterEffects", "UI/UX"],
                    "summary": "Creative Director with a focus on immersive brand experiences.",
                    "applied_job": "Graphic Designer",
                    "raw_text": "CASPER VIBE\nVisual Identity Expert\n\nExperience:\n- Creative Lead at Adobe (4 years)\n- Senior Designer at Pentagram (3 years)\n\nSkills: Figma, Branding, Motion Graphics, UX Strategy."
                }
            ]
            for data in demo_candidates:
                existing = db.query(Candidate).filter(Candidate.email == data["email"]).first()
                if not existing:
                    c = Candidate(**data)
                    db.add(c)
            db.commit()

        # Seed Detailed Assessments
        if db.query(Assessment).count() == 0:
            print("Seeding detailed assessments...")
            job_design = db.query(Job).filter(Job.title == "Graphic Designer").first()
            if job_design:
                detailed_desc = """
**PROMPT: REBRAND NEXUS AI ECOSYSTEM**

As our lead Graphic Designer candidate, your challenge is to conceptualize the visual language for our new AI-driven hiring platform, 'NEXUS'.

### THE CHALLENGE:
1. **Logo Concept**: Describe or sketch out (via documentation notes) the symbolism and typography choice for the NEXUS logo. How does it balance 'Neural Technology' with 'Human Connection'?
2. **Color Palette**: Propose a primary and secondary color scheme that avoids the 'generic corporate blue'. Explain the psychology behind your choices (e.g., using Slate, Emerald, or Prism accents).
3. **Typography System**: Recommend a type scale for our web application. Why did you choose specific fonts for headers vs. body text?
4. **Key Visual Element**: Describe a 'Super-graphic' or unique visual element (like a specific gradient style or glassmorphism effect) that makes the brand instantly recognizable in the dashboard.

### DELIVERABLES:
Please use the workspace to provide a structured Design System Proposal. Include the rationale for each visual decision and how it scales across web and social media.
                """
                assessment = Assessment(
                    title="NEXUS Visual Identity Challenge",
                    description=detailed_desc.strip(),
                    duration="3 Hours",
                    difficulty="Expert",
                    focus=["Brand Identity", "Design Systems", "Typography", "Visual Storytelling"],
                    job_id=job_design.id
                )
                db.add(assessment)
            db.commit()

        print("Seeding complete!")
            
    finally:
        db.close()

if __name__ == "__main__":
    seed()
