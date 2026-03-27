import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def align_schema():
    print(f"--- Database Schema Alignment ---")
    print(f"Target URL: {DATABASE_URL}")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # 1. Add applied_job if it doesn't exist
        print("Checking/Adding 'applied_job' column...")
        cur.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS applied_job VARCHAR")
        
        # 2. Add assessment_results if it doesn't exist
        print("Checking/Adding 'assessment_results' column...")
        cur.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assessment_results JSON DEFAULT '[]'")

        conn.commit()
        cur.close()
        conn.close()
        print("\n✅ Database Schema aligned successfully.")
        
    except Exception as e:
        print(f"Alignment failed: {e}")

if __name__ == "__main__":
    align_schema()
