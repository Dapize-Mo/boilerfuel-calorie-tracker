"""
Show detailed statistics about the scraper run
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from menu_scraper import scrape_all_dining_courts

print("=" * 70)
print("PURDUE MENU SCRAPER - DETAILED STATISTICS")
print("=" * 70)

items = scrape_all_dining_courts()

print("\n" + "=" * 70)
print("RESULTS SUMMARY")
print("=" * 70)

total_items = len(items)
items_with_nutrition = len([i for i in items if i['calories'] > 0])
items_without_nutrition = total_items - items_with_nutrition

print(f"\nTotal items scraped: {total_items}")
print(f"  ├─ Items with nutrition data: {items_with_nutrition}")
print(f"  └─ Items without nutrition data: {items_without_nutrition}")

# Break down by dining court
print("\n" + "-" * 70)
print("BY DINING COURT")
print("-" * 70)

from collections import defaultdict
by_court = defaultdict(list)
for item in items:
    by_court[item['dining_court']].append(item)

for court in sorted(by_court.keys()):
    court_items = by_court[court]
    court_with_nutrition = len([i for i in court_items if i['calories'] > 0])
    print(f"\n{court}:")
    print(f"  ├─ Total items: {len(court_items)}")
    print(f"  ├─ With nutrition: {court_with_nutrition}")
    print(f"  └─ Without nutrition: {len(court_items) - court_with_nutrition}")

# Break down by meal period
print("\n" + "-" * 70)
print("BY MEAL PERIOD")
print("-" * 70)

by_meal = defaultdict(list)
for item in items:
    by_meal[item['meal_period']].append(item)

for meal in sorted(by_meal.keys()):
    meal_items = by_meal[meal]
    meal_with_nutrition = len([i for i in meal_items if i['calories'] > 0])
    print(f"\n{meal}:")
    print(f"  ├─ Total items: {len(meal_items)}")
    print(f"  └─ With nutrition: {meal_with_nutrition}")

# Show nutrition ranges
print("\n" + "-" * 70)
print("NUTRITION RANGES (for items with data)")
print("-" * 70)

items_with_data = [i for i in items if i['calories'] > 0]

if items_with_data:
    calories = [i['calories'] for i in items_with_data]
    protein = [i['protein'] for i in items_with_data]
    carbs = [i['carbs'] for i in items_with_data]
    fats = [i['fats'] for i in items_with_data]
    
    print(f"\nCalories: {min(calories)} - {max(calories)} cal (avg: {sum(calories)//len(calories)})")
    print(f"Protein:  {min(protein):.1f} - {max(protein):.1f}g (avg: {sum(protein)/len(protein):.1f}g)")
    print(f"Carbs:    {min(carbs):.1f} - {max(carbs):.1f}g (avg: {sum(carbs)/len(carbs):.1f}g)")
    print(f"Fats:     {min(fats):.1f} - {max(fats):.1f}g (avg: {sum(fats)/len(fats):.1f}g)")

# Show sample high-calorie items
print("\n" + "-" * 70)
print("TOP 10 HIGHEST CALORIE ITEMS")
print("-" * 70)

sorted_by_cal = sorted(items_with_data, key=lambda x: x['calories'], reverse=True)[:10]
for i, item in enumerate(sorted_by_cal, 1):
    print(f"{i:2d}. {item['name']:40s} {item['calories']:4d} cal ({item['dining_court']})")

# Show sample high-protein items
print("\n" + "-" * 70)
print("TOP 10 HIGHEST PROTEIN ITEMS")
print("-" * 70)

sorted_by_protein = sorted(items_with_data, key=lambda x: x['protein'], reverse=True)[:10]
for i, item in enumerate(sorted_by_protein, 1):
    print(f"{i:2d}. {item['name']:40s} {item['protein']:5.1f}g ({item['dining_court']})")

print("\n" + "=" * 70)
print("Scraping complete!")
print("=" * 70)
