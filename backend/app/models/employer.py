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

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    company_name = Column(String)
    role = Column(String) 
    hashed_password = Column(String)
