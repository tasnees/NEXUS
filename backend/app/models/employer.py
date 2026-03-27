from sqlalchemy import Column, Integer, String, Enum
from app.config.database import Base
import enum

class UserRole(str, enum.Enum):
    ta = "ta" #talent acquisition
    hm = "hm" #hiring manager
    rl = "rl" #recruiter
    hp = "hp" #hiring partner
    other = "other"

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True) 
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False) 
    role = Column(String, nullable=True)
