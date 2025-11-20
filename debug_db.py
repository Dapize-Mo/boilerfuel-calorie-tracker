import sys
import os
# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app import app, db, Food
from sqlalchemy import text

# Force the DB URL to the one in backend
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend', 'boilerfuel.db'))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

print(f"Using Database: {app.config['SQLALCHEMY_DATABASE_URI']}")

with app.app_context():
    try:
        # Check if tables exist
        print("Checking tables...")
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"Tables: {tables}")

        if 'foods' in tables:
            # Try the failing query
            print("Executing query...")
            result = db.session.execute(
                text('SELECT DISTINCT dining_court FROM foods WHERE dining_court IS NOT NULL ORDER BY dining_court')
            )
            courts = [row[0] for row in result if row[0]]
            print(f"Courts: {courts}")
        else:
            print("Table 'foods' does not exist!")
            
    except Exception as e:
        print(f"Error: {e}")
