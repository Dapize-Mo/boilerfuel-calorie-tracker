import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { hapticLight, hapticMedium } from '../utils/haptics';

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

/**
 * Safe localStorage.setItem that handles QuotaExceededError.
 * If storage is full, prunes meal data older than 90 days and retries.
 * Returns true if save succeeded, false otherwise.
 */
let _storageWarningShown = false;
function safePersist(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22 || e?.code === 1014) {
      // Try to free space by pruning old meal data
      const freed = pruneOldMealData(90);
      if (freed) {
        try {
          localStorage.setItem(key, value);
          return true;
        } catch {
          // Second prune — more aggressive (30 days)
          pruneOldMealData(30);
          try {
            localStorage.setItem(key, value);
            return true;
          } catch { /* give up */ }
        }
      }
      if (!_storageWarningShown) {
        _storageWarningShown = true;
        if (typeof window !== 'undefined') {
          // Show non-blocking warning
          setTimeout(() => {
            alert(
              'Storage is full. Your oldest meal data has been pruned to make room. ' +
              'Consider exporting a backup from your Profile page.'
            );
          }, 100);
        }
      }
      return false;
    }
    // Non-quota error — just swallow
    return false;
  }
}

/**
 * Remove meal entries older than `daysToKeep` from localStorage to free space.
 * Returns true if any data was pruned.
 */
