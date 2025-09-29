from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost/boilerfuel'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'

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
    new_food = Food(name=data['name'], calories=data['calories'], macros=data['macros'])
    db.session.add(new_food)
    db.session.commit()
    return jsonify({'message': 'Food added successfully!'}), 201

if __name__ == '__main__':
    app.run(debug=True)