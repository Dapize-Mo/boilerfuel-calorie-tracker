"""Dining court beverage data for Purdue residential dining halls.

All five dining courts (Earhart, Ford, Hillenbrand, Wiley, Windsor)
have self-serve milk dispensers (Prairie Farms) and Coca-Cola fountain
soda machines available at every meal.

Cup size: 8 oz (standard Purdue dining hall cup).
Milk nutrition: Prairie Farms official data, scaled to 8 oz (1 serving).
Soda nutrition: Coca-Cola official fountain data, scaled to 8 oz.
"""

# The five residential dining courts
DINING_COURTS = ["Earhart", "Ford", "Hillenbrand", "Wiley", "Windsor"]

# Quick Bites locations — same Coca-Cola fountain machine + water as dining courts
QUICK_BITES_LOCATIONS = [
    "1bowl at Meredith Hall",
    "Pete's Za at Tarkington Hall",
    "Sushi Boss at Meredith Hall",
]


def get_dining_court_beverage_items():
    """Return list of beverages available at all Purdue dining courts.

    Nutrition values are per 8 oz cup (standard dining hall cup).
    Milk data sourced from Prairie Farms official nutrition labels.
    Soda data sourced from Coca-Cola product facts.
    """
    beverages = [
        # ── Prairie Farms Milk (8 oz / 1 serving) ──
        {
            "name": "2% Reduced Fat Milk (8 oz)",
            "calories": 120,
            "protein": 8,
            "carbs": 12,
            "fats": 5,
            "saturated_fat": 3,
            "cholesterol": 25,
            "sodium": 120,
            "fiber": 0,
            "sugar": 12,
            "added_sugar": 0,
            "is_vegetarian": True,
            "is_vegan": False,
            "allergens": ["Milk"],
            "ingredients": "Reduced fat milk, vitamin A palmitate, vitamin D3.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Fat Free Skim Milk (8 oz)",
            "calories": 80,
            "protein": 8,
            "carbs": 12,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 5,
            "sodium": 130,
            "fiber": 0,
            "sugar": 12,
            "added_sugar": 0,
            "is_vegetarian": True,
            "is_vegan": False,
            "allergens": ["Milk"],
            "ingredients": "Fat free milk, vitamin A palmitate, vitamin D3.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "1% Lowfat Chocolate Milk (8 oz)",
            "calories": 160,
            "protein": 8,
            "carbs": 26,
            "fats": 3,
            "saturated_fat": 2,
            "cholesterol": 10,
            "sodium": 190,
            "fiber": 1,
            "sugar": 24,
            "added_sugar": 12,
            "is_vegetarian": True,
            "is_vegan": False,
            "allergens": ["Milk"],
            "ingredients": "Lowfat milk, sugar, cocoa (processed with alkali), "
                           "cornstarch, salt, carrageenan, vanillin, vitamin A "
                           "palmitate, vitamin D3.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },

        # ── Coca-Cola Fountain Drinks (8 oz, no ice) ──
        {
            "name": "Coca-Cola (8 oz)",
            "calories": 95,
            "protein": 0,
            "carbs": 26,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 25,
            "fiber": 0,
            "sugar": 26,
            "added_sugar": 26,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Carbonated water, high fructose corn syrup, "
                           "caramel color, phosphoric acid, natural flavors, "
                           "caffeine.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Diet Coke (8 oz)",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 30,
            "fiber": 0,
            "sugar": 0,
            "added_sugar": 0,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Carbonated water, caramel color, aspartame, "
                           "phosphoric acid, potassium benzoate, natural "
                           "flavors, citric acid, caffeine.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Coca-Cola Zero Sugar (8 oz)",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 25,
            "fiber": 0,
            "sugar": 0,
            "added_sugar": 0,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Carbonated water, caramel color, phosphoric acid, "
                           "aspartame, potassium benzoate, natural flavors, "
                           "potassium citrate, acesulfame potassium, caffeine.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Sprite (8 oz)",
            "calories": 95,
            "protein": 0,
            "carbs": 26,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 25,
            "fiber": 0,
            "sugar": 26,
            "added_sugar": 26,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Carbonated water, high fructose corn syrup, "
                           "citric acid, natural flavors, sodium citrate, "
                           "sodium benzoate.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Sprite Zero (8 oz)",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 20,
            "fiber": 0,
            "sugar": 0,
            "added_sugar": 0,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Carbonated water, citric acid, natural flavors, "
                           "potassium citrate, aspartame, acesulfame potassium, "
                           "sodium benzoate.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Dr Pepper (8 oz)",
            "calories": 100,
            "protein": 0,
            "carbs": 27,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 38,
            "fiber": 0,
            "sugar": 27,
            "added_sugar": 27,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Carbonated water, high fructose corn syrup, "
                           "caramel color, phosphoric acid, natural and "
                           "artificial flavors, sodium benzoate, caffeine.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Fanta Orange (8 oz)",
            "calories": 110,
            "protein": 0,
            "carbs": 30,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 28,
            "fiber": 0,
            "sugar": 30,
            "added_sugar": 30,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Carbonated water, high fructose corn syrup, "
                           "citric acid, sodium benzoate, natural flavors, "
                           "modified food starch, glycerol ester of rosin, "
                           "yellow 6, red 40.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Barq's Root Beer (8 oz)",
            "calories": 100,
            "protein": 0,
            "carbs": 27,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 38,
            "fiber": 0,
            "sugar": 27,
            "added_sugar": 27,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Carbonated water, high fructose corn syrup, "
                           "caramel color, sodium benzoate, citric acid, "
                           "caffeine, artificial and natural flavors, "
                           "acacia.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Mello Yello (8 oz)",
            "calories": 110,
            "protein": 0,
            "carbs": 29,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 28,
            "fiber": 0,
            "sugar": 29,
            "added_sugar": 29,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Carbonated water, high fructose corn syrup, "
                           "concentrated orange juice, citric acid, natural "
                           "flavors, caffeine, sodium benzoate, gum arabic, "
                           "glycerol ester of rosin, calcium disodium EDTA, "
                           "yellow 5.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Hi-C Flashin' Fruit Punch (8 oz)",
            "calories": 100,
            "protein": 0,
            "carbs": 27,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 28,
            "fiber": 0,
            "sugar": 27,
            "added_sugar": 27,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Water, high fructose corn syrup, citric acid, "
                           "natural flavors, modified cornstarch, "
                           "fruit juice for color, glycerol ester of rosin, "
                           "ascorbic acid (vitamin C).",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Powerade Mountain Berry Blast (8 oz)",
            "calories": 50,
            "protein": 0,
            "carbs": 13,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 75,
            "fiber": 0,
            "sugar": 13,
            "added_sugar": 13,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Water, high fructose corn syrup, citric acid, "
                           "salt, natural flavors, potassium citrate, "
                           "modified food starch, calcium disodium EDTA, "
                           "medium chain triglycerides, sucrose acetate "
                           "isobutyrate, blue 1.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Minute Maid Lemonade (8 oz)",
            "calories": 90,
            "protein": 0,
            "carbs": 25,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 20,
            "fiber": 0,
            "sugar": 24,
            "added_sugar": 24,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Water, high fructose corn syrup, lemon juice "
                           "from concentrate, citric acid, natural flavors, "
                           "sodium citrate, ascorbic acid (vitamin C).",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
        {
            "name": "Water (8 oz)",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "saturated_fat": 0,
            "cholesterol": 0,
            "sodium": 0,
            "fiber": 0,
            "sugar": 0,
            "added_sugar": 0,
            "is_vegetarian": True,
            "is_vegan": True,
            "allergens": [],
            "ingredients": "Water.",
            "serving_size": "8 oz",
            "station": "Beverages",
            "meal_time": "breakfast/lunch/dinner",
        },
    ]

    return beverages


def get_quick_bites_beverage_items():
    """Return fountain sodas and water available at Quick Bites locations.

    Quick Bites locations (1bowl, Pete's Za, Sushi Boss) have the same
    Coca-Cola fountain machine and water as the residential dining courts.
    They do not have Prairie Farms milk dispensers.
    """
    all_beverages = get_dining_court_beverage_items()
    # Exclude the three milk items (first three entries)
    return [item for item in all_beverages if "Milk" not in item["name"]]
