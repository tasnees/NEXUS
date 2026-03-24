import sys
import os
sys.path.append(os.getcwd())

from app.config.database import engine, Base
from sqlalchemy import text, inspect

def diagnose():
    try:
        print(f"Connecting to engine...")
        with engine.connect() as conn:
            print("Connected.")
            
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            print(f"Current tables: {tables}")
            
            if "interviews" in tables:
                print("Columns in 'interviews':")
                for col in inspector.get_columns("interviews"):
                    print(f" - {col['name']} ({col['type']})")
                
                print("DROPPING 'interviews'...")
                conn.execute(text("DROP TABLE interviews CASCADE"))
                print("Dropped.")
            
            print("RECREATING tables via metadata...")
            from app.models.interview import Interview
            Base.metadata.create_all(bind=engine)
            print("Created.")
            
            # Verify
            inspector = inspect(engine)
            if "interviews" in inspector.get_table_names():
                print("Re-verification - Columns in 'interviews':")
                for col in inspector.get_columns("interviews"):
                    print(f" - {col['name']} ({col['type']})")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    diagnose()
