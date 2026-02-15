from sqlalchemy import Column, Integer, String, Enum
from app.config.database import Base
import enum

class UserRole(str, enum.Enum):
    ta = "ta"
    hm = "hm"
    rl = "rl"
    hp = "hp"
    other = "other"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    company_name = Column(String)
    role = Column(String) # Storing as string for simplicity or UserRole enum
    hashed_password = Column(String)
