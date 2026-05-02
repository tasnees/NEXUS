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
    steps = Column(JSON, default=list) # Step-by-step instructions
    required_format = Column(String, default="text") # e.g. "python", "javascript", "css", "markdown"
    
    # Each assessment belongs to one job
    job_id = Column(Integer, ForeignKey("jobs.id"))
    job = relationship("Job")

    # Grading Intelligence
    grading_threshold = Column(Integer, default=70) # Passing percentage
    auto_reject = Column(Integer, default=0) # 1 for True, 0 for False (or use Boolean)
    evaluation_nodes = Column(JSON, default=list) # e.g. ["Code Quality", "Efficiency"]
