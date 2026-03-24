from sqlalchemy import Column, Integer, String, JSON, DateTime, func
from app.config.database import Base


class Candidate(Base):
    """
    Stores a candidate profile synthesized from a resume.
    Each row represents one person.  The 'drive_file_id' column is the
    unique Google Drive file-id used as an idempotency key so the
    orchestrator never processes the same file twice.
    """
    __tablename__ = "candidates"

    id              = Column(Integer, primary_key=True, index=True)
    drive_file_id   = Column(String, unique=True, index=True, nullable=False)
    filename        = Column(String, nullable=False)

    # --- Claude-extracted fields ---
    name            = Column(String, nullable=True)
    email           = Column(String, nullable=True, index=True)
    phone           = Column(String, nullable=True)
    summary         = Column(String, nullable=True)
    skills          = Column(JSON, default=list)     # ["Python", "FastAPI", ...]
    experience      = Column(JSON, default=list)     # ["Title at Co (dates): desc", ...]
    education       = Column(JSON, default=list)     # ["BSc CS, MIT (2020)", ...]
    applied_job     = Column(String, nullable=True)  # "Senior Neural Architect", etc.

    # --- raw text (useful for re-analysis later) ---
    raw_text        = Column(String, nullable=True)

    # --- housekeeping ---
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())
