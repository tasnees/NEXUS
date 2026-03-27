from app.config.database import engine
from sqlalchemy import text

def check_candidates():
    with engine.connect() as conn:
        print("\nChecking candidates and their jobs...")
        result = conn.execute(text("SELECT name, applied_job FROM candidates LIMIT 20"))
        for row in result:
            print(f"Name: {row[0]}, Job: {row[1]}")
        
        print("\nJob counts:")
        result = conn.execute(text("SELECT applied_job, count(*) FROM candidates GROUP BY applied_job"))
        for row in result:
            print(f"Job: {row[0]}, Count: {row[1]}")

if __name__ == "__main__":
    check_candidates()
