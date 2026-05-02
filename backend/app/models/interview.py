from sqlalchemy import Column, Integer, String, DateTime, Enum
from app.config.database import Base
import enum

class InterviewType(str, enum.Enum):
    TECHNICAL = "technical"
    SCREENING = "screening"
    FINAL = "final"

class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String, index=True)
    role = Column(String)
    date = Column(DateTime)
    interview_type = Column(String) # Replaced Enum with String for simplicity in Postgres migrations
    status = Column(String, default="scheduled")
    gcal_event_id = Column(String, nullable=True, index=True)
