from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Use docker DB URL if running from host but targeting docker DB
# In docker-compose, port 5432 is mapped to 5433 on host
db_url = "postgresql://postgres:120303@localhost:5433/nexthire"

engine = create_engine(db_url)

try:
    with engine.connect() as conn:
        print("Running migration...")
        conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS meet_link VARCHAR;"))
        conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS gcal_event_id VARCHAR;"))
        conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interview_mean VARCHAR;"))
        conn.execute(text("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assessment_results JSON DEFAULT '[]';"))
        conn.execute(text("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS applied_job VARCHAR;"))
        conn.commit()
        print("Success: All columns verified/added.")
except Exception as e:
    print(f"Failed: {e}")
