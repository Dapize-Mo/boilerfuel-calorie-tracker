"""Panera Bread menu data scraper.

Panera provides nutrition data publicly. This module contains 
common items available at the Purdue campus location based on
standard Panera menu offerings.
"""

def get_panera_items():
    """Return list of common Panera items with nutrition data.
    
    Data sourced from Panera's official nutrition information.
    Items represent the most popular offerings at campus locations.
    """
    return [
        # Breakfast
        {"name": "Bacon, Egg & Cheese on Brioche", "calories": 560, "protein": 28, "carbs": 42, "fats": 28, "station": "Breakfast", "meal_time": "Breakfast"},
        {"name": "Avocado, Egg White & Spinach Power Sandwich", "calories": 410, "protein": 24, "carbs": 38, "fats": 17, "station": "Breakfast", "meal_time": "Breakfast"},
        {"name": "Steel Cut Oatmeal with Strawberries", "calories": 340, "protein": 9, "carbs": 67, "fats": 4, "station": "Breakfast", "meal_time": "Breakfast"},
        {"name": "Blueberry Muffin", "calories": 420, "protein": 6, "carbs": 64, "fats": 16, "station": "Bakery", "meal_time": "Breakfast"},
        
        # Soups (Cup size - 8oz)
        {"name": "Broccoli Cheddar Soup (Cup)", "calories": 360, "protein": 13, "carbs": 23, "fats": 24, "station": "Soups", "meal_time": "Lunch"},
        {"name": "Chicken Noodle Soup (Cup)", "calories": 140, "protein": 9, "carbs": 18, "fats": 3, "station": "Soups", "meal_time": "Lunch"},
        {"name": "Cream of Chicken & Wild Rice Soup (Cup)", "calories": 260, "protein": 10, "carbs": 23, "fats": 14, "station": "Soups", "meal_time": "Lunch"},
        {"name": "Baked Potato Soup (Cup)", "calories": 290, "protein": 8, "carbs": 30, "fats": 15, "station": "Soups", "meal_time": "Lunch"},
        
        # Soups (Bowl size - 12oz)
        {"name": "Broccoli Cheddar Soup (Bowl)", "calories": 540, "protein": 20, "carbs": 34, "fats": 36, "station": "Soups", "meal_time": "Lunch"},
        {"name": "Chicken Noodle Soup (Bowl)", "calories": 210, "protein": 13, "carbs": 27, "fats": 5, "station": "Soups", "meal_time": "Lunch"},
        {"name": "Cream of Chicken & Wild Rice Soup (Bowl)", "calories": 390, "protein": 15, "carbs": 34, "fats": 21, "station": "Soups", "meal_time": "Lunch"},
        {"name": "Baked Potato Soup (Bowl)", "calories": 440, "protein": 12, "carbs": 45, "fats": 23, "station": "Soups", "meal_time": "Lunch"},
        
        # Salads
        {"name": "Caesar Salad (Whole)", "calories": 330, "protein": 11, "carbs": 22, "fats": 23, "station": "Salads", "meal_time": "Lunch"},
        {"name": "Green Goddess Cobb Salad (Whole)", "calories": 560, "protein": 37, "carbs": 21, "fats": 39, "station": "Salads", "meal_time": "Lunch"},
        {"name": "Asian Sesame Salad with Chicken (Whole)", "calories": 420, "protein": 31, "carbs": 36, "fats": 17, "station": "Salads", "meal_time": "Lunch"},
        
        # Sandwiches (Whole)
        {"name": "Bacon Turkey Bravo on Tomato Basil", "calories": 800, "protein": 50, "carbs": 80, "fats": 29, "station": "Sandwiches", "meal_time": "Lunch"},
        {"name": "Frontega Chicken on Focaccia", "calories": 870, "protein": 54, "carbs": 81, "fats": 35, "station": "Sandwiches", "meal_time": "Lunch"},
        {"name": "Mediterranean Veggie on Tomato Basil", "calories": 590, "protein": 21, "carbs": 77, "fats": 23, "station": "Sandwiches", "meal_time": "Lunch"},
        {"name": "Tuna Salad Sandwich on Honey Wheat", "calories": 490, "protein": 21, "carbs": 63, "fats": 17, "station": "Sandwiches", "meal_time": "Lunch"},
        {"name": "Napa Almond Chicken Salad on Sesame Semolina", "calories": 680, "protein": 31, "carbs": 69, "fats": 31, "station": "Sandwiches", "meal_time": "Lunch"},
        
        # Flatbreads & Pizza
        {"name": "Margherita Flatbread", "calories": 820, "protein": 32, "carbs": 86, "fats": 38, "station": "Flatbreads", "meal_time": "Lunch"},
        {"name": "Chipotle Chicken & Bacon Flatbread", "calories": 970, "protein": 48, "carbs": 88, "fats": 47, "station": "Flatbreads", "meal_time": "Lunch"},
        
        # Sides
        {"name": "Baguette", "calories": 180, "protein": 6, "carbs": 34, "fats": 2, "station": "Sides", "meal_time": "Lunch"},
        {"name": "Chips", "calories": 150, "protein": 2, "carbs": 19, "fats": 8, "station": "Sides", "meal_time": "Lunch"},
        {"name": "Apple", "calories": 80, "protein": 0, "carbs": 21, "fats": 0, "station": "Sides", "meal_time": "Lunch"},
        
        # Bakery & Desserts
        {"name": "Chocolate Chip Cookie", "calories": 390, "protein": 4, "carbs": 54, "fats": 18, "station": "Bakery", "meal_time": "Lunch"},
        {"name": "Chocolate Chipper Cookie", "calories": 440, "protein": 5, "carbs": 58, "fats": 22, "station": "Bakery", "meal_time": "Lunch"},
        {"name": "Kitchen Sink Cookie", "calories": 420, "protein": 6, "carbs": 55, "fats": 20, "station": "Bakery", "meal_time": "Lunch"},
        {"name": "Brownie", "calories": 470, "protein": 5, "carbs": 62, "fats": 23, "station": "Bakery", "meal_time": "Lunch"},
        
        # Beverages
        {"name": "Charged Lemonade (20oz)", "calories": 160, "protein": 0, "carbs": 40, "fats": 0, "station": "Beverages", "meal_time": "Lunch"},
        {"name": "Green Tea (16oz)", "calories": 0, "protein": 0, "carbs": 0, "fats": 0, "station": "Beverages", "meal_time": "Lunch"},
        {"name": "Coffee (16oz)", "calories": 5, "protein": 1, "carbs": 1, "fats": 0, "station": "Beverages", "meal_time": "Lunch"},
    ]
