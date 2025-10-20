import os
import psycopg2

# Get DATABASE_URL from environment (supports any host)
database_url = os.getenv('DATABASE_URL') or os.getenv('DATABASE_PUBLIC_URL')

if not database_url:
    print('ERROR: DATABASE_URL not set')
    exit(1)

# Convert postgres:// to postgresql://
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

print('Connecting to database...')
conn = psycopg2.connect(database_url)
cursor = conn.cursor()

print('Adding dining_court and station columns...')

# Add columns
cursor.execute('''
    ALTER TABLE foods 
    ADD COLUMN IF NOT EXISTS dining_court VARCHAR(100),
    ADD COLUMN IF NOT EXISTS station VARCHAR(255)
''')

# Add index
cursor.execute('''
    CREATE INDEX IF NOT EXISTS idx_foods_dining_court ON foods(dining_court)
''')

conn.commit()
print(' Migration complete!')

cursor.close()
conn.close()
