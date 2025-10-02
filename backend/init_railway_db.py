import os
import psycopg2
from urllib.parse import urlparse

# Get DATABASE_URL from environment or Railway
database_url = os.getenv('DATABASE_URL')

if not database_url:
    print("ERROR: DATABASE_URL environment variable not set!")
    print("Get it from Railway dashboard: Postgres service > Variables > DATABASE_URL")
    exit(1)

print(f"Connecting to database...")

try:
    # Connect to the database
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    print("✓ Connected successfully!")
    print("\nCreating tables...")
    
    # Create foods table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS foods (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            calories INT NOT NULL,
            macros JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("✓ Created foods table")
    
    # Create activities table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            calories_per_hour INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("✓ Created activities table")
    
    print("\nSeeding data...")
    
    # Seed foods
    cur.execute("""
        INSERT INTO foods (name, calories, macros) VALUES
        ('Grilled Chicken', 250, '{"protein": 30, "carbs": 0, "fats": 10}'),
        ('Caesar Salad', 150, '{"protein": 5, "carbs": 10, "fats": 12}'),
        ('Spaghetti', 300, '{"protein": 10, "carbs": 60, "fats": 5}'),
        ('Apple', 95, '{"protein": 0, "carbs": 25, "fats": 0}'),
        ('Brown Rice', 215, '{"protein": 5, "carbs": 45, "fats": 2}'),
        ('Broccoli', 55, '{"protein": 5, "carbs": 11, "fats": 0}'),
        ('Salmon', 367, '{"protein": 39, "carbs": 0, "fats": 22}'),
        ('Greek Yogurt', 100, '{"protein": 10, "carbs": 6, "fats": 0}'),
        ('Oatmeal', 154, '{"protein": 6, "carbs": 27, "fats": 3}'),
        ('Almonds', 164, '{"protein": 6, "carbs": 6, "fats": 14}')
        ON CONFLICT DO NOTHING;
    """)
    print("✓ Seeded foods")
    
    # Seed activities
    cur.execute("""
        INSERT INTO activities (name, calories_per_hour) VALUES
        ('Running', 600),
        ('Walking', 280),
        ('Cycling', 500),
        ('Swimming', 450),
        ('Weight Training', 365),
        ('Yoga', 180),
        ('Basketball', 440),
        ('Elliptical', 400)
        ON CONFLICT DO NOTHING;
    """)
    print("✓ Seeded activities")
    
    # Commit changes
    conn.commit()
    
    # Verify
    cur.execute("SELECT COUNT(*) FROM foods;")
    food_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM activities;")
    activity_count = cur.fetchone()[0]
    
    print(f"\n✅ Database initialized successfully!")
    print(f"   - {food_count} foods in database")
    print(f"   - {activity_count} activities in database")
    
    cur.close()
    conn.close()
    
except psycopg2.Error as e:
    print(f"\n❌ Database error: {e}")
    exit(1)
except Exception as e:
    print(f"\n❌ Error: {e}")
    exit(1)
