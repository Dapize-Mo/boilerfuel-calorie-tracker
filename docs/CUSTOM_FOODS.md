# Custom Foods Feature

## Overview

The Custom Foods feature allows users to create and manage their own food items with custom nutritional information. This is useful for:
- Home-cooked meals
- Foods not available in Purdue dining menus
- Recipes and meal prep items
- Personal food preferences

## Database Schema

### `custom_foods` Table

```sql
CREATE TABLE custom_foods (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    calories INT NOT NULL,
    macros JSONB NOT NULL,  -- {"protein": X, "carbs": Y, "fats": Z}
    serving_size VARCHAR(100),  -- Optional: "1 cup", "100g", etc.
    notes TEXT,  -- Optional user notes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**
- User-specific: Each food is tied to a user account
- Flexible serving sizes: Users can define custom serving descriptions
- Notes field: Add recipes, preparation notes, or other details
- Full CRUD support: Create, Read, Update, Delete operations

## API Endpoints

All endpoints require authentication (JWT token in Authorization header).

### GET `/api/custom-foods`
Get all custom foods for the authenticated user.

**Query Parameters:**
- `q` (optional): Search query to filter by name

**Response:**
```json
{
  "custom_foods": [
    {
      "id": 1,
      "name": "Homemade Chicken Salad",
      "calories": 350,
      "macros": {"protein": 30, "carbs": 15, "fats": 18},
      "serving_size": "1 cup",
      "notes": "With olive oil dressing",
      "created_at": "2026-02-14T12:00:00Z",
      "updated_at": "2026-02-14T12:00:00Z",
      "source": "custom"
    }
  ]
}
```

### POST `/api/custom-foods`
Create a new custom food.

**Request Body:**
```json
{
  "name": "Protein Smoothie",
  "calories": 280,
  "macros": {
    "protein": 25,
    "carbs": 35,
    "fats": 5
  },
  "serving_size": "16 oz",
  "notes": "Banana, protein powder, almond milk"
}
```

**Validation:**
- `name`: Required, non-empty string
- `calories`: Required, number >= 0
- `macros`: Required object with `protein`, `carbs`, `fats` (all >= 0)
- `serving_size`: Optional string
- `notes`: Optional string

### GET `/api/custom-foods/:id`
Get a specific custom food by ID.

### PUT `/api/custom-foods/:id`
Update an existing custom food.

**Request Body:** Same as POST (all fields optional, only provided fields are updated)

### DELETE `/api/custom-foods/:id`
Delete a custom food.

## Frontend Usage

### Access Custom Foods Page

Navigate to `/custom-foods` when logged in.

### Adding a New Food

1. Click "Add Custom Food" button
2. Fill in the form:
   - **Food Name** (required): e.g., "Homemade Lasagna"
   - **Calories** (required): Total calories per serving
   - **Serving Size** (optional): e.g., "1 slice", "200g"
   - **Protein** (optional): Grams of protein
   - **Carbs** (optional): Grams of carbohydrates
   - **Fats** (optional): Grams of fats
   - **Notes** (optional): Recipe, ingredients, preparation notes
3. Click "Add Food"

### Editing a Food

1. Click "Edit" button next to any custom food
2. Modify desired fields
3. Click "Update Food"

### Deleting a Food

1. Click "Delete" button next to any custom food
2. Confirm deletion in the prompt

## Integration with Meal Tracking

**Current Status:** Custom foods are managed separately from main meal tracking.

**Future Enhancement:** Integrate custom foods into the main food search/selection interface for meal logging.

### Planned Integration:

```javascript
// In food search results, include custom foods
const searchFoods = async (query) => {
  const [menuFoods, customFoods] = await Promise.all([
    fetch(`/api/foods?q=${query}`),
    fetch(`/api/custom-foods?q=${query}`)
  ]);
  
  return {
    menu: await menuFoods.json(),
    custom: await customFoods.json()
  };
};
```

## Security

- **Authentication Required:** All endpoints require valid JWT token
- **User Isolation:** Users can only access their own custom foods
- **Cascade Delete:** Custom foods are automatically deleted when user account is deleted
- **Input Validation:** Server-side validation prevents invalid data

## Best Practices

### For Users

1. **Use Descriptive Names:** Include preparation method (e.g., "Grilled Chicken Breast" instead of just "Chicken")
2. **Specify Serving Size:** Be consistent with portion sizes
3. **Add Notes:** Include recipe details for reproducibility
4. **Verify Macros:** Ensure protein + carbs + fats calories match total calories
   - 1g protein = 4 calories
   - 1g carbs = 4 calories
   - 1g fat = 9 calories

### For Developers

1. **Validate on Both Ends:** Client and server validation
2. **Use Transactions:** Database operations should be atomic
3. **Index Performance:** `user_id` and `name` columns are indexed
4. **Error Handling:** Provide clear error messages to users

## Examples

### Breakfast Items
```
Name: Overnight Oats
Calories: 320
Protein: 12g | Carbs: 52g | Fats: 8g
Serving: 1 bowl
Notes: Oats, milk, chia seeds, berries
```

### Meal Prep
```
Name: Turkey Meatballs (5 pieces)
Calories: 280
Protein: 35g | Carbs: 8g | Fats: 12g
Serving: 5 meatballs
Notes: Ground turkey, breadcrumbs, egg, seasonings
```

### Snacks
```
Name: Trail Mix
Calories: 180
Protein: 5g | Carbs: 18g | Fats: 11g
Serving: 1/4 cup
Notes: Almonds, dried cranberries, dark chocolate chips
```

## Troubleshooting

### "Authorization required" error
- Ensure you're logged in
- Check that JWT token is being sent in Authorization header
- Token may have expired - try logging in again

### Custom food not saving
- Check that all required fields are filled
- Verify calories and macros are non-negative numbers
- Check browser console for validation errors

### Custom foods not appearing
- Confirm you're logged in as the correct user
- Try refreshing the page
- Check network tab for API errors

## Future Enhancements

1. **Meal Templates:** Save combinations of custom foods as meals
2. **Import/Export:** Share custom foods with other users or export to CSV
3. **Nutrition Calculator:** Auto-calculate macros based on ingredients
4. **Barcode Scanner:** Scan packaged foods to auto-fill nutrition data
5. **Recipe Scaling:** Adjust serving sizes and recalculate nutrition
6. **Favorites:** Mark frequently used custom foods
7. **Categories:** Organize custom foods into categories (breakfast, lunch, snacks, etc.)

## Related Files

- Backend Model: `backend/app.py` (CustomFood class)
- Backend API: `backend/app.py` (custom-foods endpoints)
- Frontend Page: `frontend/pages/custom-foods.jsx`
- Frontend API: `frontend/pages/api/custom-foods/`
- Database Schema: `db/schema.sql` and `db/custom_foods_schema.sql`
