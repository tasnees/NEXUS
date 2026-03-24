from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import engine, Base
from app.api.v1 import (
    auth, routes_jobs, routes_candidates, routes_sync, 
    routes_interviews, routes_emails, routes_assessments
)

# Create database tables
try:
    from app.models import job, candidate, interview, assessment  # noqa: F401
    Base.metadata.create_all(bind=engine)
    print("Database tables ensured.")
except Exception as e:
    print(f"Error creating database tables: {e}")

app = FastAPI(title="HireAI Backend")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
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

@app.get("/")
def read_root():
    return {"message": "Welcome to HireAI API"}
