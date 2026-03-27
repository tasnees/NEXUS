import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def fix_candidates():
    print(f"Connecting to database for DYNAMIC repair...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # 1. Fetch all possible jobs for dynamic matching
        cur.execute("SELECT title FROM jobs")
        all_jobs = [r[0] for r in cur.fetchall()]
        
        # 2. Provide names where missing
        cur.execute("SELECT id, filename FROM candidates WHERE name IS NULL OR name = 'None' OR name = ''")
        for cid, filename in cur.fetchall():
            guess = filename.split('.')[0].replace('_', ' ').replace('-', ' ').replace('CV', '').replace('resume', '').strip()
            cur.execute("UPDATE candidates SET name = %s WHERE id = %s", (guess, cid))

        # 3. Dynamic Job Matcher based on Database Titles
        cur.execute("SELECT id, filename FROM candidates WHERE applied_job = 'Uncategorized' OR applied_job IS NULL")
        for cid, filename in cur.fetchall():
            lower_file = filename.lower()
            new_job = "Uncategorized"
            
            for job_title in all_jobs:
                # Get core keywords (e.g. "Graphic" and "Design" from "Graphic Design")
                keywords = [k.lower().strip() for k in job_title.split() if len(k) > 3]
                if any(k in lower_file for k in keywords):
                    new_job = job_title
                    break
            
            if new_job != "Uncategorized":
                print(f"  - Dynamically Matched {filename} -> {new_job}")
                cur.execute("UPDATE candidates SET applied_job = %s WHERE id = %s", (new_job, cid))

        conn.commit()
        cur.close()
        conn.close()
        print("\n✅ Dynamic repair complete!")
    except Exception as e:
        print(f"Error during repair: {e}")

if __name__ == "__main__":
    fix_candidates()
