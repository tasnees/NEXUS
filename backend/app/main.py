from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import engine, Base
from app.api.v1 import auth, routes_jobs

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="HireAI Backend")

# CORS Configuration
# Note: When allow_credentials=True, allow_origins cannot be ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Explicitly allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(routes_jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])

@app.get("/")
def read_root():
    return {"message": "Welcome to HireAI API"}
