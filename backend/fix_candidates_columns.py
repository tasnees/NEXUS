import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.config.database import engine

def fix_candidates_columns():
    print("Updating 'candidates' table schema...")
    queries = [
        "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assessment_results JSON DEFAULT '[]';",
    ]
    
    with engine.connect() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
                print(f"Executed: {q}")
            except Exception as e:
                print(f"Skipped/Failed query [{q}]: {e}")
        conn.commit()
    print("Done.")

if __name__ == "__main__":
    fix_candidates_columns()
