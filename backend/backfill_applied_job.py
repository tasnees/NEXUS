import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def backfill_candidates():
    updates = [
        ("Maya Sterling", "Principal Neural Architect"),
        ("Lex Corvus", "Senior MLOps Engineer"),
        ("Sara Oak", "Director of Product (Gen AI)")
    ]
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        for name, job in updates:
            print(f"Backfilling {name} with job: {job}...")
            cur.execute("""
                UPDATE candidates 
                SET applied_job = %s 
                WHERE name = %s AND applied_job IS NULL;
            """, (job, name))
        
        conn.commit()
        cur.close()
        conn.close()
        print("Backfill complete! Existing talent pool is now mapped to roles.")
    except Exception as e:
        print(f"Backfill failed: {e}")

if __name__ == "__main__":
    backfill_candidates()
