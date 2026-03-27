import os
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def check_integrity():
    print(f"--- Database Integrity Report ---")
    print(f"Target URL: {DATABASE_URL}")
    
    try:
        # Check connection
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Check if table 'candidates' exists
        cur.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'candidates'")
        exists = cur.fetchone()[0]
        
        if not exists:
            print("❌ ERROR: 'candidates' table DOES NOT EXIST in this database.")
        else:
            cur.execute("SELECT count(*) FROM candidates")
            count = cur.fetchone()[0]
            print(f"✅ 'candidates' table exists. Current Row Count: {count}")
            
            if count == 0:
                print("⚠️  WARNING: Table is EMPTY. Forcing Re-Sync...")
                # We need to manually reset the sync markers because the DB is empty
                # No marker reset needed since sync markers are only in the DB we just checked
                os.system("python drive_sync_orchestrator.py")
            else:
                print(f"Sample Candidate Labels: ")
                cur.execute("SELECT applied_job FROM candidates LIMIT 3")
                labels = cur.fetchall()
                for l in labels:
                    print(f"  - '{l[0]}'")

        conn.close()
        print("\n🏆 Diagnosis complete.")
    except Exception as e:
        print(f"Database connection failed: {e}")

if __name__ == "__main__":
    check_integrity()
