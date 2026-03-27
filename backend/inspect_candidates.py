import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def inspect_candidates():
    print(f"--- Talent Pool Inspection ---")
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env")
        return
        
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Check Candidates
            print("\nActive Candidates:")
            res = conn.execute(text("SELECT id, name, email, applied_job FROM candidates"))
            rows = res.fetchall()
            if not rows:
                print("⚠️ EMPTY: No candidates found in database.")
            for row in rows:
                print(f"  - ID: {row.id} | Name: {row.name} | Applied Job: '{row.applied_job}'")

            # Check Jobs
            print("\nRegistered Jobs:")
            res = conn.execute(text("SELECT id, title FROM jobs"))
            rows = res.fetchall()
            for row in rows:
                print(f"  - ID: {row.id} | Title: '{row.title}'")

    except Exception as e:
        print(f"Inspection failed: {e}")

if __name__ == "__main__":
    inspect_candidates()
