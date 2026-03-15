from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import engine, Base
from app.api.v1 import auth, routes_jobs, routes_candidates

# Create database tables
from app.models import job  # noqa: F401 – ensures Job table is registered
from app.models import candidate  # noqa: F401 – ensures Candidate table is registered
Base.metadata.create_all(bind=engine)

app = FastAPI(title="HireAI Backend")

# CORS Configuration
# Note: When allow_credentials=True, allow_origins cannot be ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Explicitly allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(routes_jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(routes_candidates.router, prefix="/api/v1/candidates", tags=["Candidates"])

@app.get("/")
def read_root():
    return {"message": "Welcome to HireAI API"}
