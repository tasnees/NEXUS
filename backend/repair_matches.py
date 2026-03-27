import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def repair_matches():
    print(f"--- Bulk Talent Matcher (Production Repair) ---")
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env")
        return
        
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Pointing everyone to 'graphic designer' for this test
            target_job = "graphic designer"
            print(f"Assigning ALL 5 candidates to job: '{target_job}'")
            
            # Update all candidates
            res = conn.execute(
                text("UPDATE candidates SET applied_job = :title"), 
                {"title": target_job}
            )
            conn.commit()
            
            print(f"\n✅ SUCCESSFULLY REPAIRED {res.rowcount} candidates.")
            print(f"Now go to http://localhost:5173/assessments")
            print(f"Find 'graphic designer' and click 'Launch'!")

    except Exception as e:
        print(f"Repair failed: {e}")

if __name__ == "__main__":
    repair_matches()
