import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';
const USER_PREFS_COOKIE_KEY = 'boilerfuel_user_prefs_v1';

// Helper function to format next available times
function formatNextAvailable(nextAvailable) {
  if (!nextAvailable || !Array.isArray(nextAvailable) || nextAvailable.length === 0) {
    return null;
  }

  // Get upcoming occurrences (up to 3)
  const upcoming = nextAvailable.slice(0, 3);
  
  return upcoming.map(item => {
    const date = new Date(item.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dayLabel;
    if (date.toDateString() === today.toDateString()) {
      dayLabel = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayLabel = 'Tomorrow';
    } else {
      dayLabel = item.day_name;
    }
    
    return `${dayLabel} - ${item.meal_time}`;
  }).join(', ');
}

function parseGoalsCookie() {
  const raw = readCookie(GOALS_COOKIE_KEY);
  if (!raw) {
    return {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fats: 65,
      activityMinutes: 30,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      calories: Number(parsed?.calories) || 2000,
      protein: Number(parsed?.protein) || 150,
      carbs: Number(parsed?.carbs) || 250,
      fats: Number(parsed?.fats) || 65,
      activityMinutes: Number(parsed?.activityMinutes) || 30,
    };
  } catch (error) {
    return {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fats: 65,
      activityMinutes: 30,
    };
  }
}

function parseUserPrefsCookie() {
  const raw = readCookie(USER_PREFS_COOKIE_KEY);
  if (!raw) {
    return {
      showGoals: true,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      showGoals: parsed?.showGoals !== false,
    };
  } catch (error) {
    return {
      showGoals: true,
    };
  }
}

function parseLogsCookie() {
  const raw = readCookie(LOG_COOKIE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      deleteCookie(LOG_COOKIE_KEY);
      return [];
    }

    return parsed
      .map((entry, index) => {
        const foodId = Number(entry?.foodId);
        const servings = Number(entry?.servings);
        if (!Number.isInteger(foodId) || !Number.isFinite(servings) || servings <= 0) {
          return null;
        }

        const timestamp = typeof entry?.timestamp === 'string' ? entry.timestamp : new Date().toISOString();
        const id = Number(entry?.id) || Date.now() - index;

        return {
          id,
          foodId,
          servings,
          timestamp,
        };
      })
      .filter(Boolean);
  } catch (error) {
    deleteCookie(LOG_COOKIE_KEY);
    return [];
  }
}

