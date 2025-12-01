import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the parent directory to sys.path to allow importing app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'apps', 'api'))

from app.core.config import settings
from app.db.session import SessionLocal

def check_stats():
    db = SessionLocal()
    try:
        print("Checking database stats...")

        # Check users and tenants
        users = db.execute(text("SELECT id, email, tenant_id FROM users;")).fetchall()
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f"User: {u.email}, ID: {u.id}, TenantID: {u.tenant_id}")

        tenants = db.execute(text("SELECT id, name FROM tenants;")).fetchall()
        print(f"Total Tenants: {len(tenants)}")
        for t in tenants:
            print(f"Tenant: {t.name}, ID: {t.id}")

        # Check other tables
        tables = [
            "agents", "deployments", "datasets", "agent_kits",
            "chat_sessions", "data_sources", "data_pipelines",
            "vector_stores", "tools"
        ]

        for table in tables:
            try:
                result = db.execute(text(f"SELECT count(*) FROM {table};"))
                count = result.scalar()
                print(f"Total {table}: {count}")

                # Check tenant_id of first item if exists
                if count > 0:
                    first = db.execute(text(f"SELECT tenant_id FROM {table} LIMIT 1;")).fetchone()
                    if first:
                        print(f"  Sample {table} TenantID: {first.tenant_id}")
            except Exception as e:
                print(f"Error checking {table}: {e}")

    except Exception as e:
        print(f"Error connecting to database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_stats()
