import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# From host (Windows), we must use the MAPPED port 5433 defined in docker-compose.yml
db_url = "postgresql://postgres:120303@localhost:5433/nexthire"

print(f"Connecting to Dockerized DB at {db_url}...")
try:
    engine = create_engine(db_url)
    commands = [
        "ALTER TABLE interviews ADD COLUMN IF NOT EXISTS candidate_email VARCHAR;",
        "ALTER TABLE interviews ADD COLUMN IF NOT EXISTS transcript JSON DEFAULT '[]';",
        "ALTER TABLE interviews ADD COLUMN IF NOT EXISTS ai_evaluation JSON;"
    ]

    with engine.connect() as conn:
        for cmd in commands:
            try:
                print(f"Executing: {cmd}")
                conn.execute(text(cmd))
                conn.commit()
                print("SUCCESS")
            except Exception as e:
                print(f"FAILED: {e}")
                conn.rollback()
    print("Migration finished on nexthire-db.")
except Exception as global_e:
    print(f"GLOBAL ERROR: {global_e}")
