from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.config.database import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    duration = Column(String)
    difficulty = Column(String)
    focus = Column(JSON) # e.g. ["Python", "React"]
    description = Column(String)
    
    # Each assessment belongs to one job
    job_id = Column(Integer, ForeignKey("jobs.id"))
    job = relationship("Job")
