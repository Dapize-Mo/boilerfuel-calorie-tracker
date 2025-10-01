import os
from urllib.parse import quote_plus, urlparse, urlunparse
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from sqlalchemy import text

app = Flask(__name__)

def _env_or_none(name: str):
    val = os.getenv(name)
    # Treat unresolved template references like {{ Postgres.DATABASE_URL }} as unset
    # but allow Railway-style variables like ${{Postgres.DATABASE_URL}}
    if val and ('{{' in val or '}}' in val) and not val.startswith('${{'):
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
    # Debug: Print all environment variables for troubleshooting
    print("[DEBUG] Environment variables:")
    for key in os.environ:
        if 'DATABASE' in key or 'POSTGRES' in key or 'PG' in key:
            val = os.environ[key]
            # Mask password for security
            if '://' in val:
                masked = val.split('://')[0] + '://***masked***'
            else:
                masked = val
            print(f"[DEBUG] {key} = {masked}")
    
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
            print(f"[DEBUG] Using database URL from {key}")
            return val
    # Try assembling from discrete POSTGRES_* parts
    assembled = _build_db_url_from_parts()
    if assembled:
        print(f"[DEBUG] Using assembled database URL")
        return assembled
    # Fallback to local
    print(f"[DEBUG] Falling back to localhost database")
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

# Log a sanitized DB URL at startup to assist debugging in hosted logs
try:
    parsed = urlparse(database_url)
    # Rebuild netloc with redacted password
    username = parsed.username or ''
    password = '***' if parsed.password else None
    host = parsed.hostname or ''
    port = f":{parsed.port}" if parsed.port else ''
    if username and password is not None:
        netloc = f"{username}:{password}@{host}{port}"
    elif username:
        netloc = f"{username}@{host}{port}"
    else:
        netloc = f"{host}{port}"
    sanitized = urlunparse((parsed.scheme, netloc, parsed.path or '', parsed.params or '', parsed.query or '', parsed.fragment or ''))
    print(f"[startup] SQLALCHEMY_DATABASE_URI -> {sanitized}")
except Exception as _e:
    # Non-fatal; just don't log if parsing fails
    pass

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
    try:
        foods = Food.query.all()
        return jsonify([{'id': food.id, 'name': food.name, 'calories': food.calories, 'macros': food.macros} for food in foods])
    except Exception as e:
        return jsonify({'error': f'Failed to fetch foods: {str(e)}'}), 500

@app.route('/api/foods', methods=['POST'])
def add_food():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        required_fields = ['name', 'calories', 'macros']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        new_food = Food()
        new_food.name = data['name']
        new_food.calories = data['calories']
        new_food.macros = data['macros']
        db.session.add(new_food)
        db.session.commit()
        return jsonify({'message': 'Food added successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add food: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

@app.route('/ready', methods=['GET'])
def ready_check():
    """Liveness/Readiness: verifies DB connectivity with a simple query."""
    try:
        db.session.execute(text('SELECT 1'))
        return jsonify({'app': 'ok', 'db': 'ok'}), 200
    except Exception as e:
        # Do not leak details; logs will have stack traces if debug is enabled
        return jsonify({'app': 'ok', 'db': 'error'}), 500

@app.route('/init-db', methods=['GET', 'POST'])
def init_database():
    """Initialize database schema and seed data - run once after deployment"""
    try:
        # Create all tables
        db.create_all()
        
        # Check if we already have data
        existing_foods = Food.query.count()
        if existing_foods > 0:
            return jsonify({'message': f'Database already initialized with {existing_foods} foods'}), 200
        
        # Add sample seed data that matches the SQL schema (uses 'fats' not 'fat')
        sample_foods = [
            {'name': 'Grilled Chicken Breast', 'calories': 165, 'macros': {'protein': 31, 'carbs': 0, 'fats': 3.6}},
            {'name': 'Brown Rice (1 cup)', 'calories': 216, 'macros': {'protein': 5, 'carbs': 45, 'fats': 1.8}},
            {'name': 'Broccoli (1 cup)', 'calories': 25, 'macros': {'protein': 3, 'carbs': 5, 'fats': 0.3}},
            {'name': 'Salmon Fillet', 'calories': 206, 'macros': {'protein': 22, 'carbs': 0, 'fats': 12}},
            {'name': 'Oatmeal (1 cup)', 'calories': 147, 'macros': {'protein': 6, 'carbs': 25, 'fats': 3}}
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