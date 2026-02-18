from sqlalchemy import Column, Integer, String
from app.config.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    # Keeping existing fields but making them optional or manageable if they exist in the DB
    company_name = Column(String, nullable=True)
    role = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)

