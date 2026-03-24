from app.config.database import engine, Base
from app.models.interview import Interview
from sqlalchemy import inspect

def fix_table():
    inspector = inspect(engine)
    if "interviews" in inspector.get_table_names():
        print("Table 'interviews' exists. Dropping for fresh start...")
        Interview.__table__.drop(engine)
    
    print("Creating 'interviews' table...")
    Interview.__table__.create(engine)
    print("Done!")

if __name__ == "__main__":
    fix_table()
