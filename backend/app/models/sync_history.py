from sqlalchemy import Column, Integer, String, DateTime, func
from app.config.database import Base

class SyncHistory(Base):
    """
    Stores the results of recruitment sync operations.
    """
    __tablename__ = "sync_history"

    id          = Column(Integer, primary_key=True, index=True)
    timestamp   = Column(DateTime(timezone=True), server_default=func.now())
    status      = Column(String)      # "success", "failed", "running"
    processed   = Column(Integer, default=0)
    skipped     = Column(Integer, default=0)
    failed      = Column(Integer, default=0)
    error       = Column(String, nullable=True)