function pruneOldMealData(daysToKeep) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const meals = JSON.parse(raw);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);
    const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    let pruned = false;
    for (const dateKey of Object.keys(meals)) {
      if (dateKey < cutoffKey) {
        delete meals[dateKey];
        pruned = true;
      }
    }
    if (pruned) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
    }
    return pruned;
  } catch {
    return false;
  }
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

  // Persist meals
  useEffect(() => {
    if (Object.keys(mealsByDate).length > 0) {
      safePersist(STORAGE_KEY, JSON.stringify(mealsByDate));
    }
  }, [mealsByDate]);

  // Persist goals
  useEffect(() => {
    safePersist(GOALS_KEY, JSON.stringify(goals));
  }, [goals]);

  // Persist favorites
  useEffect(() => {
    safePersist(FAVORITES_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  // Persist water
  useEffect(() => {
    if (Object.keys(waterByDate).length > 0) {
      safePersist(WATER_KEY, JSON.stringify(waterByDate));
    }
  }, [waterByDate]);

  // Persist weight
  useEffect(() => {
    if (Object.keys(weightByDate).length > 0) {
      safePersist(WEIGHT_KEY, JSON.stringify(weightByDate));
    }
  }, [weightByDate]);

  // Persist templates
  useEffect(() => {
    safePersist(TEMPLATES_KEY, JSON.stringify(templates));
  }, [templates]);

  // Persist dietary prefs
  useEffect(() => {
    safePersist(DIETARY_KEY, JSON.stringify(dietaryPrefs));
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

  // ── Auto-sync: pull on mount, debounced push on changes ──
  const syncPushTimer = useRef(null);
  const mountedRef = useRef(false);

  // Pull on mount (if synced)
  useEffect(() => {
    (async () => {
      try {
        const { isSynced, pullData } = await import('../utils/sync');
        if (!isSynced()) return;
        setSyncStatus('syncing');
        const updated = await pullData();
        if (updated) {
          // Reload state from localStorage after pull merged new data
          reloadFromStorage();
        }
        setSyncStatusTransient('success');
      } catch {
        setSyncStatusTransient('error');
      }
      mountedRef.current = true;
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Reload all state from localStorage (after sync pull)
  const reloadFromStorage = useCallback(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setMealsByDate(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem(GOALS_KEY); if (s) setGoalsState(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem(FAVORITES_KEY); if (s) setFavoritesState(new Set(JSON.parse(s))); } catch {}
    try { const s = localStorage.getItem(WATER_KEY); if (s) setWaterByDate(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem(WEIGHT_KEY); if (s) setWeightByDate(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem(TEMPLATES_KEY); if (s) setTemplatesState(JSON.parse(s)); } catch {}
    try { const s = localStorage.getItem(DIETARY_KEY); if (s) setDietaryPrefsState(JSON.parse(s)); } catch {}
  }, []);

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
    hapticLight();
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
        safePersist(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
    hapticMedium();
  }, []);

  const clearMeals = useCallback(() => {
    setMealsByDate(prev => {
      const key = getTodayKey();
      const updated = { ...prev };
      delete updated[key];
      safePersist(STORAGE_KEY, JSON.stringify(updated));
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

  // ── Import data (restore from JSON backup) ──
  const importData = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') throw new Error('Invalid format');

      let imported = 0;

      if (data.meals && typeof data.meals === 'object') {
        setMealsByDate((prev) => {
          const merged = { ...prev };
          for (const [dateKey, dayMeals] of Object.entries(data.meals)) {
            if (!Array.isArray(dayMeals)) continue;
            const existing = merged[dateKey] || [];
            const existingIds = new Set(existing.map((m) => m.id || m.addedAt));
            const newMeals = dayMeals.filter((m) => !existingIds.has(m.id || m.addedAt));
            if (newMeals.length > 0) {
              merged[dateKey] = [...existing, ...newMeals];
              imported += newMeals.length;
            }
          }
          return merged;
        });
      }

      if (data.goals && typeof data.goals === 'object') {
        setGoalsState((prev) => ({ ...prev, ...data.goals }));
      }

      if (data.water && typeof data.water === 'object') {
        setWaterByDate((prev) => ({ ...prev, ...data.water }));
      }

      if (data.weight && typeof data.weight === 'object') {
        setWeightByDate((prev) => ({ ...prev, ...data.weight }));
      }

      if (Array.isArray(data.favorites)) {
        setFavoritesState((prev) => new Set([...prev, ...data.favorites]));
      }

      if (Array.isArray(data.templates)) {
        setTemplatesState((prev) => {
          const existingNames = new Set(prev.map((t) => t.name));
          const newTemplates = data.templates.filter((t) => !existingNames.has(t.name));
          return [...prev, ...newTemplates];
        });
      }

      return { success: true, imported };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // ── Streak tracking ──
  const getStreak = useCallback(() => {
    const today = getTodayKey();
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;

    // Get all dates sorted descending
    const dates = Object.keys(mealsByDate)
      .filter((d) => (mealsByDate[d] || []).length > 0)
      .sort((a, b) => b.localeCompare(a));

    if (dates.length === 0) return { currentStreak: 0, longestStreak: 0, totalDays: 0 };

    // Calculate current streak (consecutive days ending today or yesterday)
    let checkDate = today;
    // If today has no meals, start from yesterday
    if (!dates.includes(today)) {
      const yesterday = new Date(today + 'T00:00:00');
      yesterday.setDate(yesterday.getDate() - 1);
      checkDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    }

    const dateSet = new Set(dates);
    let d = new Date(checkDate + 'T00:00:00');
    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dateSet.has(key)) {
        currentStreak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak from all dates
    const allDatesAsc = [...dates].sort();
    streak = 1;
    longestStreak = 1;
    for (let i = 1; i < allDatesAsc.length; i++) {
      const prev = new Date(allDatesAsc[i - 1] + 'T00:00:00');
      const curr = new Date(allDatesAsc[i] + 'T00:00:00');
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else {
        streak = 1;
      }
    }

    return { currentStreak, longestStreak, totalDays: dates.length };
  }, [mealsByDate]);

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
      // Export / Import
      exportData, importData,
      // Analytics
      getDateRange, getStreak,
      // Sync
      syncNow, reloadFromStorage, syncStatus,
    }}>
      {children}
    </MealContext.Provider>
  );
}

export function useMeals() {
  return useContext(MealContext);
}
