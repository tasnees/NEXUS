from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.config.database import Base

class AssessmentSubmission(Base):
    __tablename__ = "assessment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    candidate_email = Column(String, index=True)
    answer = Column(Text)
    grade = Column(String, nullable=True)
    score = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    assessment = relationship("Assessment")
