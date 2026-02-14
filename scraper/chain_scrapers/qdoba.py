"""Qdoba Mexican Eats menu data scraper.

Qdoba provides nutrition calculators on their website.
This module contains popular items with nutrition data.
"""

def get_qdoba_items():
    """Return list of common Qdoba items with nutrition data.
    
    Data sourced from Qdoba's official nutrition calculator.
    Values based on standard builds without heavy customization.
    """
    return [
        # Burritos (Signature builds with standard toppings)
        {"name": "Chicken Burrito (Flour Tortilla)", "calories": 1050, "protein": 58, "carbs": 130, "fats": 34, "station": "Burritos", "meal_time": "Lunch"},
        {"name": "Impossible Burrito (Flour Tortilla)", "calories": 860, "protein": 42, "carbs": 131, "fats": 22, "station": "Burritos", "meal_time": "Lunch"},
        {"name": "Steak Burrito (Flour Tortilla)", "calories": 1100, "protein": 60, "carbs": 130, "fats": 38, "station": "Burritos", "meal_time": "Lunch"},
        {"name": "Ground Beef Burrito (Flour Tortilla)", "calories": 1120, "protein": 56, "carbs": 130, "fats": 42, "station": "Burritos", "meal_time": "Lunch"},
        {"name": "Veggie Burrito (Flour Tortilla)", "calories": 940, "protein": 30, "carbs": 135, "fats": 32, "station": "Burritos", "meal_time": "Lunch"},
        
        # Bowls (No tortilla)
        {"name": "Chicken Burrito Bowl", "calories": 770, "protein": 57, "carbs": 76, "fats": 30, "station": "Bowls", "meal_time": "Lunch"},
        {"name": "Steak Burrito Bowl", "calories": 820, "protein": 59, "carbs": 76, "fats": 34, "station": "Bowls", "meal_time": "Lunch"},
        {"name": "Ground Beef Burrito Bowl", "calories": 840, "protein": 55, "carbs": 76, "fats": 38, "station": "Bowls", "meal_time": "Lunch"},
        {"name": "Impossible Burrito Bowl", "calories": 580, "protein": 41, "carbs": 77, "fats": 18, "station": "Bowls", "meal_time": "Lunch"},
        
        # Tacos (3 per order, Flour Tortilla)
        {"name": "Chicken Tacos (3)", "calories": 780, "protein": 48, "carbs": 72, "fats": 30, "station": "Tacos", "meal_time": "Lunch"},
        {"name": "Steak Tacos (3)", "calories": 830, "protein": 50, "carbs": 72, "fats": 34, "station": "Tacos", "meal_time": "Lunch"},
        {"name": "Ground Beef Tacos (3)", "calories": 850, "protein": 46, "carbs": 72, "fats": 38, "station": "Tacos", "meal_time": "Lunch"},
        
        # Quesadillas
        {"name": "Chicken Quesadilla", "calories": 1290, "protein": 78, "carbs": 106, "fats": 58, "station": "Quesadillas", "meal_time": "Lunch"},
        {"name": "Steak Quesadilla", "calories": 1340, "protein": 80, "carbs": 106, "fats": 62, "station": "Quesadillas", "meal_time": "Lunch"},
        {"name": "Veggie Quesadilla", "calories": 1030, "protein": 42, "carbs": 110, "fats": 50, "station": "Quesadillas", "meal_time": "Lunch"},
        
        # Salads
        {"name": "Chicken Taco Salad", "calories": 980, "protein": 62, "carbs": 76, "fats": 44, "station": "Salads", "meal_time": "Lunch"},
        {"name": "Steak Taco Salad", "calories": 1030, "protein": 64, "carbs": 76, "fats": 48, "station": "Salads", "meal_time": "Lunch"},
        
        # Sides
        {"name": "Chips", "calories": 570, "protein": 8, "carbs": 74, "fats": 28, "station": "Sides", "meal_time": "Lunch"},
        {"name": "Chips & Queso", "calories": 830, "protein": 20, "carbs": 82, "fats": 46, "station": "Sides", "meal_time": "Lunch"},
        {"name": "Chips & Guacamole", "calories": 730, "protein": 10, "carbs": 82, "fats": 42, "station": "Sides", "meal_time": "Lunch"},
        {"name": "Black Beans (Side)", "calories": 140, "protein": 9, "carbs": 23, "fats": 1, "station": "Sides", "meal_time": "Lunch"},
        {"name": "Cilantro Lime Rice (Side)", "calories": 190, "protein": 4, "carbs": 40, "fats": 2, "station": "Sides", "meal_time": "Lunch"},
        
        # Breakfast (if location offers)
        {"name": "Breakfast Burrito with Bacon", "calories": 780, "protein": 36, "carbs": 85, "fats": 32, "station": "Breakfast", "meal_time": "Breakfast"},
        {"name": "Breakfast Burrito with Sausage", "calories": 870, "protein": 36, "carbs": 85, "fats": 39, "station": "Breakfast", "meal_time": "Breakfast"},
    ]
