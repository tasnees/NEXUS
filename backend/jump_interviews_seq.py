from app.config.database import SessionLocal
from sqlalchemy import text

def jump_sequence():
    db = SessionLocal()
    try:
        db.execute(text("SELECT setval(pg_get_serial_sequence('interviews', 'id'), 100)"))
        db.commit()
        print("SUCCESS: Sequence jumped to 100")
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    jump_sequence()
