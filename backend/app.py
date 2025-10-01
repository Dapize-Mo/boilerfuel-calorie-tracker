import os
from urllib.parse import quote_plus
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

app = Flask(__name__)

def _env_or_none(name: str):
    val = os.getenv(name)
    # Treat unresolved template references like {{ Postgres.DATABASE_URL }} as unset
    if val and ('{{' in val or '}}' in val or val.strip().startswith('{{')):
        return None
    return val

def _build_db_url_from_parts():
    """Build a Postgres URL from discrete POSTGRES_* env vars if provided."""
    host = _env_or_none('POSTGRES_HOST') or _env_or_none('PGHOST')
    port = _env_or_none('POSTGRES_PORT') or _env_or_none('PGPORT') or '5432'
    user = _env_or_none('POSTGRES_USER') or _env_or_none('PGUSER')
    password = _env_or_none('POSTGRES_PASSWORD') or _env_or_none('PGPASSWORD')
    dbname = _env_or_none('POSTGRES_DB') or _env_or_none('POSTGRES_DATABASE') or _env_or_none('PGDATABASE')
    if host and user and password and dbname:
        # URL encode username/password in case they contain special chars
        return f"postgresql://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/{quote_plus(dbname)}"
    return None

def _preferred_database_url():
    """Resolve a usable database URL across common providers (Railway, etc)."""
    # Common provider envs (in priority order)
    candidates = [
        'DATABASE_URL',
        'DATABASE_PUBLIC_URL',  # some platforms expose a public variant
        'RAILWAY_DATABASE_URL', # Railway sometimes exposes this
        'POSTGRES_URL',         # Railway/others sometimes use this
    ]
    for key in candidates:
        val = _env_or_none(key)
        if val:
            return val
    # Try assembling from discrete POSTGRES_* parts
    assembled = _build_db_url_from_parts()
    if assembled:
        return assembled
    # Fallback to local
    return 'postgresql://username:password@localhost/boilerfuel'

# Configuration
database_url = _preferred_database_url()
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
if database_url.startswith('postgresql://') and '+psycopg2' not in database_url:
    # Use psycopg2 driver
    database_url = database_url.replace('postgresql://', 'postgresql+psycopg2://', 1)

# Apply SSL mode if specified or if we're clearly on a hosted environment without explicit sslmode
sslmode = os.getenv('DATABASE_SSLMODE') or os.getenv('PGSSLMODE')
if sslmode:
    separator = '&' if '?' in database_url else '?'
    database_url = f"{database_url}{separator}sslmode={sslmode}"
else:
    # Heuristic: if not localhost and no sslmode present, default to require on hosted envs
    if 'sslmode=' not in database_url and not any(h in database_url for h in ['localhost', '127.0.0.1']):
        separator = '&' if '?' in database_url else '?'
        database_url = f"{database_url}{separator}sslmode=require"

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'change-me')

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Models
class Food(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    calories = db.Column(db.Integer, nullable=False)
    macros = db.Column(db.JSON, nullable=False)

# API Endpoints
@app.route('/api/foods', methods=['GET'])
def get_foods():
    foods = Food.query.all()
    return jsonify([{'id': food.id, 'name': food.name, 'calories': food.calories, 'macros': food.macros} for food in foods])

@app.route('/api/foods', methods=['POST'])
def add_food():
    data = request.get_json()
    new_food = Food()
    new_food.name = data['name']
    new_food.calories = data['calories']
    new_food.macros = data['macros']
    db.session.add(new_food)
    db.session.commit()
    return jsonify({'message': 'Food added successfully!'}), 201


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

@app.route('/init-db', methods=['POST'])
def init_database():
    """Initialize database schema and seed data - run once after deployment"""
    try:
        # Create all tables
        db.create_all()
        
        # Check if we already have data
        existing_foods = Food.query.count()
        if existing_foods > 0:
            return jsonify({'message': f'Database already initialized with {existing_foods} foods'}), 200
        
        # Add sample seed data
        sample_foods = [
            {'name': 'Grilled Chicken Breast', 'calories': 165, 'macros': {'protein': 31, 'carbs': 0, 'fat': 3.6}},
            {'name': 'Brown Rice (1 cup)', 'calories': 216, 'macros': {'protein': 5, 'carbs': 45, 'fat': 1.8}},
            {'name': 'Broccoli (1 cup)', 'calories': 25, 'macros': {'protein': 3, 'carbs': 5, 'fat': 0.3}},
            {'name': 'Salmon Fillet', 'calories': 206, 'macros': {'protein': 22, 'carbs': 0, 'fat': 12}},
            {'name': 'Oatmeal (1 cup)', 'calories': 147, 'macros': {'protein': 6, 'carbs': 25, 'fat': 3}}
        ]
        
        for food_data in sample_foods:
            food = Food(name=food_data['name'], calories=food_data['calories'], macros=food_data['macros'])
            db.session.add(food)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Database initialized successfully!',
            'foods_added': len(sample_foods)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database initialization failed: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)