"""Lawson On-the-GO! beverage data.

Lawson On-the-GO! (Lawson Computer Science Building) operates a coffee
kiosk offering espresso-based drinks, drip coffee, tea, and hot chocolate.

Nutrition values sourced from standard coffee preparation guidelines and
common commercial ingredient nutrition labels.
"""


def get_lawson_beverage_items():
    """Return list of beverages available at Lawson On-the-GO!."""
    return [
        # ── Drip Coffee ──
        {
            "name": "Drip Coffee (12 oz)",
            "calories": 5,
            "protein": 1,
            "carbs": 0,
            "fats": 0,
            "station": "Coffee",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Drip Coffee (16 oz)",
            "calories": 5,
            "protein": 1,
            "carbs": 0,
            "fats": 0,
            "station": "Coffee",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Drip Coffee (20 oz)",
            "calories": 10,
            "protein": 1,
            "carbs": 1,
            "fats": 0,
            "station": "Coffee",
            "meal_time": "breakfast/lunch/dinner",
        },

        # ── Espresso Drinks (12 oz, made with 2% milk) ──
        {
            "name": "Latte (12 oz)",
            "calories": 150,
            "protein": 10,
            "carbs": 15,
            "fats": 6,
            "station": "Espresso Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Latte (16 oz)",
            "calories": 190,
            "protein": 13,
            "carbs": 19,
            "fats": 7,
            "station": "Espresso Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Cappuccino (12 oz)",
            "calories": 120,
            "protein": 8,
            "carbs": 12,
            "fats": 4,
            "station": "Espresso Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Caramel Latte (12 oz)",
            "calories": 210,
            "protein": 9,
            "carbs": 31,
            "fats": 6,
            "station": "Espresso Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Caramel Latte (16 oz)",
            "calories": 250,
            "protein": 10,
            "carbs": 34,
            "fats": 7,
            "station": "Espresso Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Mocha (12 oz)",
            "calories": 290,
            "protein": 10,
            "carbs": 43,
            "fats": 10,
            "station": "Espresso Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Mocha (16 oz)",
            "calories": 370,
            "protein": 13,
            "carbs": 50,
            "fats": 14,
            "station": "Espresso Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Vanilla Latte (12 oz)",
            "calories": 200,
            "protein": 9,
            "carbs": 29,
            "fats": 6,
            "station": "Espresso Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Vanilla Latte (16 oz)",
            "calories": 250,
            "protein": 12,
            "carbs": 35,
            "fats": 7,
            "station": "Espresso Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },

        # ── Iced Espresso Drinks (16 oz, made with 2% milk) ──
        {
            "name": "Iced Latte (16 oz)",
            "calories": 130,
            "protein": 8,
            "carbs": 13,
            "fats": 5,
            "station": "Iced Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Iced Caramel Latte (16 oz)",
            "calories": 220,
            "protein": 9,
            "carbs": 32,
            "fats": 6,
            "station": "Iced Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Iced Mocha (16 oz)",
            "calories": 310,
            "protein": 10,
            "carbs": 46,
            "fats": 10,
            "station": "Iced Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Cold Brew (16 oz)",
            "calories": 5,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "station": "Iced Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },

        # ── Tea ──
        {
            "name": "Hot Tea (12 oz)",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "station": "Tea",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Iced Tea (16 oz)",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "station": "Tea",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Chai Tea Latte (12 oz)",
            "calories": 190,
            "protein": 5,
            "carbs": 36,
            "fats": 3,
            "station": "Tea",
            "meal_time": "breakfast/lunch/dinner",
        },

        # ── Other Hot Drinks ──
        {
            "name": "Hot Chocolate (12 oz)",
            "calories": 290,
            "protein": 11,
            "carbs": 46,
            "fats": 9,
            "station": "Hot Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Hot Chocolate (16 oz)",
            "calories": 370,
            "protein": 14,
            "carbs": 58,
            "fats": 11,
            "station": "Hot Drinks",
            "meal_time": "breakfast/lunch/dinner",
        },

        # ── Water ──
        {
            "name": "Water (16 oz)",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
    ]
