import os
from sqlalchemy.engine.create import create_engine
from sqlalchemy.sql.expression import text
from sqlalchemy.engine.url import make_url


def run_sql_file(engine, path: str):
    with open(path, 'r', encoding='utf-8') as f:
        sql = f.read()
    with engine.begin() as conn:  # type: ignore
        for statement in [s.strip() for s in sql.split(';') if s.strip()]:
            conn.execute(text(statement))


def main():
    url = os.getenv('DATABASE_URL', 'postgresql://localhost/boilerfuel')
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)
    if url.startswith('postgresql://') and '+psycopg2' not in url:
        url = url.replace('postgresql://', 'postgresql+psycopg2://', 1)
    sslmode = os.getenv('DATABASE_SSLMODE')
    if sslmode:
        sep = '&' if '?' in url else '?'
        url = f"{url}{sep}sslmode={sslmode}"

    # Ensure target database exists (create it if missing)
    parsed = make_url(url)
    target_db = parsed.database or 'boilerfuel'
    admin_url = parsed.set(database='postgres')
    if sslmode:
        # Append sslmode for admin connection as well
        admin_url = admin_url.set(query={**(admin_url.query or {}), 'sslmode': sslmode})

    # CREATE DATABASE cannot run inside a transaction
    admin_engine = create_engine(admin_url)
    try:
        with admin_engine.connect() as conn:  # type: ignore
            exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": target_db}).scalar() is not None
            if not exists:
                # Some managed services do not grant CREATE DATABASE; ignore failure.
                try:
                    conn.execution_options(isolation_level="AUTOCOMMIT").execute(text(f'CREATE DATABASE "{target_db}"'))  # type: ignore
                except Exception as e:
                    print(f"[warn] Could not create database '{target_db}': {e}. Continuing...")
    except Exception as e:
        print(f"[warn] Admin connection to create/check DB failed: {e}. Continuing with provided DATABASE_URL...")

    engine = create_engine(url)

    repo_root = os.path.dirname(os.path.dirname(__file__))
    schema_path = os.path.join(repo_root, 'db', 'schema.sql')
    seed_path = os.path.join(repo_root, 'db', 'seed.sql')
    retail_path = os.path.join(repo_root, 'db', 'retail_foods.sql')
    retail_menu_seed_path = os.path.join(repo_root, 'db', 'retail_menu_seed.sql')

    print(f"Applying schema from {schema_path}...")
    run_sql_file(engine, schema_path)
    print("Schema applied.")

    if os.path.exists(seed_path):
        print(f"Seeding data from {seed_path}...")
        run_sql_file(engine, seed_path)
        print("Seed complete.")

    if os.path.exists(retail_path):
        print(f"Seeding retail foods from {retail_path}...")
        run_sql_file(engine, retail_path)
        print("Retail foods seeded.")

    if os.path.exists(retail_menu_seed_path):
        print(f"Seeding retail menu snapshots from {retail_menu_seed_path}...")
        run_sql_file(engine, retail_menu_seed_path)
        print("Retail menu snapshots seeded.")

    print("Done.")


if __name__ == '__main__':
    main()
