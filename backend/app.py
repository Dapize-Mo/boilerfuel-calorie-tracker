import os
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

# Configuration
database_url = _env_or_none('DATABASE_URL') or _env_or_none('DATABASE_PUBLIC_URL') or 'postgresql://username:password@localhost/boilerfuel'
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
if database_url.startswith('postgresql://') and '+psycopg' not in database_url:
    # Prefer the psycopg v3 driver which ships reliable wheels for Python 3.13
    database_url = database_url.replace('postgresql://', 'postgresql+psycopg://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
sslmode = os.getenv('DATABASE_SSLMODE')
if sslmode:
    # Append sslmode to the connection string if not present
    separator = '&' if '?' in database_url else '?'
    app.config['SQLALCHEMY_DATABASE_URI'] = f"{database_url}{separator}sslmode={sslmode}"
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