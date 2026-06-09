// utils/menuMath.js
// Pure helpers for the Nutrition-Facts menu page. No React, no DOM — safe to
// unit-test. Everything here is built around BoilerFuel's signature idea:
// percentages are measured against what YOU have left to eat today, shown
// alongside the familiar "% of your daily goal".

/** Macro value off a food/meal record, tolerating both `fats` and `fat`. */
export function macro(food, key) {
  const m = food?.macros || {};
  if (key === 'fat') return Number(m.fats ?? m.fat) || 0;
  return Number(m[key]) || 0;
}

/** Build the "remaining today" budget from goals + totals (from useMeals()). */
export function buildBudget(goals = {}, totals = {}) {
  const mk = (goal, eaten) => {
    const g = Number(goal) || 0;
    const e = Number(eaten) || 0;
    return { goal: g, eaten: e, left: Math.max(0, Math.round((g - e) * 10) / 10) };
  };
  return {
    cal: mk(goals.calories, totals.calories),
    p: mk(goals.protein, totals.protein),
    c: mk(goals.carbs, totals.carbs),
    f: mk(goals.fat, totals.fat),
  };
}

/** Round to whole percent; returns Infinity-ish sentinel (999) when denom <= 0. */
function pct(value, denom) {
  if (!denom || denom <= 0) return 999;
  return Math.round((value / denom) * 100);
}

/** % of what you have LEFT in this bucket. */
export const pctRemaining = (value, bucket) => pct(value, bucket.left);

/** % of your full daily GOAL for this bucket. */
export const pctGoal = (value, bucket) => pct(value, bucket.goal);

/**
 * "Fits cleanly" — leaves room for at least one more meal: at most 60% of the
 * remaining calories, and within every remaining macro. Drives the yellow mark.
 */
export function fitsCleanly(food, budget) {
  return (
    food.calories <= budget.cal.left * 0.6 &&
    macro(food, 'protein') <= budget.p.left &&
    macro(food, 'carbs') <= budget.c.left &&
    macro(food, 'fat') <= budget.f.left
  );
}

/** Which remaining buckets this food would blow past (for the warning line). */
export function overflows(food, budget) {
  const out = [];
  if (food.calories > budget.cal.left) out.push('cal');
  if (macro(food, 'protein') > budget.p.left) out.push('P');
  if (macro(food, 'carbs') > budget.c.left) out.push('C');
  if (macro(food, 'fat') > budget.f.left) out.push('F');
  return out;
}

/** Budget after eating one serving of this food. */
export function projectAfter(food, budget) {
  const r = (v) => Math.round(v * 10) / 10;
  return {
    cal: r(budget.cal.left - food.calories),
    p: r(budget.p.left - macro(food, 'protein')),
    c: r(budget.c.left - macro(food, 'carbs')),
    f: r(budget.f.left - macro(food, 'fat')),
  };
}

/**
 * Best-effort dietary match against the app's dietaryPrefs
 * ({ vegetarian, vegan, excludeAllergens:[] }). Foods from /api/foods don't
 * always carry diet/allergen metadata; when a flag is absent we don't filter
 * the item out on that basis (fail-open), except for explicit allergen hits.
 */
export function matchesDiet(food, prefs) {
  if (!prefs) return true;
  const tags = []
    .concat(food.dietary || [], food.tags || [])
    .map((t) => String(t).toLowerCase());
  const allergens = (food.allergens || []).map((a) => String(a).toLowerCase());

  if (prefs.vegan && tags.length && !tags.includes('vegan')) return false;
  if (prefs.vegetarian && tags.length && !(tags.includes('vegetarian') || tags.includes('vegan'))) return false;

  if (Array.isArray(prefs.excludeAllergens) && allergens.length) {
    for (const ex of prefs.excludeAllergens) {
      if (allergens.includes(String(ex).toLowerCase())) return false;
    }
  }
  return true;
}

/** Local YYYY-MM-DD (matches MealContext's getTodayKey). */
export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Normalise the /api/foods?group=true response into an ordered list of
 * stations for one dining court + meal period:
 *   [{ name, items: [food, ...] }]
 */
export function stationsFrom(grouped, court, meal) {
  if (!grouped) return [];
  const courtObj =
    grouped[court] ||
    grouped[Object.keys(grouped).find((k) => k.toLowerCase() === String(court).toLowerCase())] ||
    {};
  // pick the requested meal, else the first available meal period
  const mealKey =
    Object.keys(courtObj).find((k) => k.toLowerCase() === String(meal).toLowerCase()) ||
    Object.keys(courtObj)[0];
  const mealObj = mealKey ? courtObj[mealKey] : {};
  return Object.entries(mealObj).map(([name, items]) => ({
    name,
    items: (items || []).map((it) => ({
      ...it,
      dining_court: court,
      station: name,
      meal_time: mealKey,
    })),
  }));
}
