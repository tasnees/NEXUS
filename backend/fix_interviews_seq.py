from app.config.database import SessionLocal
from sqlalchemy import text

def fix_interview_sequence():
    db = SessionLocal()
    try:
        # Check if table has data
        result = db.execute(text("SELECT MAX(id) FROM interviews")).fetchone()
        max_id = result[0] if result and result[0] else 0
        
        # Reset the Postgres sequence dynamically
        sql = f"SELECT setval(pg_get_serial_sequence('interviews', 'id'), {max_id + 1}, false)"
        db.execute(text(sql))
        db.commit()
        print(f"SUCCESS: Interview sequence reset to {max_id + 1}")
    except Exception as e:
        print(f"ERROR: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_interview_sequence()
