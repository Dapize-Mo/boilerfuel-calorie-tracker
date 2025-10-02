"""
Migration script to add meal_time column to foods table
Run this script to update your database schema
"""

import os
import sys

# Add parent directory to path to import from backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app, db

def add_meal_time_column():
    """Add meal_time column to foods table"""
    with app.app_context():
        try:
            # Check if column already exists
            from sqlalchemy.inspection import inspect
            inspector = inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('foods')]
            
            if 'meal_time' in columns:
                print("✓ meal_time column already exists")
                return
            
            # Add the column
            print("Adding meal_time column to foods table...")
            db.session.execute(db.text("""
                ALTER TABLE foods ADD COLUMN meal_time VARCHAR(50);
            """))
            
            # Create index for faster filtering
            print("Creating index on meal_time column...")
            db.session.execute(db.text("""
                CREATE INDEX IF NOT EXISTS idx_foods_meal_time ON foods(meal_time);
            """))
            
            # Create composite index for dining court and meal time
            print("Creating composite index...")
            db.session.execute(db.text("""
                CREATE INDEX IF NOT EXISTS idx_foods_dining_meal ON foods(dining_court, meal_time);
            """))
            
            db.session.commit()
            print("✓ Successfully added meal_time column and indexes")
            
        except Exception as e:
            db.session.rollback()
            print(f"✗ Error: {e}")
            raise

if __name__ == '__main__':
    print("Starting migration...")
    add_meal_time_column()
    print("Migration complete!")
