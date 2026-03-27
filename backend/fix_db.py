from sqlalchemy import text
from app.config.database import engine

def fix_users_table():
    queries = [
        # Add role if missing
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR;",
        # Add full_name if missing (replacing old 'name')
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR;",
        # Sync name to full_name if full_name is empty but name exists
        "UPDATE users SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;"
    ]
    
    with engine.connect() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
                print(f"Executed: {q}")
            except Exception as e:
                print(f"Skipped/Failed query [{q}]: {e}")
        conn.commit()
    print("Database schema synchronization complete.")

if __name__ == "__main__":
    fix_users_table()
