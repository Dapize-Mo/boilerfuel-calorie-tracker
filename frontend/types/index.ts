/** Core food item from the API */
export interface Food {
  id: number;
  name: string;
  calories: number;
  macros: Macros;
  dining_court?: string;
  station?: string;
  meal_time?: string;
  next_available?: NextAvailable[];
}

/** Nutritional macro data */
export interface Macros {
  protein?: number;
  carbs?: number;
  fats?: number;
  fat?: number;
  sugar?: number;
  fiber?: number;
  sodium?: number;
  cholesterol?: number;
  saturated_fat?: number;
  added_sugar?: number;
  serving_size?: string;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  allergens?: string[];
  ingredients?: string;
  components?: FoodComponent[];
}

/** Component of a BYO / collection food */
export interface FoodComponent {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving_size?: string;
  saturated_fat?: number;
  cholesterol?: number;
  sodium?: number;
  fiber?: number;
  sugar?: number;
  added_sugar?: number;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  allergens?: string[];
  ingredients?: string;
}

/** Next available schedule entry */
export interface NextAvailable {
  date: string;
  day_name: string;
  meal_time: string;
}

/** A logged meal entry */
export interface MealEntry {
  id: number;
  name: string;
  calories: number;
  macros: Macros;
  dining_court: string;
  station: string;
  meal_time: string;
  servings: number;
  addedAt: number;
}

/** Daily nutrition totals */
export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium: number;
  cholesterol: number;
  saturated_fat: number;
  added_sugar: number;
}

/** User goals */
export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturated_fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  added_sugar?: number;
}

/** Dietary preferences */
export interface DietaryPrefs {
  vegetarian: boolean;
  vegan: boolean;
  excludeAllergens: string[];
}

/** Meal template */
export interface MealTemplate {
  id: string;
  name: string;
  foods: MealEntry[];
  createdAt: number;
}

/** Location filter value */
export interface LocationFilter {
  type: 'all' | 'all-purdue' | 'all-foodco' | 'category' | 'single';
  value: string;
  locations?: string[];
  source?: string;
}

/** Nutrition filter state */
export interface NutritionFilter {
  minProtein: string;
  maxCalories: string;
  vegetarian: boolean;
  vegan: boolean;
  allergenFree: string;
}

/** Theme options */
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** Custom food (user-created) */
export interface CustomFood {
  id: number;
  name: string;
  calories: number;
  macros: Macros;
  serving_size?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  source: 'custom';
}

/** Activity */
export interface Activity {
  id: number;
  name: string;
  calories_per_hour: number;
}

/** API error response */
export interface APIErrorResponse {
  error: string;
  status: number;
}

/** Date range entry for analytics */
export interface DateRangeEntry {
  date: string;
  meals: MealEntry[];
  totals: NutritionTotals;
  water: number;
  weight: number | null;
}

/** Export format options */
export type ExportFormat = 'json' | 'csv' | 'gdata' | 'cronometer' | 'apple-health';
