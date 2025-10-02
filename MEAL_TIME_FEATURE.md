# Meal Time Feature

## Overview
The meal time feature allows users to filter menu items by when they're served: breakfast, lunch, or dinner. This helps users quickly find food options for the current meal period.

## Database Changes

### New Column
- **Table**: `foods`
- **Column**: `meal_time` (VARCHAR(50), nullable)
- **Values**: `breakfast`, `lunch`, `dinner`, or `null`

### Indexes
- `idx_foods_meal_time`: Single-column index on `meal_time`
- `idx_foods_dining_meal`: Composite index on `(dining_court, meal_time)`

## Migration Instructions

### Running the Migration

#### Option 1: Using PowerShell Script
```powershell
.\add_meal_time.ps1
```

#### Option 2: Using Python Directly
```powershell
python add_meal_time_migration.py
```

#### Option 3: Using SQL Directly
```sql
-- Run the SQL file
psql -U your_username -d your_database -f db/add_meal_time.sql
```

### For Railway/Production
```powershell
# Connect to your Railway database and run:
psql $DATABASE_URL -f db/add_meal_time.sql
```

## API Changes

### GET /api/foods
Now accepts an additional query parameter:
- `meal_time` (optional): Filter by meal time (`breakfast`, `lunch`, or `dinner`)

**Example**:
```
GET /api/foods?dining_court=wiley&meal_time=lunch
```

**Response** now includes `meal_time` field:
```json
{
  "id": 1,
  "name": "Scrambled Eggs",
  "calories": 200,
  "macros": {
    "protein": 12,
    "carbs": 2,
    "fats": 15
  },
  "dining_court": "wiley",
  "station": "Grill",
  "meal_time": "breakfast"
}
```

## Frontend Changes

### Dashboard Updates
1. **Meal Time Selector**: New dropdown in the filters section with emoji icons:
   - 🌅 Breakfast
   - ☀️ Lunch
   - 🌙 Dinner

2. **Filter Pills**: Visual indicators showing active filters with ability to clear all

3. **Layout**: Side-by-side layout for Dining Court and Meal Time selectors (responsive)

### User Experience
- Filters persist in the same user session
- Both filters work together (AND logic)
- Clear visual feedback for active filters
- "Clear filters" button to reset both selections
- Improved empty state messages based on active filters

## Adding Meal Time Data

### Manual Entry (Admin Panel)
When adding or editing foods, you can specify the meal_time value.

### Scraper Updates
Update `scraper/menu_scraper.py` to detect and set meal times based on the menu structure.

**Example**:
```python
# In the scraper, detect meal time from the menu context
meal_time = "lunch"  # or "breakfast", "dinner"

food_data = {
    'name': food_name,
    'calories': calories,
    'macros': macros,
    'dining_court': dining_court,
    'station': station,
    'meal_time': meal_time  # Add this field
}
```

## Testing

### Test the Feature
1. Run the migration
2. Add some test data with meal_time values
3. Open the dashboard at `http://localhost:3000/dashboard`
4. Test filtering by:
   - Dining court only
   - Meal time only
   - Both filters together
5. Verify the "Clear filters" button works

### Sample Test Data
```sql
-- Update some existing foods with meal times
UPDATE foods SET meal_time = 'breakfast' WHERE name LIKE '%Egg%' OR name LIKE '%Pancake%';
UPDATE foods SET meal_time = 'lunch' WHERE name LIKE '%Sandwich%' OR name LIKE '%Burger%';
UPDATE foods SET meal_time = 'dinner' WHERE name LIKE '%Steak%' OR name LIKE '%Pasta%';
```

## Design Inspiration
The feature was inspired by Purdue's dining app, featuring:
- Clean, card-based layout for stations
- Clear meal time indicators
- Easy-to-use filter controls
- Visual hierarchy with colors and emojis

## Future Enhancements
- [ ] Auto-detect current meal time based on time of day
- [ ] Show meal time hours (e.g., "Breakfast: 7am-10am")
- [ ] Add transition warnings (e.g., "Lunch ends in 30 minutes")
- [ ] Mobile-optimized meal time toggle (buttons instead of dropdown)
- [ ] Remember user's last selected filters in cookies
