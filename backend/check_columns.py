import psycopg2, os
from dotenv import load_dotenv
load_dotenv()
try:
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs'")
    columns = cur.fetchall()
    print("Columns in 'jobs' table:")
    for col in columns:
        print(col[0])
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
