# 🍽️ Meal Time Filter - Quick Start Guide

## What's New?

Users can now filter menu items by **meal time** in addition to dining court!

### Visual Preview

```
┌─────────────────────────────────────────────────────────────┐
│  BoilerFuel Dashboard                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📍 Select Menu Items                                       │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ Dining Court ▼   │  │ Meal Time ▼      │              │
│  │ • All Courts     │  │ 🌅 Breakfast     │              │
│  │ • Wiley          │  │ ☀️ Lunch         │              │
│  │ • Earhart        │  │ 🌙 Dinner        │              │
│  │ • Ford           │  │ • All Meals      │              │
│  └──────────────────┘  └──────────────────┘              │
│                                                             │
│  Filtering by: [ 📍 Wiley ] [ ☀️ Lunch ] Clear filters     │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │  GRILL STATION                                   │      │
│  │  ┌───────────────────────────────────────────┐  │      │
│  │  │ Cheeseburger            [+]               │  │      │
│  │  │ 680 cal • P: 35g • C: 45g • F: 35g       │  │      │
│  │  └───────────────────────────────────────────┘  │      │
│  └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 How to Use

1. **Choose Dining Court** (optional)
   - Select where you're eating
   - Or leave as "All Dining Courts"

2. **Choose Meal Time** (optional)
   - 🌅 Breakfast - Morning options
   - ☀️ Lunch - Midday meals  
   - 🌙 Dinner - Evening options
   - Or leave as "All Meal Times"

3. **View Filtered Results**
   - See only foods for your selected filters
   - Active filters shown as colored pills
   - Click "Clear filters" to reset

## 🎯 Use Cases

### Scenario 1: Quick Breakfast Search
```
Select: Any Court + 🌅 Breakfast
Result: All breakfast items from all locations
```

### Scenario 2: Wiley Lunch
```
Select: Wiley + ☀️ Lunch
Result: Only lunch items at Wiley
```

### Scenario 3: Browse Everything
```
Select: All Courts + All Meal Times
Result: Complete menu
```

## ⚙️ Setup Required

### For Developers

**1. Run the database migration:**
```powershell
# If you have a local database
.\add_meal_time.ps1

# OR for Railway
railway run python add_meal_time_migration.py
```

**2. (Optional) Add sample data:**
```sql
-- Categorize some foods
UPDATE foods SET meal_time = 'breakfast' WHERE name ILIKE '%egg%';
UPDATE foods SET meal_time = 'lunch' WHERE name ILIKE '%burger%';
UPDATE foods SET meal_time = 'dinner' WHERE name ILIKE '%steak%';
```

**3. Deploy:**
```powershell
git add .
git commit -m "feat: add meal time filter"
git push
```

### For Scraper Integration

Update your scraper to include meal_time when creating foods:

```python
food_data = {
    'name': 'Scrambled Eggs',
    'calories': 200,
    'macros': {'protein': 12, 'carbs': 2, 'fats': 15},
    'dining_court': 'wiley',
    'station': 'Grill',
    'meal_time': 'breakfast'  # ← Add this!
}
```

## 📊 Database Schema

```sql
-- New column in foods table
ALTER TABLE foods ADD COLUMN meal_time VARCHAR(50);

-- Allowed values: 'breakfast', 'lunch', 'dinner', or NULL
-- NULL means the food is available at all times
```

## 🎨 Design Highlights

- **Emoji icons** for visual appeal 🌅 ☀️ 🌙
- **Filter pills** show active selections
- **Responsive layout** works on all devices
- **Clear visual hierarchy** with colors
- **One-click reset** to clear filters

## 📝 API Examples

```bash
# Get all foods
GET /api/foods

# Get breakfast items
GET /api/foods?meal_time=breakfast

# Get lunch at Wiley
GET /api/foods?dining_court=wiley&meal_time=lunch

# Get all dinner options
GET /api/foods?meal_time=dinner
```

## ✅ Benefits

- ⚡ **Faster meal planning** - Find what you need quickly
- 🎯 **Relevant results** - See only applicable items
- 📱 **Mobile friendly** - Works great on phones
- ♿ **Accessible** - Screen reader compatible
- 🎨 **Beautiful UI** - Modern, clean design

---

**Ready to use! Just run the migration and start filtering! 🎉**
