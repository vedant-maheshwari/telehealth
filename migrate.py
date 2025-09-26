# migrate.py

import os
import sqlite3
import asyncio
import asyncpg
from datetime import datetime, date, time
from dotenv import load_dotenv

load_dotenv()

async def migrate():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL not set")

    # Path to your SQLite file
    sqlite_file = 'test'
    sqlite_conn = sqlite3.connect(sqlite_file)
    sqlite_conn.row_factory = sqlite3.Row

    # Connect to PostgreSQL
    pg_conn = await asyncpg.connect(DATABASE_URL)
    print("Connected to PostgreSQL:", await pg_conn.fetchval("SELECT version()"))

    # Tables in dependency order for DELETE (children first) then INSERT (parents first)
    delete_order = [
        "chat_messages",
        "chat_participants",
        "chat_rooms",
        "family_invitations",
        "family_connections",
        "family_permissions",
        "appointments",
        "vitals",
        "doctor_availability",
        "users"
    ]
    insert_order = list(reversed(delete_order))

    # Fetch PostgreSQL schema (table → set of columns)
    pg_columns = await pg_conn.fetch(
        "SELECT table_name, column_name FROM information_schema.columns "
        "WHERE table_schema='public'"
    )
    pg_schema = {}
    for row in pg_columns:
        pg_schema.setdefault(row["table_name"], set()).add(row["column_name"])

    # Fetch existing SQLite tables
    sqlite_tables = {r["name"] for r in sqlite_conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()}

    # 1) Clear existing data in DELETE order
    for table in delete_order:
        if table in pg_schema:
            print(f"Clearing table {table}...")
            await pg_conn.execute(f"DELETE FROM {table}")

    # 2) Migrate data in INSERT order
    for table in insert_order:
        if table not in pg_schema or table not in sqlite_tables:
            print(f"Skipping {table}")
            continue

        print(f"\nMigrating {table}...")
        rows = sqlite_conn.execute(f"SELECT * FROM {table}").fetchall()
        if not rows:
            print("  No data to migrate")
            continue

        # Determine columns present in both SQLite and PostgreSQL
        sqlite_cols = list(rows[0].keys())
        common_cols = [c for c in sqlite_cols if c in pg_schema[table]]
        if not common_cols:
            print("  No matching columns")
            continue

        migrated_count = 0
        for row in rows:
            values = []
            for col in common_cols:
                val = row[col]

                # Convert string to datetime/date/time
                if isinstance(val, str):
                    try:
                        if "T" in val or " " in val:
                            val = datetime.fromisoformat(val)
                        elif "-" in val:
                            val = date.fromisoformat(val)
                        elif ":" in val:
                            val = time.fromisoformat(val)
                    except ValueError:
                        pass

                # Convert integer to boolean for doctor_availability.is_active
                if table == "doctor_availability" and col == "is_active":
                    val = bool(val)

                values.append(val)

            # Skip invalid chat_messages with sender_id=0
            if table == "chat_messages" and "sender_id" in common_cols:
                idx = common_cols.index("sender_id")
                if values[idx] == 0:
                    continue

            cols_sql = ",".join(common_cols)
            placeholders = ",".join(f"${i+1}" for i in range(len(values)))
            query = f"INSERT INTO {table} ({cols_sql}) VALUES ({placeholders})"

            try:
                await pg_conn.execute(query, *values)
                migrated_count += 1
            except Exception as e:
                print(f"  Error inserting into {table}: {e}")

        print(f"  Migrated {migrated_count}/{len(rows)} rows")

    # Close connections
    await pg_conn.close()
    sqlite_conn.close()
    print("\nMigration completed successfully.")

if __name__ == "__main__":
    asyncio.run(migrate())
