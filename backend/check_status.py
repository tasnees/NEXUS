import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def check():
    print(f"Connecting to: {DATABASE_URL}")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("\nCandidates in DB:")
        cur.execute("SELECT name, applied_job FROM candidates")
        rows = cur.fetchall()
        for row in rows:
            print(f"  - {row[0]}: {row[1]}")
            
        print("\nJobs in DB:")
        cur.execute("SELECT title FROM jobs")
        jobs = cur.fetchall()
        for job in jobs:
            print(f"  - Job Title: {job[0]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
