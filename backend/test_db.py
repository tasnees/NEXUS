import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# We need to test the SAME port the backend is using inside Docker, or the mapped port.
# Since this script runs on the host, we use 5433.
db_url = "postgresql://postgres:120303@localhost:5433/nexthire"

print(f"Testing connection to {db_url}...")
try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT COUNT(*) FROM candidates"))
        count = res.scalar()
        print(f"SUCCESS: Connected. Total candidates: {count}")
except Exception as e:
    print(f"FAILED: {e}")
