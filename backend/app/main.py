from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import engine, Base
from app.api.v1 import (
    auth, routes_jobs, routes_candidates, routes_sync, 
    routes_interviews, routes_emails, routes_assessments, routes_submissions
)

# Create database tables
try:
    from app.models import job, candidate, interview, assessment, submission  # noqa: F401
    Base.metadata.create_all(bind=engine)
    print("Database tables ensured.")
except Exception as e:
    print(f"Error creating database tables: {e}")

app = FastAPI(title="HireAI Backend")

# ... previous middleware config ...
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
            conn.commit()
        return {"status": "success", "message": "Candidates schema updated (verified: assessment_results, applied_job)."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/")
def read_root():
    return {"message": "Welcome to HireAI API"}
