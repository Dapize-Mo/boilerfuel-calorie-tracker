import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const MealContext = createContext({
  meals: [],
  goals: { calories: 2000, protein: 150, carbs: 250, fat: 65 },
  addMeal: () => {},
  removeMeal: () => {},
  clearMeals: () => {},
  setGoals: () => {},
  totals: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, cholesterol: 0, saturated_fat: 0, added_sugar: 0 },
});

const STORAGE_KEY = 'boilerfuel_meals';
const GOALS_KEY = 'boilerfuel_goals';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

export function MealProvider({ children }) {
  // { [dateKey]: [ { id, name, calories, macros, dining_court, station, meal_time, addedAt } ] }
  const [mealsByDate, setMealsByDate] = useState({});
  const [goals, setGoalsState] = useState(DEFAULT_GOALS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMealsByDate(JSON.parse(saved));
    } catch {}
    try {
      const savedGoals = localStorage.getItem(GOALS_KEY);
      if (savedGoals) setGoalsState(JSON.parse(savedGoals));
    } catch {}
  }, []);

  // Persist meals
  useEffect(() => {
    if (Object.keys(mealsByDate).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mealsByDate));
    }
  }, [mealsByDate]);

  // Persist goals
  useEffect(() => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }, [goals]);

  const todayKey = getTodayKey();
  const meals = mealsByDate[todayKey] || [];

  const addMeal = useCallback((food, mealTimeOverride) => {
    const entry = {
      id: food.id,
      name: food.name,
      calories: food.calories || 0,
      macros: food.macros || {},
      dining_court: food.dining_court || '',
      station: food.station || '',
      meal_time: mealTimeOverride || food.meal_time || '',
      addedAt: Date.now(),
    };
    setMealsByDate(prev => {
      const key = getTodayKey();
      const existing = prev[key] || [];
      return { ...prev, [key]: [...existing, entry] };
    });
  }, []);

  const removeMeal = useCallback((food) => {
    setMealsByDate(prev => {
      const key = getTodayKey();
      const existing = prev[key] || [];
      // Remove the last occurrence of this food id
      const idx = existing.findLastIndex(m => m.id === food.id);
      if (idx === -1) return prev;
      const next = [...existing];
      next.splice(idx, 1);
      const updated = { ...prev, [key]: next };
      if (next.length === 0) {
        delete updated[key];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const clearMeals = useCallback(() => {
    setMealsByDate(prev => {
      const key = getTodayKey();
      const updated = { ...prev };
      delete updated[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setGoals = useCallback((newGoals) => {
    setGoalsState(prev => ({ ...prev, ...newGoals }));
  }, []);

  // Compute totals for today
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (parseFloat(m.macros?.protein) || 0),
      carbs: acc.carbs + (parseFloat(m.macros?.carbs) || 0),
      fat: acc.fat + (parseFloat(m.macros?.fats || m.macros?.fat) || 0),
      sugar: acc.sugar + (parseFloat(m.macros?.sugar) || 0),
      fiber: acc.fiber + (parseFloat(m.macros?.fiber) || 0),
      sodium: acc.sodium + (parseFloat(m.macros?.sodium) || 0),
      cholesterol: acc.cholesterol + (parseFloat(m.macros?.cholesterol) || 0),
      saturated_fat: acc.saturated_fat + (parseFloat(m.macros?.saturated_fat) || 0),
      added_sugar: acc.added_sugar + (parseFloat(m.macros?.added_sugar) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, cholesterol: 0, saturated_fat: 0, added_sugar: 0 }
  );

  // Count how many times a food id appears today
  const getCount = useCallback((foodId) => {
    const key = getTodayKey();
    const existing = mealsByDate[key] || [];
    return existing.filter(m => m.id === foodId).length;
  }, [mealsByDate]);

  return (
    <MealContext.Provider value={{ meals, goals, addMeal, removeMeal, clearMeals, setGoals, totals, getCount }}>
      {children}
    </MealContext.Provider>
  );
}

export function useMeals() {
  return useContext(MealContext);
}
