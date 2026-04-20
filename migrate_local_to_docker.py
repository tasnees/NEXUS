"""
Migration script: reads all data from the local PostgreSQL instance
and writes it to a SQL file ready to be loaded into the Docker container.

Run BEFORE stopping the local postgresql service.
"""

import psycopg2
import json
import sys

LOCAL_DSN  = "host=localhost port=5432 dbname=nexthire user=postgres password=120303"
OUTPUT_SQL = r"C:\Users\21625\Desktop\AI_hiring_manager\local_data.sql"

TABLES = ["users", "jobs", "candidates", "interviews", "assessments", "assessment_submissions"]

conn = psycopg2.connect(LOCAL_DSN)
cur  = conn.cursor()

lines = [
    "-- Auto-generated migration from local → Docker nexthire DB",
    "SET session_replication_role = replica;  -- disable FK checks temporarily",
    "",
]

total = 0
for table in TABLES:
    try:
        cur.execute(f"SELECT * FROM {table}")
        rows = cur.fetchall()
        cols = [desc[0] for desc in cur.description]

        if not rows:
            lines.append(f"-- {table}: 0 rows")
            continue

        lines.append(f"\n-- {table}: {len(rows)} rows")
        for row in rows:
            values = []
            for v in row:
                if v is None:
                    values.append("NULL")
                elif isinstance(v, bool):
                    values.append("TRUE" if v else "FALSE")
                elif isinstance(v, (int, float)):
                    values.append(str(v))
                elif isinstance(v, list):
                    escaped = json.dumps(v).replace("'", "''")
                    values.append(f"'{escaped}'::jsonb")
                elif isinstance(v, dict):
                    escaped = json.dumps(v).replace("'", "''")
                    values.append(f"'{escaped}'::jsonb")
                else:
                    escaped = str(v).replace("'", "''")
                    values.append(f"'{escaped}'")

            col_str = ", ".join(cols)
            val_str = ", ".join(values)
            lines.append(
                f"INSERT INTO {table} ({col_str}) VALUES ({val_str}) ON CONFLICT DO NOTHING;"
            )
        total += len(rows)
        print(f"  [OK] {table}: {len(rows)} rows")

    except Exception as e:
        print(f"  [FAIL] {table}: {e}")

lines.append("\nSET session_replication_role = DEFAULT;")

with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

cur.close()
conn.close()

print(f"\nDone! {total} total rows written to: {OUTPUT_SQL}")
print("Next steps:")
print("  1. Stop local PostgreSQL service")
print("  2. Run: docker exec -i nexthire-db psql -U postgres -d nexthire < local_data.sql")
