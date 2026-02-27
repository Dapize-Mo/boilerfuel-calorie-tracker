import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

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
const FAVORITES_KEY = 'boilerfuel_favorites';
const WATER_KEY = 'boilerfuel_water';
const WEIGHT_KEY = 'boilerfuel_weight';
const TEMPLATES_KEY = 'boilerfuel_templates';
const DIETARY_KEY = 'boilerfuel_dietary';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65, saturated_fat: 20, fiber: 28, sugar: 50, sodium: 2300, cholesterol: 300, added_sugar: 25 };

export function MealProvider({ children }) {
  // { [dateKey]: [ { id, name, calories, macros, dining_court, station, meal_time, addedAt, servings } ] }
  const [mealsByDate, setMealsByDate] = useState({});
  const [goals, setGoalsState] = useState(DEFAULT_GOALS);

  // Favorites: Set of food IDs
  const [favorites, setFavoritesState] = useState(new Set());

  // Water: { [dateKey]: number (glasses) }
  const [waterByDate, setWaterByDate] = useState({});

  // Weight: { [dateKey]: number (lbs/kg) }
  const [weightByDate, setWeightByDate] = useState({});

  // Meal templates: [ { id, name, foods: [...] } ]
  const [templates, setTemplatesState] = useState([]);

  // Dietary preferences: { vegetarian: bool, vegan: bool, excludeAllergens: string[] }
  const [dietaryPrefs, setDietaryPrefsState] = useState({ vegetarian: false, vegan: false, excludeAllergens: [] });

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
    try {
      const savedFavs = localStorage.getItem(FAVORITES_KEY);
      if (savedFavs) setFavoritesState(new Set(JSON.parse(savedFavs)));
    } catch {}
    try {
      const savedWater = localStorage.getItem(WATER_KEY);
      if (savedWater) setWaterByDate(JSON.parse(savedWater));
    } catch {}
    try {
      const savedWeight = localStorage.getItem(WEIGHT_KEY);
      if (savedWeight) setWeightByDate(JSON.parse(savedWeight));
    } catch {}
    try {
      const savedTemplates = localStorage.getItem(TEMPLATES_KEY);
      if (savedTemplates) setTemplatesState(JSON.parse(savedTemplates));
    } catch {}
    try {
      const savedDietary = localStorage.getItem(DIETARY_KEY);
      if (savedDietary) setDietaryPrefsState(JSON.parse(savedDietary));
    } catch {}
  }, []);

  // Persist meals (with quota-exceeded fallback: trim to last 90 days)
  useEffect(() => {
    if (Object.keys(mealsByDate).length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mealsByDate));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        const keys = Object.keys(mealsByDate).sort();
        const trimmed = Object.fromEntries(keys.slice(-90).map(k => [k, mealsByDate[k]]));
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch {}
      }
    }
  }, [mealsByDate]);

  // Persist goals
  useEffect(() => {
    try { localStorage.setItem(GOALS_KEY, JSON.stringify(goals)); } catch {}
  }, [goals]);

  // Persist favorites
  useEffect(() => {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); } catch {}
  }, [favorites]);

  // Persist water
  useEffect(() => {
    if (Object.keys(waterByDate).length === 0) return;
    try { localStorage.setItem(WATER_KEY, JSON.stringify(waterByDate)); } catch {}
  }, [waterByDate]);

  // Persist weight
  useEffect(() => {
    if (Object.keys(weightByDate).length === 0) return;
    try { localStorage.setItem(WEIGHT_KEY, JSON.stringify(weightByDate)); } catch {}
  }, [weightByDate]);

  // Persist templates
  useEffect(() => {
    try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates)); } catch {}
  }, [templates]);

  // Persist dietary prefs
  useEffect(() => {
    try { localStorage.setItem(DIETARY_KEY, JSON.stringify(dietaryPrefs)); } catch {}
  }, [dietaryPrefs]);

  // ── Sync status: 'idle' | 'syncing' | 'success' | 'error' ──
  const [syncStatus, setSyncStatus] = useState('idle');
  const syncStatusTimer = useRef(null);

  const setSyncStatusTransient = useCallback((status) => {
    setSyncStatus(status);
    if (status === 'success') {
      if (syncStatusTimer.current) clearTimeout(syncStatusTimer.current);
      syncStatusTimer.current = setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, []);

  // Reload all state from localStorage (after sync pull)
  const reloadFromStorage = useCallback(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setMealsByDate(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem(GOALS_KEY); if (s) setGoalsState(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem(FAVORITES_KEY); if (s) setFavoritesState(new Set(JSON.parse(s))); } catch {}
    try { const s = localStorage.getItem(WATER_KEY); if (s) setWaterByDate(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem(WEIGHT_KEY); if (s) setWeightByDate(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem(TEMPLATES_KEY); if (s) setTemplatesState(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem(DIETARY_KEY); if (s) setDietaryPrefsState(JSON.parse(s)); } catch {}
    setHasMealsBackup(!!localStorage.getItem('boilerfuel_meals_backup'));
  }, []);

  // ── Auto-sync: pull on mount + on tab-focus, debounced push on changes ──
  const syncPushTimer = useRef(null);
  const mountedRef = useRef(false);
  const isSyncingRef = useRef(false);  // prevent concurrent pulls
  const lastPullRef = useRef(0);       // timestamp of last pull (ms)
  const MIN_PULL_INTERVAL = 30_000;   // don't re-pull more than once per 30 s

  const doPull = useCallback(async (force = false) => {
    if (isSyncingRef.current) return;
    const now = Date.now();
    if (!force && now - lastPullRef.current < MIN_PULL_INTERVAL) return;
    try {
      const { isSynced, pullData } = await import('../utils/sync');
      if (!isSynced()) return;
      isSyncingRef.current = true;
      lastPullRef.current = now;
      setSyncStatus('syncing');
      const updated = await pullData();
      if (updated) reloadFromStorage();
      setSyncStatusTransient('success');
    } catch {
      setSyncStatusTransient('error');
    } finally {
      isSyncingRef.current = false;
    }
  }, [reloadFromStorage, setSyncStatusTransient]);

  // Pull on mount (force = true so the cooldown doesn't block the first load)
  useEffect(() => {
    (async () => {
      await doPull(true);
      mountedRef.current = true;
    })();
  }, [doPull]);

  // Re-pull whenever the user returns to the tab/app (mobile suspend/resume, tab switch)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') doPull();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [doPull]);

  // Debounced push after any data change (skip initial mount)
  useEffect(() => {
    if (!mountedRef.current) return;
    if (syncPushTimer.current) clearTimeout(syncPushTimer.current);
    syncPushTimer.current = setTimeout(async () => {
      try {
        const { isSynced, pushData } = await import('../utils/sync');
        if (!isSynced()) return;
        setSyncStatus('syncing');
        await pushData();
        setSyncStatusTransient('success');
      } catch {
        setSyncStatusTransient('error');
      }
    }, 3000); // 3 second debounce
    return () => { if (syncPushTimer.current) clearTimeout(syncPushTimer.current); };
  }, [mealsByDate, goals, favorites, waterByDate, weightByDate, templates, dietaryPrefs, setSyncStatusTransient]);

  // ── Backup recovery ──
  const [hasMealsBackup, setHasMealsBackup] = useState(false);

  // Check for backup on mount and after any reload
  useEffect(() => {
    setHasMealsBackup(!!localStorage.getItem('boilerfuel_meals_backup'));
  }, []);

  const restoreMealsBackup = useCallback(async () => {
    const { restoreMealsFromBackup } = await import('../utils/sync');
    const ok = restoreMealsFromBackup();
    if (ok) {
      reloadFromStorage();
      setHasMealsBackup(false);
    }
    return ok;
  }, [reloadFromStorage]);

  // Manual sync trigger (for UI button)
  const syncNow = useCallback(async () => {
    const { isSynced, pushData, pullData } = await import('../utils/sync');
    if (!isSynced()) return false;
    setSyncStatus('syncing');
    try {
      await pushData();
      const updated = await pullData();
      if (updated) reloadFromStorage();
      setSyncStatusTransient('success');
    } catch {
      setSyncStatusTransient('error');
    }
    return true;
  }, [reloadFromStorage, setSyncStatusTransient]);

  const todayKey = getTodayKey();
  const meals = mealsByDate[todayKey] || [];

  const addMeal = useCallback((food, mealTimeOverride, dateOverride, servings = 1) => {
    const mult = servings || 1;
    const entry = {
      id: food.id,
      name: food.name,
      calories: Math.round((food.calories || 0) * mult),
      macros: food.macros ? {
        ...food.macros,
        protein: parseFloat(((parseFloat(food.macros.protein) || 0) * mult).toFixed(1)),
        carbs: parseFloat(((parseFloat(food.macros.carbs) || 0) * mult).toFixed(1)),
        fats: parseFloat(((parseFloat(food.macros.fats || food.macros.fat) || 0) * mult).toFixed(1)),
        fat: parseFloat(((parseFloat(food.macros.fats || food.macros.fat) || 0) * mult).toFixed(1)),
        sugar: parseFloat(((parseFloat(food.macros.sugar) || 0) * mult).toFixed(1)),
        fiber: parseFloat(((parseFloat(food.macros.fiber) || 0) * mult).toFixed(1)),
        sodium: parseFloat(((parseFloat(food.macros.sodium) || 0) * mult).toFixed(1)),
        cholesterol: parseFloat(((parseFloat(food.macros.cholesterol) || 0) * mult).toFixed(1)),
        saturated_fat: parseFloat(((parseFloat(food.macros.saturated_fat) || 0) * mult).toFixed(1)),
        added_sugar: parseFloat(((parseFloat(food.macros.added_sugar) || 0) * mult).toFixed(1)),
      } : {},
      dining_court: food.dining_court || '',
      station: food.station || '',
      meal_time: mealTimeOverride || food.meal_time || '',
      servings: mult,
      addedAt: Date.now(),
    };
    setMealsByDate(prev => {
      const key = dateOverride || getTodayKey();
      const existing = prev[key] || [];
      return { ...prev, [key]: [...existing, entry] };
    });
  }, []);

  const removeMeal = useCallback((food, dateOverride) => {
    setMealsByDate(prev => {
      const key = dateOverride || getTodayKey();
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

  // ── Favorites ──
  const toggleFavorite = useCallback((foodId) => {
    setFavoritesState(prev => {
      const next = new Set(prev);
      if (next.has(foodId)) next.delete(foodId);
      else next.add(foodId);
      return next;
    });
  }, []);

  const isFavorite = useCallback((foodId) => favorites.has(foodId), [favorites]);

  // ── Water tracking ──
  const getWater = useCallback((dateOverride) => {
    const key = dateOverride || getTodayKey();
    return waterByDate[key] || 0;
  }, [waterByDate]);

  const addWater = useCallback((amount = 1, dateOverride) => {
    const key = dateOverride || getTodayKey();
    setWaterByDate(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) + amount) }));
  }, []);

  const setWater = useCallback((amount, dateOverride) => {
    const key = dateOverride || getTodayKey();
    setWaterByDate(prev => ({ ...prev, [key]: Math.max(0, amount) }));
  }, []);

  // ── Weight tracking ──
  const getWeight = useCallback((dateOverride) => {
    const key = dateOverride || getTodayKey();
    return weightByDate[key] || null;
  }, [weightByDate]);

  const setWeight = useCallback((weight, dateOverride) => {
    const key = dateOverride || getTodayKey();
    setWeightByDate(prev => {
      if (weight === null || weight === undefined || weight === '') {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: parseFloat(weight) };
    });
  }, []);

  // ── Meal templates ──
  const saveTemplate = useCallback((name, foods) => {
    const template = { id: `tmpl-${Date.now()}`, name, foods, createdAt: Date.now() };
    setTemplatesState(prev => [...prev, template]);
    return template;
  }, []);

  const deleteTemplate = useCallback((templateId) => {
    setTemplatesState(prev => prev.filter(t => t.id !== templateId));
  }, []);

  const applyTemplate = useCallback((template, dateOverride) => {
    const key = dateOverride || getTodayKey();
    setMealsByDate(prev => {
      const existing = prev[key] || [];
      const newEntries = template.foods.map(f => ({ ...f, addedAt: Date.now() }));
      return { ...prev, [key]: [...existing, ...newEntries] };
    });
  }, []);

  // ── Dietary preferences ──
  const setDietaryPrefs = useCallback((prefs) => {
    setDietaryPrefsState(prev => ({ ...prev, ...prefs }));
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

  // Count how many times a food id appears for the given date (defaults to today)
  const getCount = useCallback((foodId, dateOverride) => {
    const key = dateOverride || getTodayKey();
    const existing = mealsByDate[key] || [];
    return existing.filter(m => m.id === foodId).reduce((sum, m) => sum + (m.servings || 1), 0);
  }, [mealsByDate]);

  // ── Export data ──
  const exportData = useCallback((format = 'json') => {
    const data = {
      meals: mealsByDate,
      goals,
      water: waterByDate,
      weight: weightByDate,
      favorites: [...favorites],
      templates,
      exportedAt: new Date().toISOString(),
      app: 'BoilerFuel',
    };

    if (format === 'csv') {
      // Flatten meals to CSV
      const rows = [['Date', 'Food', 'Calories', 'Protein(g)', 'Carbs(g)', 'Fat(g)', 'Servings', 'Dining Court', 'Station', 'Meal Time']];
      for (const [date, dateMeals] of Object.entries(mealsByDate)) {
        for (const m of dateMeals) {
          rows.push([
            date, m.name, m.calories,
            parseFloat(m.macros?.protein) || 0,
            parseFloat(m.macros?.carbs) || 0,
            parseFloat(m.macros?.fats || m.macros?.fat) || 0,
            m.servings || 1,
            m.dining_court || '', m.station || '', m.meal_time || '',
          ]);
        }
      }
      return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    }

    if (format === 'gdata') {
      // Google Fit REST API payload format (com.google.nutrition data points)
      const MEAL_TYPE_MAP = { breakfast: 1, brunch: 1, lunch: 2, dinner: 3, snack: 4 };
      const mealTypeInt = (t) => MEAL_TYPE_MAP[(t || '').toLowerCase().split('/')[0].trim()] || 4;
      const mealTypeToHour = { 1: 8, 2: 12, 3: 18, 4: 15 };

      const points = [];
      for (const [date, dateMeals] of Object.entries(mealsByDate).sort(([a], [b]) => a.localeCompare(b))) {
        const mealTypeIndex = {};
        for (const m of dateMeals) {
          const mt = mealTypeInt(m.meal_time);
          const mealKey = m.meal_time || 'snack';
          mealTypeIndex[mealKey] = (mealTypeIndex[mealKey] || 0);
          const d = new Date(`${date}T12:00:00`);
          d.setHours(mealTypeToHour[mt], mealTypeIndex[mealKey], 0, 0);
          mealTypeIndex[mealKey]++;
          const startNs = (d.getTime() * 1_000_000).toString();
          const endNs = (BigInt(startNs) + BigInt(60 * 1_000_000_000)).toString();
          points.push({
            startTimeNanos: startNs,
            endTimeNanos: endNs,
            dataTypeName: 'com.google.nutrition',
            value: [
              {
                mapVal: [
                  { key: 'calories',      value: { fpVal: m.calories || 0 } },
                  { key: 'fat.total',     value: { fpVal: parseFloat(m.macros?.fats || m.macros?.fat) || 0 } },
                  { key: 'fat.saturated', value: { fpVal: parseFloat(m.macros?.saturated_fat) || 0 } },
                  { key: 'protein',       value: { fpVal: parseFloat(m.macros?.protein) || 0 } },
                  { key: 'carbs.total',   value: { fpVal: parseFloat(m.macros?.carbs) || 0 } },
                  { key: 'dietary_fiber', value: { fpVal: parseFloat(m.macros?.fiber) || 0 } },
                  { key: 'sugar',         value: { fpVal: parseFloat(m.macros?.sugar) || 0 } },
                  { key: 'sodium',        value: { fpVal: parseFloat(m.macros?.sodium) || 0 } },
                  { key: 'cholesterol',   value: { fpVal: parseFloat(m.macros?.cholesterol) || 0 } },
                ],
              },
              { intVal: mt },
              { stringVal: m.name || 'Unknown' },
            ],
          });
        }
      }
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        app: 'BoilerFuel',
        dataTypeName: 'com.google.nutrition',
        point: points,
      }, null, 2);
    }

    if (format === 'cronometer') {
      // Cronometer food diary import format
      const mealTimeToHour = { breakfast: '08', brunch: '10', lunch: '12', dinner: '18' };
      const rows = [[
        'Date', 'Time', 'Food Name', 'Amount', 'Unit',
        'Energy (kcal)', 'Protein (g)', 'Carbohydrates (g)', 'Fat (g)',
        'Fiber (g)', 'Sodium (mg)', 'Sugar (g)', 'Saturated Fat (g)', 'Cholesterol (mg)',
      ]];
      for (const [date, dateMeals] of Object.entries(mealsByDate).sort(([a], [b]) => a.localeCompare(b))) {
        for (const m of dateMeals) {
          const hour = mealTimeToHour[(m.meal_time || '').toLowerCase().split('/')[0].trim()] || '15';
          rows.push([
            date,
            `${hour}:00:00`,
            m.name || '',
            m.servings || 1,
            'serving',
            m.calories || 0,
            parseFloat(m.macros?.protein) || 0,
            parseFloat(m.macros?.carbs) || 0,
            parseFloat(m.macros?.fats || m.macros?.fat) || 0,
            parseFloat(m.macros?.fiber) || 0,
            parseFloat(m.macros?.sodium) || 0,
            parseFloat(m.macros?.sugar) || 0,
            parseFloat(m.macros?.saturated_fat) || 0,
            parseFloat(m.macros?.cholesterol) || 0,
          ]);
        }
      }
      return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    }

    return JSON.stringify(data, null, 2);
  }, [mealsByDate, goals, waterByDate, weightByDate, favorites, templates]);

  // ── Weekly/monthly analytics helpers ──
  const getDateRange = useCallback((startDate, endDate) => {
    const result = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayMeals = mealsByDate[key] || [];
      const dayTotals = dayMeals.reduce(
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
      result.push({ date: key, meals: dayMeals, totals: dayTotals, water: waterByDate[key] || 0, weight: weightByDate[key] || null });
    }
    return result;
  }, [mealsByDate, waterByDate, weightByDate]);

  return (
    <MealContext.Provider value={{
      meals, goals, addMeal, removeMeal, clearMeals, setGoals, totals, getCount, mealsByDate,
      // Favorites
      favorites, toggleFavorite, isFavorite,
      // Water
      waterByDate, getWater, addWater, setWater,
      // Weight
      weightByDate, getWeight, setWeight,
      // Templates
      templates, saveTemplate, deleteTemplate, applyTemplate,
      // Dietary
      dietaryPrefs, setDietaryPrefs,
      // Export
      exportData,
      // Analytics
      getDateRange,
      // Sync
      syncNow, reloadFromStorage, syncStatus,
      // Backup recovery
      hasMealsBackup, restoreMealsBackup,
    }}>
      {children}
    </MealContext.Provider>
  );
}

export function useMeals() {
  return useContext(MealContext);
}
