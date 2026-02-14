"""Starbucks menu data scraper.

Starbucks provides comprehensive nutrition data.
This module contains popular drinks and food items.
"""

def get_starbucks_items():
    """Return list of common Starbucks items with nutrition data.
    
    Data sourced from Starbucks official nutrition information.
    Sizes: Short (8oz), Tall (12oz), Grande (16oz), Venti (20/24oz)
    """
    return [
        # Hot Coffee
        {"name": "Caffe Americano (Grande)", "calories": 15, "protein": 1, "carbs": 3, "fats": 0, "station": "Hot Coffee", "meal_time": "Breakfast"},
        {"name": "Caffe Latte (Grande)", "calories": 190, "protein": 13, "carbs": 19, "fats": 7, "station": "Hot Coffee", "meal_time": "Breakfast"},
        {"name": "Cappuccino (Grande)", "calories": 140, "protein": 10, "carbs": 14, "fats": 5, "station": "Hot Coffee", "meal_time": "Breakfast"},
        {"name": "Flat White (Grande)", "calories": 220, "protein": 15, "carbs": 22, "fats": 9, "station": "Hot Coffee", "meal_time": "Breakfast"},
        {"name": "Caffe Mocha (Grande)", "calories": 370, "protein": 13, "carbs": 50, "fats": 14, "station": "Hot Coffee", "meal_time": "Breakfast"},
        {"name": "White Chocolate Mocha (Grande)", "calories": 430, "protein": 14, "carbs": 59, "fats": 16, "station": "Hot Coffee", "meal_time": "Breakfast"},
        {"name": "Caramel Macchiato (Grande)", "calories": 250, "protein": 10, "carbs": 34, "fats": 7, "station": "Hot Coffee", "meal_time": "Breakfast"},
        {"name": "Pumpkin Spice Latte (Grande)", "calories": 380, "protein": 14, "carbs": 52, "fats": 14, "station": "Hot Coffee", "meal_time": "Breakfast"},
        
        # Cold Coffee
        {"name": "Iced Caffe Americano (Grande)", "calories": 15, "protein": 2, "carbs": 3, "fats": 0, "station": "Cold Coffee", "meal_time": "Lunch"},
        {"name": "Iced Latte (Grande)", "calories": 130, "protein": 8, "carbs": 13, "fats": 5, "station": "Cold Coffee", "meal_time": "Lunch"},
        {"name": "Iced Caramel Macchiato (Grande)", "calories": 250, "protein": 9, "carbs": 35, "fats": 7, "station": "Cold Coffee", "meal_time": "Lunch"},
        {"name": "Cold Brew (Grande)", "calories": 5, "protein": 0, "carbs": 0, "fats": 0, "station": "Cold Coffee", "meal_time": "Lunch"},
        {"name": "Vanilla Sweet Cream Cold Brew (Grande)", "calories": 110, "protein": 1, "carbs": 14, "fats": 5, "station": "Cold Coffee", "meal_time": "Lunch"},
        {"name": "Nitro Cold Brew (Grande)", "calories": 5, "protein": 0, "carbs": 0, "fats": 0, "station": "Cold Coffee", "meal_time": "Lunch"},
        
        # Frappuccinos (Grande)
        {"name": "Caffe Vanilla Frappuccino (Grande)", "calories": 400, "protein": 5, "carbs": 66, "fats": 13, "station": "Frappuccinos", "meal_time": "Lunch"},
        {"name": "Caramel Frappuccino (Grande)", "calories": 420, "protein": 5, "carbs": 68, "fats": 16, "station": "Frappuccinos", "meal_time": "Lunch"},
        {"name": "Mocha Frappuccino (Grande)", "calories": 410, "protein": 6, "carbs": 64, "fats": 15, "station": "Frappuccinos", "meal_time": "Lunch"},
        {"name": "Java Chip Frappuccino (Grande)", "calories": 470, "protein": 6, "carbs": 69, "fats": 19, "station": "Frappuccinos", "meal_time": "Lunch"},
        
        # Tea & Other Drinks
        {"name": "Chai Tea Latte (Grande)", "calories": 240, "protein": 6, "carbs": 45, "fats": 4, "station": "Tea", "meal_time": "Breakfast"},
        {"name": "Matcha Tea Latte (Grande)", "calories": 240, "protein": 9, "carbs": 34, "fats": 7, "station": "Tea", "meal_time": "Breakfast"},
        {"name": "Hot Chocolate (Grande)", "calories": 370, "protein": 14, "carbs": 47, "fats": 15, "station": "Hot Chocolate", "meal_time": "Breakfast"},
        {"name": "Iced Passion Tango Tea (Grande)", "calories": 0, "protein": 0, "carbs": 0, "fats": 0, "station": "Tea", "meal_time": "Lunch"},
        
        # Espresso (sizes for reference)
        {"name": "Espresso (Solo)", "calories": 5, "protein": 0, "carbs": 1, "fats": 0, "station": "Espresso", "meal_time": "Breakfast"},
        {"name": "Espresso (Doppio)", "calories": 10, "protein": 1, "carbs": 2, "fats": 0, "station": "Espresso", "meal_time": "Breakfast"},
        
        # Food - Breakfast
        {"name": "Bacon, Gouda & Egg Sandwich", "calories": 360, "protein": 19, "carbs": 33, "fats": 16, "station": "Breakfast Sandwiches", "meal_time": "Breakfast"},
        {"name": "Turkey Bacon & Egg White Sandwich", "calories": 230, "protein": 17, "carbs": 30, "fats": 5, "station": "Breakfast Sandwiches", "meal_time": "Breakfast"},
        {"name": "Spinach, Feta & Egg White Wrap", "calories": 290, "protein": 20, "carbs": 33, "fats": 10, "station": "Breakfast Sandwiches", "meal_time": "Breakfast"},
        {"name": "Butter Croissant", "calories": 310, "protein": 5, "carbs": 32, "fats": 18, "station": "Bakery", "meal_time": "Breakfast"},
        {"name": "Blueberry Muffin", "calories": 420, "protein": 6, "carbs": 61, "fats": 17, "station": "Bakery", "meal_time": "Breakfast"},
        
        # Food - Lunch/Snacks
        {"name": "Turkey Pesto Panini", "calories": 500, "protein": 28, "carbs": 46, "fats": 22, "station": "Lunch", "meal_time": "Lunch"},
        {"name": "Chicken Caprese Panini", "calories": 490, "protein": 30, "carbs": 45, "fats": 20, "station": "Lunch", "meal_time": "Lunch"},
        {"name": "Tomato & Mozzarella Panini", "calories": 350, "protein": 17, "carbs": 40, "fats": 14, "station": "Lunch", "meal_time": "Lunch"},
        {"name": "Everything Bagel", "calories": 290, "protein": 11, "carbs": 56, "fats": 3, "station": "Bakery", "meal_time": "Breakfast"},
        
        # Food - Snacks & Desserts
        {"name": "Chocolate Chip Cookie", "calories": 370, "protein": 4, "carbs": 47, "fats": 19, "station": "Bakery", "meal_time": "Lunch"},
        {"name": "Double Chocolate Brownie", "calories": 480, "protein": 6, "carbs": 61, "fats": 25, "station": "Bakery", "meal_time": "Lunch"},
        {"name": "Lemon Loaf", "calories": 470, "protein": 5, "carbs": 66, "fats": 21, "station": "Bakery", "meal_time": "Lunch"},
        {"name": "Cake Pop", "calories": 170, "protein": 2, "carbs": 23, "fats": 8, "station": "Desserts", "meal_time": "Lunch"},
    ]
