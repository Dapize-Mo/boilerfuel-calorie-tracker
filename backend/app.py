import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

app = Flask(__name__)

# Configuration
database_url = os.getenv('DATABASE_URL', 'postgresql://username:password@localhost/boilerfuel')
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

if __name__ == '__main__':
    app.run(debug=True)