from app.config.database import engine
from sqlalchemy import text

def check_db():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs'"))
        columns = [row[0] for row in result]
        print(f"Columns in 'jobs' table: {columns}")

if __name__ == "__main__":
    check_db()
