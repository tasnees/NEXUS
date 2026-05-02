from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import engine, Base
from app.api.v1 import (
    auth, routes_jobs, routes_candidates, routes_sync, 
    routes_interviews, routes_emails, routes_assessments, routes_submissions,
    routes_ai
)

# Create database tables
try:
    from app.models import job, candidate, interview, assessment, submission, sync_history  # noqa: F401
    Base.metadata.create_all(bind=engine)
    print("Database tables ensured.")
except Exception as e:
    print(f"Error creating database tables: {e}")

app = FastAPI(title="HireAI Backend")

# CORS Configuration (Broadened for stable development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(routes_jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(routes_candidates.router, prefix="/api/v1/candidates", tags=["Candidates"])
app.include_router(routes_sync.router, prefix="/api/v1/sync", tags=["Drive Sync"])
app.include_router(routes_interviews.router, prefix="/api/v1/interviews", tags=["Interviews"])
app.include_router(routes_emails.router, prefix="/api/v1/emails", tags=["Emails"])
app.include_router(routes_assessments.router, prefix="/api/v1/assessments", tags=["Assessments"])
app.include_router(routes_submissions.router, prefix="/api/v1/submissions", tags=["Submissions"])
app.include_router(routes_ai.router, prefix="/api/v1/ai", tags=["AI Integration"])


@app.get("/migrate")
def run_migration():
    """
    Temporary route to add missing results column to the candidates table.
    Ensures that the schema stays in sync with current models.
    """
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            print("Running migration via API...")
            # Add assessment_results if it doesn't exist
            conn.execute(text("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assessment_results JSON DEFAULT '[]';"))
            # Also ensure applied_job exists (added previously)
            conn.execute(text("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS applied_job VARCHAR;"))
            
            # Add gcal_event_id to interviews
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS gcal_event_id VARCHAR;"))
            
            # Add steps to assessments
            conn.execute(text("ALTER TABLE assessments ADD COLUMN IF NOT EXISTS steps JSON DEFAULT '[]';"))
            # Add focus to assessments
            conn.execute(text("ALTER TABLE assessments ADD COLUMN IF NOT EXISTS focus JSON DEFAULT '[]';"))
            
            # Patch existing placeholders with Job-Relevant Minimalist Specs
            conn.execute(text("""
                UPDATE assessments 
                SET title = 'EcoTrack: Web UI Prototype',
                    description = '### THE TASK\nDesign a functional, responsive landing page layout for "EcoTrack", a carbon footprint tracking app.\n\n### REQUIREMENTS\n- Must include a clear navigation, hero section, and features grid.\n- Focus on UI/UX flow and responsive grid layout.\n- Use a professional, tech-forward color palette.',
                    steps = '["Plan the page layout and navigation structure","Build the Hero section with a CTA focus","Implement a 3-column Features grid for mobile/desktop","Refine the UI with modern spacing and typography"]'::json
                WHERE job_id = 5;
                
                UPDATE assessments 
                SET title = 'EcoTrack: Brand Identity & Assets',
                    description = '### THE TASK\nCreate a cohesive brand identity and a set of vector assets for the "EcoTrack" startup.\n\n### REQUIREMENTS\n- Design a minimalist, eco-friendly logo (SVG format preferred).\n- Define a primary and secondary color palette.\n- Create a set of 3 custom icons representing "Data", "Community", and "Earth".',
                    steps = '["Concept and sketch the primary logomark","Select a typography system and color palette","Build the vector-based iconography set","Export assets in professional formats (PNG/SVG)"]'::json
                WHERE job_id = 4;
                
                UPDATE assessments 
                SET title = 'Attention Mechanism Hook',
                    description = '### THE TASK\nImplement a custom PyTorch module for a multi-head attention hook.\n\n### REQUIREMENTS\n- Function must accept query, key, value tensors.\n- Must implement a dropout layer for regularization.\n- Must be compatible with standard PyTorch 2.x Autograd.',
                    steps = '["Extend `nn.Module` class","Define linear projections for Q, K, V","Implement scaled dot-product logic","Apply dropout and return output"]'::json
                WHERE job_id = 1;
            """))
            
            conn.commit()
        return {"status": "success", "message": "Schema updated and Job-Relevant Specs successfully patched."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/")
def read_root():
    return {"message": "Welcome to HireAI API"}
