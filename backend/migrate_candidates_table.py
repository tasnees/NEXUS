"""
Adds the 'candidates' table to the PostgreSQL database.
Run once after pulling this update.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.config.database import engine, Base
from app.models import candidate  # noqa – registers the model

def migrate():
    print("Creating 'candidates' table if it doesn't exist …")
    Base.metadata.create_all(bind=engine, checkfirst=True)
    print("Done.")

if __name__ == "__main__":
    migrate()
