import os
from datetime import datetime, timedelta
from urllib.parse import quote_plus, urlparse, urlunparse
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from sqlalchemy import text
import bcrypt

app = Flask(__name__)
CORS(app)

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
    # Database configuration resolved successfully
    
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
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        """Hash and set the password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        """Check if the provided password matches the hash"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

class Food(db.Model):
    __tablename__ = 'foods'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    calories = db.Column(db.Integer, nullable=False)
    macros = db.Column(db.JSON, nullable=False)

class MealLog(db.Model):
    __tablename__ = 'meal_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    food_id = db.Column(db.Integer, db.ForeignKey('foods.id'), nullable=False)
    servings = db.Column(db.Float, nullable=False, default=1.0)
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('meal_logs', lazy=True))
    food = db.relationship('Food', backref=db.backref('meal_logs', lazy=True))

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

# Authentication Endpoints
@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        new_user = User(email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        # Generate JWT token
        access_token = create_access_token(identity=new_user.id, expires_delta=timedelta(days=7))
        
        return jsonify({
            'message': 'User registered successfully',
            'token': access_token,
            'user': {
                'id': new_user.id,
                'email': new_user.email
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate JWT token
        access_token = create_access_token(identity=user.id, expires_delta=timedelta(days=7))
        
        return jsonify({
            'message': 'Login successful',
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email
            }
        }), 200
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@app.route('/api/user', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'created_at': user.created_at.isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get user: {str(e)}'}), 500

# Meal Logging Endpoints
@app.route('/api/logs', methods=['GET'])
@jwt_required()
def get_logs():
    """Get meal logs for current user"""
    try:
        user_id = get_jwt_identity()
        
        # Optional: filter by date
        date_str = request.args.get('date')  # Expected format: YYYY-MM-DD
        
        query = MealLog.query.filter_by(user_id=user_id)
        
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d')
                next_date = date + timedelta(days=1)
                query = query.filter(MealLog.logged_at >= date, MealLog.logged_at < next_date)
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            # Default to today
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            tomorrow = today + timedelta(days=1)
            query = query.filter(MealLog.logged_at >= today, MealLog.logged_at < tomorrow)
        
        logs = query.order_by(MealLog.logged_at.desc()).all()
        
        result = []
        for log in logs:
            result.append({
                'id': log.id,
                'food': {
                    'id': log.food.id,
                    'name': log.food.name,
                    'calories': log.food.calories,
                    'macros': log.food.macros
                },
                'servings': log.servings,
                'logged_at': log.logged_at.isoformat()
            })
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch logs: {str(e)}'}), 500

@app.route('/api/logs', methods=['POST'])
@jwt_required()
def add_log():
    """Add a new meal log"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        food_id = data.get('food_id')
        servings = data.get('servings', 1.0)
        
        if not food_id:
            return jsonify({'error': 'food_id is required'}), 400
        
        # Verify food exists
        food = Food.query.get(food_id)
        if not food:
            return jsonify({'error': 'Food not found'}), 404
        
        # Create log
        new_log = MealLog(user_id=user_id, food_id=food_id, servings=servings)
        db.session.add(new_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Meal logged successfully',
            'log': {
                'id': new_log.id,
                'food': {
                    'id': food.id,
                    'name': food.name,
                    'calories': food.calories,
                    'macros': food.macros
                },
                'servings': new_log.servings,
                'logged_at': new_log.logged_at.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add log: {str(e)}'}), 500

@app.route('/api/daily-totals', methods=['GET'])
@jwt_required()
def get_daily_totals():
    """Get aggregated daily totals for current user"""
    try:
        user_id = get_jwt_identity()
        
        # Optional: filter by date
        date_str = request.args.get('date')  # Expected format: YYYY-MM-DD
        
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d')
                next_date = date + timedelta(days=1)
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            # Default to today
            date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            next_date = date + timedelta(days=1)
        
        # Get all logs for the date
        logs = MealLog.query.filter_by(user_id=user_id).filter(
            MealLog.logged_at >= date,
            MealLog.logged_at < next_date
        ).all()
        
        # Calculate totals
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fats = 0
        
        for log in logs:
            total_calories += log.food.calories * log.servings
            macros = log.food.macros
            total_protein += macros.get('protein', 0) * log.servings
            total_carbs += macros.get('carbs', 0) * log.servings
            total_fats += macros.get('fats', 0) * log.servings
        
        return jsonify({
            'date': date.strftime('%Y-%m-%d'),
            'calories': round(total_calories, 1),
            'protein': round(total_protein, 1),
            'carbs': round(total_carbs, 1),
            'fats': round(total_fats, 1),
            'meal_count': len(logs)
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get daily totals: {str(e)}'}), 500


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