function parseActivityLogsCookie() {
  const raw = readCookie(ACTIVITY_LOG_COOKIE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      deleteCookie(ACTIVITY_LOG_COOKIE_KEY);
      return [];
    }

    return parsed
      .map((entry, index) => {
        const activityId = Number(entry?.activityId);
        const duration = Number(entry?.duration);
        if (!Number.isInteger(activityId) || !Number.isFinite(duration) || duration <= 0) {
          return null;
        }

        const timestamp = typeof entry?.timestamp === 'string' ? entry.timestamp : new Date().toISOString();
        const id = Number(entry?.id) || Date.now() - index;

        return {
          id,
          activityId,
          duration,
          timestamp,
        };
      })
      .filter(Boolean);
  } catch (error) {
    deleteCookie(ACTIVITY_LOG_COOKIE_KEY);
    return [];
  }
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Parse a YYYY-MM-DD string as a local date (avoid UTC shifting)
function parseLocalDate(dateString) {
  if (!dateString) return startOfToday();
  const parts = String(dateString).split('-').map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    const [y, m, d] = parts;
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const fallback = new Date(dateString);
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

function startOfDate(dateString) {
  const date = parseLocalDate(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateString) {
  const date = parseLocalDate(dateString);
  const today = startOfToday();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (formatDateForInput(date) === formatDateForInput(today)) {
    return 'Today';
  } else if (formatDateForInput(date) === formatDateForInput(yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
}

function isSameDay(timestamp, selectedDateStart) {
  if (!timestamp) {
    return false;
  }
  const date = new Date(timestamp);
  return (
    date.getFullYear() === selectedDateStart.getFullYear() &&
    date.getMonth() === selectedDateStart.getMonth() &&
    date.getDate() === selectedDateStart.getDate()
  );
}

export default function FoodDashboard() {
  const [foods, setFoods] = useState([]);
  const [allFoods, setAllFoods] = useState([]); // Unfiltered foods for stats calculation
  const [activities, setActivities] = useState([]);
  const [diningCourts, setDiningCourts] = useState([]);
  const [selectedDiningCourt, setSelectedDiningCourt] = useState('');
  const [selectedMealTime, setSelectedMealTime] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(startOfToday()));
  const [logs, setLogs] = useState(() => parseLogsCookie());
  const [activityLogs, setActivityLogs] = useState(() => parseActivityLogsCookie());
  const [goals, setGoals] = useState(() => parseGoalsCookie());
  const [userPrefs, setUserPrefs] = useState(() => parseUserPrefsCookie());
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState(() => parseGoalsCookie());
  const [loading, setLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [success, setSuccess] = useState('');
  // Food details modal
  const [selectedFood, setSelectedFood] = useState(null);
  // Add Meal modal
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [addMealStep, setAddMealStep] = useState(1); // 1 = dining court, 2 = food selection
  const [addMealDiningCourt, setAddMealDiningCourt] = useState('');
  const [addMealMealTime, setAddMealMealTime] = useState('');
  const [addMealSearchQuery, setAddMealSearchQuery] = useState('');
  const [addingFoodId, setAddingFoodId] = useState(null); // Track which food is being added for animation
  const successTimeout = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDiningCourts() {
      try {
        const data = await apiCall('/api/dining-courts');
        if (!isMounted) return;
        setDiningCourts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load dining courts:', error);
      }
    }

    async function loadActivities() {
      try {
        const data = await apiCall('/api/activities');
        if (!isMounted) return;
        setActivities(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) return;
        setMenuError(error?.message || 'Failed to load activities.');
      }
    }

    async function loadAllFoods() {
      try {
        const data = await apiCall('/api/foods');
        if (!isMounted) return;
        setAllFoods(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load all foods:', error);
      }
    }

    loadDiningCourts();
    loadActivities();
    loadAllFoods();
    setLoading(false);

    return () => {
      isMounted = false;
      if (successTimeout.current) {
        clearTimeout(successTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadFoods() {
      try {
        const params = new URLSearchParams();
        if (selectedDiningCourt) {
          params.append('dining_court', selectedDiningCourt);
        }
        if (selectedMealTime) {
          params.append('meal_time', selectedMealTime);
        }
        const url = params.toString() ? `/api/foods?${params.toString()}` : '/api/foods';
        const data = await apiCall(url);
        if (!isMounted) return;
        setFoods(Array.isArray(data) ? data : []);
        setMenuError('');
      } catch (error) {
        if (!isMounted) return;
        setMenuError(error?.message || 'Failed to load menu items.');
      }
    }

    loadFoods();

    return () => {
      isMounted = false;
    };
  }, [selectedDiningCourt, selectedMealTime]);

  // Load foods for Add Meal modal when moving to Step 2
  useEffect(() => {
    let isMounted = true;

    async function loadModalFoods() {
      if (addMealStep !== 2 || !addMealDiningCourt || !addMealMealTime) {
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append('dining_court', addMealDiningCourt);
        params.append('meal_time', addMealMealTime);
        const url = `/api/foods?${params.toString()}`;
        const data = await apiCall(url);
        if (!isMounted) return;
        setFoods(Array.isArray(data) ? data : []);
        setMenuError('');
      } catch (error) {
        if (!isMounted) return;
        setMenuError(error?.message || 'Failed to load menu items.');
      }
    }

    loadModalFoods();

    return () => {
      isMounted = false;
    };
  }, [addMealStep, addMealDiningCourt, addMealMealTime]);

  // Use allFoods for stats calculation so filters don't affect logged meals
  const foodsById = useMemo(() => {
    const map = new Map();
    allFoods.forEach((food) => {
      if (food && typeof food.id === 'number') {
        map.set(food.id, food);
      }
    });
    return map;
  }, [allFoods]);

  // Helper function to check if a food is available today
  const isFoodAvailableToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return (food) => {
      // If no next_available data, assume it's available (for backwards compatibility)
      if (!food.next_available || !Array.isArray(food.next_available) || food.next_available.length === 0) {
        return true;
      }
      // Check if today's date is in the next_available array
      return food.next_available.some(slot => {
        if (!slot.date) return false;
        const slotDate = new Date(slot.date).toISOString().split('T')[0];
        return slotDate === todayStr;
      });
    };
  }, []);

  const foodsByStation = useMemo(() => {
    const grouped = {};
    // Only include foods that are available today
    const availableToday = foods.filter(isFoodAvailableToday);
    availableToday.forEach((food) => {
      const station = food.station || 'Other Items';
      if (!grouped[station]) {
        grouped[station] = [];
      }
      grouped[station].push(food);
    });
    return grouped;
  }, [foods, isFoodAvailableToday]);

  const activitiesById = useMemo(() => {
    const map = new Map();
    activities.forEach((activity) => {
      if (activity && typeof activity.id === 'number') {
        map.set(activity.id, activity);
      }
    });
    return map;
  }, [activities]);

  const selectedDateStart = useMemo(() => startOfDate(selectedDate), [selectedDate]);

  const selectedDayLogs = useMemo(
    () => logs.filter((log) => isSameDay(log.timestamp, selectedDateStart)),
    [logs, selectedDateStart]
  );

  const selectedDayActivityLogs = useMemo(
    () => activityLogs.filter((log) => isSameDay(log.timestamp, selectedDateStart)),
    [activityLogs, selectedDateStart]
  );

  const totals = useMemo(() => {
    const consumed = selectedDayLogs.reduce(
      (acc, log) => {
        const food = foodsById.get(log.foodId);
        if (!food) {
          return acc;
        }

        const servingsValue = Number(log.servings) || 0;
        const macros = food.macros || {};

        acc.calories += (food.calories || 0) * servingsValue;
        acc.protein += (macros.protein || 0) * servingsValue;
        acc.carbs += (macros.carbs || 0) * servingsValue;
        acc.fats += (macros.fats || 0) * servingsValue;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const burned = selectedDayActivityLogs.reduce((total, log) => {
      const activity = activitiesById.get(log.activityId);
      if (!activity) {
        return total;
      }
      const durationValue = Number(log.duration) || 0;
      return total + ((activity.calories_per_hour || 0) * durationValue) / 60;
    }, 0);

    const totalActivityMinutes = selectedDayActivityLogs.reduce((total, log) => {
      return total + (Number(log.duration) || 0);
    }, 0);

    return {
      ...consumed,
      burned,
      net: consumed.calories - burned,
      activityMinutes: totalActivityMinutes,
    };
  }, [selectedDayLogs, selectedDayActivityLogs, foodsById, activitiesById]);

  function persistLogs(nextLogs) {
    setLogs(nextLogs);
    if (nextLogs.length === 0) {
      deleteCookie(LOG_COOKIE_KEY);
    } else {
      writeCookie(LOG_COOKIE_KEY, JSON.stringify(nextLogs));
    }
  }

  function persistActivityLogs(nextLogs) {
    setActivityLogs(nextLogs);
    if (nextLogs.length === 0) {
      deleteCookie(ACTIVITY_LOG_COOKIE_KEY);
    } else {
      writeCookie(ACTIVITY_LOG_COOKIE_KEY, JSON.stringify(nextLogs));
    }
  }

  function persistGoals(nextGoals) {
    setGoals(nextGoals);
    writeCookie(GOALS_COOKIE_KEY, JSON.stringify(nextGoals));
  }

  function persistUserPrefs(nextPrefs) {
    setUserPrefs(nextPrefs);
    writeCookie(USER_PREFS_COOKIE_KEY, JSON.stringify(nextPrefs));
  }

  function handleQuickAdd(foodId, servingAmount = 1) {
    // Add visual feedback
    setAddingFoodId(foodId);

    const newLog = {
      id: Date.now(),
      foodId: Number(foodId),
      servings: servingAmount,
      timestamp: new Date().toISOString(),
    };

    const nextLogs = [newLog, ...logs];
    persistLogs(nextLogs);
    setSuccess('Meal added!');

    if (successTimeout.current) {
      clearTimeout(successTimeout.current);
    }
    successTimeout.current = window.setTimeout(() => setSuccess(''), 2500);

    // Clear the animation after a short delay
    setTimeout(() => setAddingFoodId(null), 600);
  }

  function handleRemoveLog(logId) {
    const nextLogs = logs.filter((log) => log.id !== logId);
    persistLogs(nextLogs);
  }

  function handleRemoveActivityLog(logId) {
    const nextLogs = activityLogs.filter((log) => log.id !== logId);
    persistActivityLogs(nextLogs);
  }

  function handleClearLogs() {
    persistLogs([]);
  }

  function handleSaveGoals(event) {
    event.preventDefault();
    const newGoals = {
      calories: Math.max(0, Number(goalForm.calories) || 0),
      protein: Math.max(0, Number(goalForm.protein) || 0),
      carbs: Math.max(0, Number(goalForm.carbs) || 0),
      fats: Math.max(0, Number(goalForm.fats) || 0),
      activityMinutes: Math.max(0, Number(goalForm.activityMinutes) || 0),
    };
    persistGoals(newGoals);
    setEditingGoals(false);
  }

  function handleCancelGoals() {
    setGoalForm(goals);
    setEditingGoals(false);
  }

  function handleToggleGoals() {
    const nextPrefs = { ...userPrefs, showGoals: !userPrefs.showGoals };
    persistUserPrefs(nextPrefs);
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... - BoilerFuel Food Tracker</title>
        </Head>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-xl">Loading menu...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Food Tracker - BoilerFuel</title>
        <meta name="description" content="Track your meals with BoilerFuel calorie tracker" />
      </Head>
  <div>
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Page Header with Actions */}
          <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🍽️</span>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Food Tracker
                  </h1>
                </div>
                <p className="text-theme-text-tertiary mt-2">Track your meals and nutrition—all data stays on this device only.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMealModal(true);
                    setAddMealStep(1);
                    setAddMealDiningCourt('');
                    setAddMealMealTime('');
                    setAddMealSearchQuery('');
                  }}
                  className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 font-semibold transition-all duration-300 glow-green whitespace-nowrap"
                >
                  + Add Meal
                </button>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold transition-all whitespace-nowrap"
                >
                  Clear Logs
                </button>
              </div>
            </div>
          </div>

          {menuError && (
            <div className="rounded-xl border border-red-500 bg-red-500/10 px-4 py-3 text-red-400">
              {menuError}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-500 bg-green-500/10 px-4 py-3 text-green-400">
              {success}
            </div>
          )}

          {/* Date Selector */}
          <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-theme-text-primary">📅 {formatDateDisplay(selectedDate)}</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={formatDateForInput(startOfToday())}
                className="rounded-xl border border-theme-border-primary bg-theme-bg-tertiary/80 px-4 py-2 text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {/* Food Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardModern
              label="Calories"
              value={Math.round(totals.calories)}
              goal={userPrefs.showGoals ? goals.calories : null}
              gradient="from-yellow-500 to-orange-500"
              icon="🔥"
            />
            <StatCardModern
              label="Protein"
              value={`${Math.round(totals.protein)}g`}
              goal={userPrefs.showGoals ? goals.protein : null}
              gradient="from-green-500 to-emerald-500"
              icon="🥩"
            />
            <StatCardModern
              label="Carbs"
              value={`${Math.round(totals.carbs)}g`}
              goal={userPrefs.showGoals ? goals.carbs : null}
              gradient="from-blue-500 to-indigo-500"
              icon="🍞"
            />
            <StatCardModern
              label="Fats"
              value={`${Math.round(totals.fats)}g`}
              goal={userPrefs.showGoals ? goals.fats : null}
              gradient="from-purple-500 to-pink-500"
              icon="🥑"
            />
          </div>

          {/* Goals Section */}
          <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-theme-text-primary">🎯 Food Goals</h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userPrefs.showGoals}
                    onChange={handleToggleGoals}
                    className="rounded border-theme-border-primary bg-theme-bg-tertiary text-yellow-500 focus:ring-2 focus:ring-yellow-500"
                  />
                  <span className="text-theme-text-secondary">Show progress</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setGoalForm(goals);
                    setEditingGoals(true);
                  }}
                  className="rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 px-4 py-2 text-sm font-semibold text-yellow-300 transition-all"
                >
                  Edit Goals
                </button>
              </div>
            </div>

            {editingGoals ? (
              <form onSubmit={handleSaveGoals} className="bg-theme-bg-tertiary/50 rounded-xl p-4 border border-theme-border-primary">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Calories</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={goalForm.calories}
                      onChange={(e) => setGoalForm({ ...goalForm, calories: e.target.value })}
                      className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-3 py-2 text-theme-text-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Protein (g)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={goalForm.protein}
                      onChange={(e) => setGoalForm({ ...goalForm, protein: e.target.value })}
                      className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-3 py-2 text-theme-text-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={goalForm.carbs}
                      onChange={(e) => setGoalForm({ ...goalForm, carbs: e.target.value })}
                      className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-3 py-2 text-theme-text-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-theme-text-tertiary mb-1">Fats (g)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={goalForm.fats}
                      onChange={(e) => setGoalForm({ ...goalForm, fats: e.target.value })}
                      className="w-full rounded-lg border border-theme-border-primary bg-theme-card-bg px-3 py-2 text-theme-text-primary text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-600 transition-all duration-300 glow-yellow"
                  >
                    Save Goals
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelGoals}
                    className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-600 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GoalCardModern label="Calories" value={goals.calories} current={Math.round(totals.calories)} showProgress={userPrefs.showGoals} />
                <GoalCardModern label="Protein" value={`${goals.protein}g`} current={`${Math.round(totals.protein)}g`} showProgress={userPrefs.showGoals} />
                <GoalCardModern label="Carbs" value={`${goals.carbs}g`} current={`${Math.round(totals.carbs)}g`} showProgress={userPrefs.showGoals} />
                <GoalCardModern label="Fats" value={`${goals.fats}g`} current={`${Math.round(totals.fats)}g`} showProgress={userPrefs.showGoals} />
              </div>
            )}
          </div>

          {/* Food Section */}
          <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-6">
            <h2 className="text-2xl font-bold mb-6 text-theme-text-primary">🍽️ Food Menu</h2>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {diningCourts.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-theme-text-secondary">Dining Court</label>
                  <select
                    value={selectedDiningCourt}
                    onChange={(e) => setSelectedDiningCourt(e.target.value)}
                    className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary/80 px-4 py-2.5 text-theme-text-primary focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">All Dining Courts</option>
                    {diningCourts.map((court) => (
                      <option key={court} value={court}>
                        {court.charAt(0).toUpperCase() + court.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-theme-text-secondary">Meal Time</label>
                <select
                  value={selectedMealTime}
                  onChange={(e) => setSelectedMealTime(e.target.value)}
                  className="w-full rounded-xl border border-theme-border-primary bg-theme-bg-tertiary/80 px-4 py-2.5 text-theme-text-primary focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">All Meal Times</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="late lunch">Late Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
            </div>

            {foods.length === 0 ? (
              <p className="text-theme-text-tertiary">No foods available</p>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {Object.entries(foodsByStation)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([station, stationFoods]) => (
                    <div key={station} className="rounded-xl bg-theme-card-bg border border-theme-card-border overflow-hidden">
                      <div className="bg-gradient-to-r from-yellow-600 to-orange-500 px-4 py-3">
                        <h3 className="text-lg font-bold text-slate-900">{station}</h3>
                        <p className="text-xs text-slate-800">{stationFoods.length} items</p>
                      </div>
                      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                        {stationFoods.map((food) => {
                          const macros = food.macros || {};
                          const nextAvail = food.next_available || [];
                          const hasForecast = nextAvail.length > 0;
                          
                          return (
                            <div
                              key={food.id}
                              onClick={() => {
                                console.log('Card clicked:', food.name);
                                setSelectedFood(food);
                              }}
                              className="bg-slate-700/50 backdrop-blur rounded-lg px-3 py-2 hover:bg-slate-600/50 transition-all border border-theme-border-primary/30 cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="font-semibold text-theme-text-primary text-sm">{food.name}</div>
                                    {food.meal_time && hasForecast && (
                                      <div className="relative group">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-help">
                                          {food.meal_time}
                                        </span>
                                        {/* Tooltip */}
                                        <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block w-64 p-3 bg-theme-card-bg border border-purple-500/50 rounded-lg shadow-xl pointer-events-none">
                                          <div className="text-xs font-semibold text-purple-300 mb-2">📅 7-Day Forecast</div>
                                          <div className="space-y-1 max-h-48 overflow-y-auto">
                                            {nextAvail.slice(0, 7).map((slot, idx) => {
                                              const date = new Date(slot.date);
                                              const today = new Date();
                                              const tomorrow = new Date(today);
                                              tomorrow.setDate(tomorrow.getDate() + 1);
                                              
                                              let dayLabel;
                                              if (date.toDateString() === today.toDateString()) {
                                                dayLabel = 'Today';
                                              } else if (date.toDateString() === tomorrow.toDateString()) {
                                                dayLabel = 'Tomorrow';
                                              } else {
                                                dayLabel = slot.day_name;
                                              }
                                              
                                              return (
                                                <div key={idx} className="text-xs text-theme-text-secondary flex justify-between items-center py-1 border-b border-theme-border-primary/50 last:border-0">
                                                  <span className="font-medium">{dayLabel}</span>
                                                  <span className="text-emerald-400">{slot.meal_time}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-theme-text-secondary mt-1">
                                    <span className="font-semibold text-yellow-400">{food.calories} cal</span>
                                    <span className="text-theme-text-tertiary ml-1">({macros.serving_size || '1 serving'})</span>
                                    {(macros.protein || macros.carbs || macros.fats) && (
                                      <span className="block mt-0.5">
                                        P: {Math.round(macros.protein || 0)}g
                                        • C: {Math.round(macros.carbs || 0)}g
                                        • F: {Math.round(macros.fats || 0)}g
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleQuickAdd(food.id, 1); }}
                                  className={`rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-theme-text-primary font-bold w-8 h-8 flex items-center justify-center transition-all shadow-lg glow-green ${
                                    addingFoodId === food.id ? 'scale-125 rotate-90' : ''
                                  }`}
                                >
                                  {addingFoodId === food.id ? '✓' : '+'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Meals Log */}
          <div className="backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-bold mb-4 text-theme-text-primary">📝 Logged Meals</h3>
            {selectedDayLogs.length === 0 ? (
              <p className="text-theme-text-tertiary">No meals logged for this date.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {selectedDayLogs.map((log) => {
                  const food = foodsById.get(log.foodId);
                  if (!food) return null;

                  const macros = food.macros || {};
                  const servingsValue = Number(log.servings) || 0;

                  return (
                    <div key={log.id} className="rounded-xl bg-theme-bg-tertiary/50 backdrop-blur border border-theme-border-primary p-4 hover:border-yellow-500/50 transition-all card-glow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-theme-text-primary">{food.name}</h4>
                          <p className="text-sm text-theme-text-tertiary">
                            {servingsValue} {servingsValue === 1 ? 'serving' : 'servings'}
                            {macros.serving_size && (
                              <span className="ml-1">({macros.serving_size})</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-right">
                            <p className="font-bold text-yellow-400">
                              {Math.round((food.calories || 0) * servingsValue)} cal
                            </p>
                            <p className="text-xs text-theme-text-tertiary">
                              P: {Math.round((macros.protein || 0) * servingsValue)}g
                              • C: {Math.round((macros.carbs || 0) * servingsValue)}g
                              • F: {Math.round((macros.fats || 0) * servingsValue)}g
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLog(log.id)}
                            className="rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-bold w-8 h-8 flex items-center justify-center transition-all shadow-lg"
                            title="Remove this meal"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Food details modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedFood(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-theme-card-border bg-theme-card-bg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="text-xl font-bold text-theme-text-primary">{selectedFood.name}</h4>
                <p className="text-xs text-theme-text-tertiary mt-1">
                  Serving size: {selectedFood.macros?.serving_size || '1 serving'}
                </p>
              </div>
              <button onClick={() => setSelectedFood(null)} className="text-theme-text-secondary hover:text-theme-text-primary">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-theme-bg-tertiary/60 p-3 border border-theme-border-primary">
                <div className="text-theme-text-tertiary">Calories</div>
                <div className="text-theme-text-primary font-semibold">{selectedFood.calories || 0}</div>
              </div>
              <div className="rounded-lg bg-theme-bg-tertiary/60 p-3 border border-theme-border-primary">
                <div className="text-theme-text-tertiary">Protein</div>
                <div className="text-theme-text-primary font-semibold">{Math.round(selectedFood.macros?.protein || 0)}g</div>
              </div>
              <div className="rounded-lg bg-theme-bg-tertiary/60 p-3 border border-theme-border-primary">
                <div className="text-theme-text-tertiary">Carbs</div>
                <div className="text-theme-text-primary font-semibold">{Math.round(selectedFood.macros?.carbs || 0)}g</div>
              </div>
              <div className="rounded-lg bg-theme-bg-tertiary/60 p-3 border border-theme-border-primary">
                <div className="text-theme-text-tertiary">Fats</div>
                <div className="text-theme-text-primary font-semibold">{Math.round(selectedFood.macros?.fats || 0)}g</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-theme-bg-tertiary/60 p-3 border border-theme-border-primary">
                <div className="text-theme-text-tertiary">Dining Court</div>
                <div className="text-theme-text-primary font-medium">{selectedFood.dining_court || '—'}</div>
              </div>
              <div className="rounded-lg bg-theme-bg-tertiary/60 p-3 border border-theme-border-primary">
                <div className="text-theme-text-tertiary">Station</div>
                <div className="text-theme-text-primary font-medium">{selectedFood.station || '—'}</div>
              </div>
              <div className="rounded-lg bg-theme-bg-tertiary/60 p-3 border border-theme-border-primary col-span-2">
                <div className="text-theme-text-tertiary">Meal Time</div>
                <div className="text-theme-text-primary font-medium">{selectedFood.meal_time || '—'}</div>
              </div>
            </div>
            {Array.isArray(selectedFood.next_available) && selectedFood.next_available.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-purple-300 font-semibold mb-2">📅 7-Day Forecast</div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-theme-border-primary">
                  {selectedFood.next_available.slice(0,7).map((slot, i) => {
                    const date = new Date(slot.date);
                    const today = new Date();
                    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
                    let dayLabel = slot.day_name;
                    if (date.toDateString() === today.toDateString()) dayLabel = 'Today';
                    else if (date.toDateString() === tomorrow.toDateString()) dayLabel = 'Tomorrow';
                    return (
                      <div key={i} className="flex justify-between items-center px-3 py-2 text-sm border-b border-theme-border-primary last:border-0 bg-theme-bg-tertiary/40">
                        <span className="text-slate-200">{dayLabel}</span>
                        <span className="text-emerald-400">{slot.meal_time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setSelectedFood(null)} className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">Close</button>
              <button onClick={() => { handleQuickAdd(selectedFood.id, 1); setSelectedFood(null); }} className="rounded-lg bg-green-600 px-4 py-2 text-sm text-theme-text-primary hover:bg-green-700">+ Add 1 serving</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Meal Modal */}
      {showAddMealModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowAddMealModal(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-theme-card-border bg-theme-card-bg p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">

            {/* Step 1: Choose Dining Court & Meal Time */}
            {addMealStep === 1 && (
              <>
                <div className="flex items-start justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-theme-text-primary">Add Meal - Step 1</h3>
                    <p className="text-sm text-theme-text-tertiary mt-1">Where did you eat?</p>
                  </div>
                  <button onClick={() => setShowAddMealModal(false)} className="text-theme-text-secondary hover:text-theme-text-primary text-xl">✕</button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-theme-text-secondary mb-3">Dining Court</label>
                    <div className="grid grid-cols-2 gap-3">
                      {diningCourts.map((court) => (
                        <button
                          key={court}
                          onClick={() => setAddMealDiningCourt(court)}
                          className={`p-4 rounded-lg border transition-all duration-300 ${
                            addMealDiningCourt === court
                              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 glow-yellow'
                              : 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-primary hover:border-yellow-500/50'
                          }`}
                        >
                          <span className="text-lg font-semibold">{court}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-theme-text-secondary mb-3">Meal Time</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Breakfast', 'Lunch', 'Dinner'].map((meal) => (
                        <button
                          key={meal}
                          onClick={() => setAddMealMealTime(meal)}
                          className={`p-3 rounded-lg border transition-all duration-300 ${
                            addMealMealTime === meal
                              ? 'bg-orange-500/20 border-orange-500 text-orange-300 glow-orange'
                              : 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-primary hover:border-orange-500/50'
                          }`}
                        >
                          {meal}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowAddMealModal(false)}
                      className="w-full sm:w-auto px-6 py-2 rounded-lg bg-theme-bg-tertiary text-theme-text-primary hover:bg-theme-bg-hover transition-all duration-300 order-2 sm:order-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (addMealDiningCourt && addMealMealTime) {
                          setAddMealStep(2);
                        }
                      }}
                      disabled={!addMealDiningCourt || !addMealMealTime}
                      className="w-full sm:w-auto px-6 py-2 rounded-lg bg-green-500 text-slate-900 font-semibold hover:bg-green-600 transition-all duration-300 glow-green disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                    >
                      Next: Choose Food →
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Choose Food */}
            {addMealStep === 2 && (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-theme-text-primary">Add Meal - Step 2</h3>
                    <p className="text-sm text-theme-text-tertiary mt-1">
                      {addMealDiningCourt} • {addMealMealTime}
                    </p>
                  </div>
                  <button onClick={() => setShowAddMealModal(false)} className="text-theme-text-secondary hover:text-theme-text-primary text-xl">✕</button>
                </div>

                {/* Search Box */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search foods or stations..."
                    value={addMealSearchQuery}
                    onChange={(e) => setAddMealSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-theme-border-primary bg-theme-bg-tertiary px-4 py-2 text-theme-text-primary placeholder:text-theme-text-tertiary focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <p className="text-xs text-theme-text-tertiary mt-2">
                    {foods.filter(f => {
                      const matchesLocation = f.dining_court === addMealDiningCourt && f.meal_time === addMealMealTime;
                      const matchesSearch = !addMealSearchQuery ||
                        f.name.toLowerCase().includes(addMealSearchQuery.toLowerCase()) ||
                        (f.station || '').toLowerCase().includes(addMealSearchQuery.toLowerCase());
                      return matchesLocation && matchesSearch;
                    }).length} items found
                  </p>
                </div>

                {foods.filter(f => {
                  const matchesLocation = f.dining_court === addMealDiningCourt && f.meal_time === addMealMealTime;
                  const matchesSearch = !addMealSearchQuery ||
                    f.name.toLowerCase().includes(addMealSearchQuery.toLowerCase()) ||
                    (f.station || '').toLowerCase().includes(addMealSearchQuery.toLowerCase());
                  return matchesLocation && matchesSearch;
                }).length === 0 && (
                  <div className="text-center py-8 text-theme-text-tertiary">
                    {addMealSearchQuery ? `No items found matching "${addMealSearchQuery}"` : `No menu items found for ${addMealDiningCourt} at ${addMealMealTime}.`}
                  </div>
                )}

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {foods
                    .filter(f => {
                      const matchesLocation = f.dining_court === addMealDiningCourt && f.meal_time === addMealMealTime;
                      const matchesSearch = !addMealSearchQuery ||
                        f.name.toLowerCase().includes(addMealSearchQuery.toLowerCase()) ||
                        (f.station || '').toLowerCase().includes(addMealSearchQuery.toLowerCase());
                      return matchesLocation && matchesSearch;
                    })
                    .map((food) => {
                      const macros = food.macros || {};
                      return (
                        <div
                          key={food.id}
                          onClick={() => {
                            handleQuickAdd(food.id, 1);
                            setShowAddMealModal(false);
                          }}
                          className="p-4 rounded-lg bg-theme-bg-tertiary/50 border border-theme-border-primary hover:border-green-500 transition-all cursor-pointer card-glow"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-theme-text-primary">{food.name}</h4>
                                {food.station && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                    {food.station}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-theme-text-secondary">
                                <span className="font-semibold text-yellow-400">{food.calories} cal</span>
                                <span className="text-theme-text-tertiary ml-1">({macros.serving_size || '1 serving'})</span>
                              </div>
                              {(macros.protein || macros.carbs || macros.fats) && (
                                <div className="text-xs text-theme-text-tertiary mt-1">
                                  P: {Math.round(macros.protein || 0)}g
                                  • C: {Math.round(macros.carbs || 0)}g
                                  • F: {Math.round(macros.fats || 0)}g
                                </div>
                              )}
                            </div>
                            <div className="text-3xl">+</div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-theme-border-primary mt-6">
                  <button
                    onClick={() => setAddMealStep(1)}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg bg-theme-bg-tertiary text-theme-text-primary hover:bg-theme-bg-hover transition-all duration-300"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setShowAddMealModal(false)}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Modal component for food details is rendered within the page component below main markup

function StatCardModern({ label, value, goal, gradient, icon }) {
  const hasGoal = goal !== null && goal !== undefined;
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const numericGoal = typeof goal === 'string' ? parseFloat(goal) : goal;
  const percentage = hasGoal && numericGoal > 0 ? Math.min(100, (numericValue / numericGoal) * 100) : null;

  return (
  <div className="backdrop-blur-lg bg-theme-card-bg rounded-2xl border border-theme-card-border p-4 hover:scale-105 transition-transform">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-theme-text-tertiary font-medium">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {value}
      </p>
      {hasGoal && percentage !== null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-theme-text-tertiary mb-1">
            <span>Goal: {goal}</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="h-2 bg-theme-bg-tertiary rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCardModern({ label, value, current, showProgress }) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const numericCurrent = typeof current === 'string' ? parseFloat(current) : current;
  const percentage = numericValue > 0 ? Math.min(100, (numericCurrent / numericValue) * 100) : 0;
  const isComplete = percentage >= 100;

  return (
    <div className="rounded-xl bg-theme-bg-tertiary/50 backdrop-blur border border-theme-border-primary p-3">
      <p className="text-xs text-theme-text-tertiary mb-1">{label}</p>
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-lg font-bold text-theme-text-primary">{value}</p>
        {showProgress && (
          <p className={`text-sm ${isComplete ? 'text-green-400' : 'text-theme-text-tertiary'}`}>
            ({current})
          </p>
        )}
      </div>
      {showProgress && (
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isComplete ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
