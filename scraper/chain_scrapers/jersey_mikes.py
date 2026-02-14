"""Jersey Mike's Subs menu data scraper.

Jersey Mike's provides detailed nutrition information online.
This module contains popular sandwich items.
"""

def get_jersey_mikes_items():
    """Return list of common Jersey Mike's items with nutrition data.
    
    Data sourced from Jersey Mike's official nutrition guide.
    Regular = Regular size (7"), Giant = Giant size (14")
    Mike's Way = lettuce, onions, tomatoes, oil, vinegar, spices
    """
    return [
        # Cold Subs - Regular (7")
        {"name": "#1 BLT (Regular)", "calories": 540, "protein": 21, "carbs": 52, "fats": 27, "station": "Cold Subs", "meal_time": "Lunch"},
        {"name": "#2 Jersey Shore's Favorite (Regular)", "calories": 630, "protein": 31, "carbs": 53, "fats": 31, "station": "Cold Subs", "meal_time": "Lunch"},
        {"name": "#7 Turkey & Provolone (Regular)", "calories": 510, "protein": 30, "carbs": 53, "fats": 18, "station": "Cold Subs", "meal_time": "Lunch"},
        {"name": "#8 Club Sub with Mayonnaise (Regular)", "calories": 640, "protein": 38, "carbs": 53, "fats": 29, "station": "Cold Subs", "meal_time": "Lunch"},
        {"name": "#9 Club Supreme (Regular)", "calories": 680, "protein": 40, "carbs": 53, "fats": 32, "station": "Cold Subs", "meal_time": "Lunch"},
        {"name": "#13 Original Italian (Regular)", "calories": 700, "protein": 31, "carbs": 53, "fats": 39, "station": "Cold Subs", "meal_time": "Lunch"},
        {"name": "#14 The Veggie (Regular)", "calories": 520, "protein": 20, "carbs": 61, "fats": 22, "station": "Cold Subs", "meal_time": "Lunch"},
        
        # Cold Subs - Giant (14")
        {"name": "#1 BLT (Giant)", "calories": 1080, "protein": 42, "carbs": 104, "fats": 54, "station": "Cold Subs", "meal_time": "Lunch"},
        {"name": "#7 Turkey & Provolone (Giant)", "calories": 1020, "protein": 60, "carbs": 106, "fats": 36, "station": "Cold Subs", "meal_time": "Lunch"},
        {"name": "#8 Club Sub with Mayonnaise (Giant)", "calories": 1280, "protein": 76, "carbs": 106, "fats": 58, "station": "Cold Subs", "meal_time": "Lunch"},
        {"name": "#13 Original Italian (Giant)", "calories": 1400, "protein": 62, "carbs": 106, "fats": 78, "station": "Cold Subs", "meal_time": "Lunch"},
        
        # Hot Subs - Regular (7")
        {"name": "#17 Mike's Famous Philly (Regular)", "calories": 730, "protein": 45, "carbs": 58, "fats": 34, "station": "Hot Subs", "meal_time": "Lunch"},
        {"name": "#26 Bacon Ranch Chicken Cheese Steak (Regular)", "calories": 910, "protein": 50, "carbs": 58, "fats": 52, "station": "Hot Subs", "meal_time": "Lunch"},
        {"name": "#43 Chipotle Cheese Steak (Regular)", "calories": 850, "protein": 47, "carbs": 60, "fats": 46, "station": "Hot Subs", "meal_time": "Lunch"},
        {"name": "#56 Big Kahuna Cheese Steak (Regular)", "calories": 880, "protein": 47, "carbs": 62, "fats": 48, "station": "Hot Subs", "meal_time": "Lunch"},
        
        # Hot Subs - Giant (14")
        {"name": "#17 Mike's Famous Philly (Giant)", "calories": 1460, "protein": 90, "carbs": 116, "fats": 68, "station": "Hot Subs", "meal_time": "Lunch"},
        {"name": "#26 Bacon Ranch Chicken Cheese Steak (Giant)", "calories": 1820, "protein": 100, "carbs": 116, "fats": 104, "station": "Hot Subs", "meal_time": "Lunch"},
        
        # Mini Subs (4.5")
        {"name": "#2 Jersey Shore's Favorite (Mini)", "calories": 390, "protein": 19, "carbs": 36, "fats": 19, "station": "Mini Subs", "meal_time": "Lunch"},
        {"name": "#7 Turkey & Provolone (Mini)", "calories": 320, "protein": 18, "carbs": 36, "fats": 11, "station": "Mini Subs", "meal_time": "Lunch"},
        
        # Wraps
        {"name": "Grilled Buffalo Chicken Wrap", "calories": 600, "protein": 45, "carbs": 48, "fats": 25, "station": "Wraps", "meal_time": "Lunch"},
        {"name": "Grilled Chicken Caesar Wrap", "calories": 690, "protein": 46, "carbs": 48, "fats": 32, "station": "Wraps", "meal_time": "Lunch"},
        
        # Sides
        {"name": "Regular Chips", "calories": 150, "protein": 2, "carbs": 15, "fats": 10, "station": "Sides", "meal_time": "Lunch"},
        {"name": "Pickle", "calories": 5, "protein": 0, "carbs": 1, "fats": 0, "station": "Sides", "meal_time": "Lunch"},
        {"name": "Chocolate Chip Cookie", "calories": 420, "protein": 5, "carbs": 55, "fats": 21, "station": "Desserts", "meal_time": "Lunch"},
    ]
