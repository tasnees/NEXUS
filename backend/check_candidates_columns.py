import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.config.database import engine

def check_candidates_columns():
    print("Checking 'candidates' table columns...")
    with engine.connect() as conn:
        try:
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'candidates'"))
            columns = [row[0] for row in result]
            print(f"Columns in 'candidates': {columns}")
        except Exception as e:
            print(f"Error checking columns: {e}")

if __name__ == "__main__":
    check_candidates_columns()
