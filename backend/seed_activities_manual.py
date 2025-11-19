import sys
import os

# Add current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Activity

def seed_activities():
    with app.app_context():
        print(f"Connected to DB: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # Check if activities already exist
        count = Activity.query.count()
        print(f"Current activity count: {count}")
        
        if count > 0:
            print("Activities table is not empty. Appending new activities if they don't exist...")
        
        activities_data = [
            {'name': 'Running (Moderate)', 'calories_per_hour': 600},
            {'name': 'Running (Fast)', 'calories_per_hour': 800},
            {'name': 'Walking (Brisk)', 'calories_per_hour': 300},
            {'name': 'Walking (Slow)', 'calories_per_hour': 200},
            {'name': 'Cycling (Moderate)', 'calories_per_hour': 500},
            {'name': 'Cycling (Intense)', 'calories_per_hour': 700},
            {'name': 'Swimming (Laps)', 'calories_per_hour': 500},
            {'name': 'Weight Lifting', 'calories_per_hour': 350},
            {'name': 'Yoga', 'calories_per_hour': 180},
            {'name': 'Basketball', 'calories_per_hour': 440},
            {'name': 'Soccer', 'calories_per_hour': 500},
            {'name': 'Tennis', 'calories_per_hour': 450},
            {'name': 'Hiking', 'calories_per_hour': 400},
            {'name': 'Elliptical', 'calories_per_hour': 400},
            {'name': 'Stair Climber', 'calories_per_hour': 500},
            {'name': 'Jump Rope', 'calories_per_hour': 800},
            {'name': 'Pilates', 'calories_per_hour': 200},
            {'name': 'Dancing', 'calories_per_hour': 300},
            {'name': 'Rowing', 'calories_per_hour': 600},
            {'name': 'HIIT', 'calories_per_hour': 700}
        ]
        
        added = 0
        for data in activities_data:
            exists = Activity.query.filter_by(name=data['name']).first()
            if not exists:
                activity = Activity(
                    name=data['name'],
                    calories_per_hour=data['calories_per_hour']
                )
                db.session.add(activity)
                added += 1
                print(f"Adding: {data['name']}")
            else:
                print(f"Skipping existing: {data['name']}")
        
        if added > 0:
            db.session.commit()
            print(f"Successfully added {added} activities!")
        else:
            print("No new activities added.")

if __name__ == "__main__":
    seed_activities()
