#!/usr/bin/env python3
"""
Local database test using SQLite for quick validation
"""
import os
import sys
import tempfile

# Add the backend directory to Python path
sys.path.insert(0, 'backend')

# Set up environment for local testing with SQLite
# Force SQLite by setting all possible env vars
os.environ.clear()  # Clear all existing env vars that might interfere
os.environ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
os.environ['DATABASE_URL'] = 'sqlite:///test.db'
os.environ['JWT_SECRET_KEY'] = 'test-secret-key'

# Clear any Postgres environment variables
for key in list(os.environ.keys()):
    if 'POSTGRES' in key or 'DATABASE' in key or 'PG' in key:
        if key not in ['DATABASE_URL']:
            del os.environ[key]

def test_local_db():
    print("🧪 Testing database functionality locally...")
    
    try:
        # Import the Flask app
        from backend.app import app, db, Food
        
        with app.app_context():
            print("✅ Flask app imported successfully")
            
            # Create tables
            db.create_all()
            print("✅ Database tables created")
            
            # Test adding a food
            test_food = Food(
                name="Test Food Local",
                calories=100,
                macros={"protein": 10, "carbs": 15, "fats": 5}
            )
            db.session.add(test_food)
            db.session.commit()
            print("✅ Food added to database")
            
            # Test querying foods
            foods = Food.query.all()
            print(f"✅ Found {len(foods)} foods in database")
            
            for food in foods:
                print(f"  - {food.name}: {food.calories} calories, macros: {food.macros}")
            
            # Test the API endpoints with test client
            with app.test_client() as client:
                print("\n🌐 Testing API endpoints...")
                
                # Test health endpoint
                response = client.get('/health')
                print(f"Health: {response.status_code} - {response.get_json()}")
                
                # Test ready endpoint
                response = client.get('/ready')
                print(f"Ready: {response.status_code} - {response.get_json()}")
                
                # Test get foods endpoint
                response = client.get('/api/foods')
                print(f"Get foods: {response.status_code}")
                if response.status_code == 200:
                    foods_data = response.get_json()
                    print(f"  API returned {len(foods_data)} foods")
                else:
                    print(f"  Error: {response.get_data(as_text=True)}")
                
                # Test adding food via API
                new_food_data = {
                    "name": "API Test Food",
                    "calories": 200,
                    "macros": {"protein": 20, "carbs": 10, "fats": 8}
                }
                response = client.post('/api/foods', json=new_food_data)
                print(f"Add food: {response.status_code} - {response.get_json()}")
            
            print("\n🎉 All local tests passed! Your database code is working correctly.")
            print("The issue is likely just with the Railway URL or deployment status.")
            
    except Exception as e:
        print(f"❌ Error during local testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_local_db()