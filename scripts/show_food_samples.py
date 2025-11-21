import os
import psycopg2

url = os.environ.get('DATABASE_URL')
if not url:
    raise SystemExit('DATABASE_URL not set')
if url.startswith('postgres://'):
    url = url.replace('postgres://', 'postgresql://', 1)

conn = psycopg2.connect(url)
cur = conn.cursor()
cur.execute(
    "SELECT name, dining_court, meal_time, next_available FROM foods ORDER BY updated_at DESC LIMIT 10"
)
rows = cur.fetchall()
for row in rows:
    name, court, meal, schedule = row
    print(name, ' | ', court, ' | ', meal, ' | ', schedule)
cur.close()
conn.close()
