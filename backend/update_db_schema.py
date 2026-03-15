from app.config.database import engine, Base
from app.models.job import Job

def update_db():
    print("Ensuring all tables are created and updated...")
    # This will create tables if they don't exist, but won't add columns to existing ones
    Base.metadata.create_all(bind=engine)
    
    from sqlalchemy import text
    with engine.connect() as conn:
        # Check for missing columns and add them
        columns_to_add = {
            "company": "VARCHAR",
            "salary": "VARCHAR",
            "time_per_week": "VARCHAR",
            "nature": "VARCHAR",
            "requirements": "VARCHAR",
            "description": "VARCHAR"
        }
        
        # Get existing columns
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs'"))
        existing_columns = [row[0] for row in result]
        
        for col, col_type in columns_to_add.items():
            if col not in existing_columns:
                print(f"Adding column {col} to jobs table...")
                conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Column {col} added.")
            else:
                print(f"Column {col} already exists.")

if __name__ == "__main__":
    update_db()
