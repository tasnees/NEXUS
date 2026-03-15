from sqlalchemy import Column, Integer, String, Float, JSON
from app.config.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    company_logo = Column(String)
    location = Column(String)
    posted_at = Column(String) # e.g., "Posted 2 days ago"
    status = Column(String) # e.g., "Live Posting"
    applicants = Column(Integer, default=0)
    match_rate = Column(Integer, default=0)
    interviewed = Column(Integer, default=0)
    tags = Column(JSON) # Store list of tags
    
    # New fields appended from job posting form
    company = Column(String, nullable=True)
    salary = Column(String, nullable=True)
    time_per_week = Column(String, nullable=True)
    nature = Column(String, nullable=True)
    requirements = Column(String, nullable=True)
    description = Column(String, nullable=True)
