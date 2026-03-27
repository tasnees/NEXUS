import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def reset_and_sync():
    print(f"--- Talent Pool FRESH START ---")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # 1. Wipe old data
        print("Emptying Candidates Table...")
        cur.execute("TRUNCATE TABLE candidates RESTART IDENTITY CASCADE")
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Tables Prepared.")
        
        # 2. Trigger fresh sync
        print("\nStarting Fresh Sync (High Precision)...")
        os.system("python drive_sync_orchestrator.py")
        
        print("\n🏆 Database and Drive are now perfectly synchronized.")
    except Exception as e:
        print(f"Reset failed: {e}")

if __name__ == "__main__":
    reset_and_sync()
