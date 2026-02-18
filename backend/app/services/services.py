from app.config.database import Base, engine
from app import models

def add_tables():
    Base.metadata.create_all(bind=engine)

