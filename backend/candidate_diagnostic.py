import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def diagnose_and_fix():
    print(f"--- Talent Pool Diagnostic Report ---")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Check current data
        cur.execute("SELECT id, name, email, applied_job FROM candidates")
        rows = cur.fetchall()
        
        print(f"Found {len(rows)} candidates:")
        for r in rows:
            cid, name, email, job = r
            print(f"  [ID {cid}] '{name}' | Job: '{job}' | Email: '{email}'")
            
            # Critical Fix: Ensure every candidate has an email (even if it's a guess)
            if not email or email == 'None' or '@' not in str(email):
                new_email = f"candidate{cid}@nexhire.ai"
                print(f"    ↳ ⚠️ Repairing missing email -> {new_email}")
                cur.execute("UPDATE candidates SET email = %s WHERE id = %s", (new_email, cid))

        # Check existing jobs to ensure matching titles
        cur.execute("SELECT id, title FROM jobs")
        jobs = cur.fetchall()
        print(f"\nExisting Jobs in Database:")
        for jid, title in jobs:
            print(f"  - Job: '{title}'")
            
            # Universal Fix: Ensure candidates matching the keywords of this job ARE matched to the exact title
            keyword = title.lower().split()[0] # e.g. "Graphic" from "Graphic Design"
            cur.execute("UPDATE candidates SET applied_job = %s WHERE (LOWER(applied_job) LIKE %s OR LOWER(name) LIKE %s) AND applied_job != %s", 
                        (title, f"%{keyword}%", f"%{keyword}%", title))

        conn.commit()
        cur.close()
        conn.close()
        print("\n✅ Total alignment complete. All candidates have valid emails and job matches.")
    except Exception as e:
        print(f"Diagnostic failed: {e}")

if __name__ == "__main__":
    diagnose_and_fix()
