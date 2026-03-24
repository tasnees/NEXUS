
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Add 'applied_job' column if it doesn't exist
        cur.execute("""
            ALTER TABLE candidates 
            ADD COLUMN IF NOT EXISTS applied_job VARCHAR;
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        print("Migrated 'candidates' table: Added 'applied_job' column.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
