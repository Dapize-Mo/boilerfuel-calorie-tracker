import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';
const USER_PREFS_COOKIE_KEY = 'boilerfuel_user_prefs_v1';

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

function startOfDate(dateString) {
  const date = new Date(dateString);
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
  const date = new Date(dateString);
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

export default function DashboardDesign3() {
  const [foods, setFoods] = useState([]);
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
        if (!menuError) {
          setMenuError(error?.message || 'Failed to load activities.');
        }
      }
    }

    loadDiningCourts();
    loadActivities();
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

  const foodsById = useMemo(() => {
    const map = new Map();
    foods.forEach((food) => {
      if (food && typeof food.id === 'number') {
        map.set(food.id, food);
      }
    });
    return map;
  }, [foods]);

  const foodsByStation = useMemo(() => {
    const grouped = {};
    foods.forEach((food) => {
      const station = food.station || 'Other Items';
      if (!grouped[station]) {
        grouped[station] = [];
      }
      grouped[station].push(food);
    });
    return grouped;
  }, [foods]);

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
    persistActivityLogs([]);
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
          <title>Loading... - BoilerFuel Dashboard</title>
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
        <title>Design 3 - Minimalist Single Column</title>
        <meta name="description" content="Clean minimalist dashboard design" />
      </Head>
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
          {/* Minimalist Header */}
          <header className="border-b border-slate-200 pb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-light text-slate-900">Design 3</h1>
              <div className="flex gap-2">
                <Link
                  href="/dashboard-selector"
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 underline"
                >
                  Back
                </Link>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-500">Minimalist single-column layout</p>
          </header>

          {menuError && (
            <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-red-700 text-sm">
              {menuError}
            </div>
          )}

          {success && (
            <div className="border-l-4 border-green-500 bg-green-50 px-4 py-3 text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Date Selector */}
          <div className="flex items-center justify-between py-4 border-b border-slate-200">
            <h2 className="text-xl font-light text-slate-900">{formatDateDisplay(selectedDate)}</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={formatDateForInput(startOfToday())}
              className="border-b border-slate-300 px-2 py-1 text-slate-900 text-sm focus:outline-none focus:border-slate-900"
            />
          </div>

          {/* Simple Stats */}
          <div className="space-y-3 py-4">
            <MinimalStatRow label="Calories" value={Math.round(totals.calories)} goal={userPrefs.showGoals ? goals.calories : null} unit="" />
            <MinimalStatRow label="Protein" value={Math.round(totals.protein)} goal={userPrefs.showGoals ? goals.protein : null} unit="g" />
            <MinimalStatRow label="Carbs" value={Math.round(totals.carbs)} goal={userPrefs.showGoals ? goals.carbs : null} unit="g" />
            <MinimalStatRow label="Fats" value={Math.round(totals.fats)} goal={userPrefs.showGoals ? goals.fats : null} unit="g" />
            <MinimalStatRow label="Activity" value={Math.round(totals.activityMinutes)} goal={userPrefs.showGoals ? goals.activityMinutes : null} unit="min" />
            <MinimalStatRow label="Burned" value={Math.round(totals.burned)} goal={null} unit="cal" />
            <div className="pt-3 border-t border-slate-200">
              <MinimalStatRow label="Net Calories" value={Math.round(totals.net)} goal={null} unit="" isBold />
            </div>
          </div>

          {/* Goals Section */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light text-slate-900">Goals</h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userPrefs.showGoals}
                    onChange={handleToggleGoals}
                    className="rounded border-slate-300 text-slate-900"
                  />
                  <span className="text-slate-600">Show progress</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setGoalForm(goals);
                    setEditingGoals(true);
                  }}
                  className="text-sm text-slate-600 hover:text-slate-900 underline"
                >
                  Edit
                </button>
              </div>
            </div>

            {editingGoals ? (
              <form onSubmit={handleSaveGoals} className="space-y-3">
                <div className="space-y-2">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={goalForm.calories}
                    onChange={(e) => setGoalForm({ ...goalForm, calories: e.target.value })}
                    className="w-full border-b border-slate-300 px-2 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                    placeholder="Calories goal"
                  />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={goalForm.protein}
                    onChange={(e) => setGoalForm({ ...goalForm, protein: e.target.value })}
                    className="w-full border-b border-slate-300 px-2 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                    placeholder="Protein goal (g)"
                  />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={goalForm.carbs}
                    onChange={(e) => setGoalForm({ ...goalForm, carbs: e.target.value })}
                    className="w-full border-b border-slate-300 px-2 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                    placeholder="Carbs goal (g)"
                  />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={goalForm.fats}
                    onChange={(e) => setGoalForm({ ...goalForm, fats: e.target.value })}
                    className="w-full border-b border-slate-300 px-2 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                    placeholder="Fats goal (g)"
                  />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={goalForm.activityMinutes}
                    onChange={(e) => setGoalForm({ ...goalForm, activityMinutes: e.target.value })}
                    className="w-full border-b border-slate-300 px-2 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                    placeholder="Activity goal (min)"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white text-sm hover:bg-slate-800"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelGoals}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm underline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-sm text-slate-600 space-y-1">
                <p>Calories: {goals.calories}</p>
                <p>Protein: {goals.protein}g</p>
                <p>Carbs: {goals.carbs}g</p>
                <p>Fats: {goals.fats}g</p>
                <p>Activity: {goals.activityMinutes} min</p>
              </div>
            )}
          </div>

          {/* Food Section */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-light text-slate-900 mb-4">Food Menu</h2>

            <div className="space-y-2 mb-4">
              {diningCourts.length > 0 && (
                <select
                  value={selectedDiningCourt}
                  onChange={(e) => setSelectedDiningCourt(e.target.value)}
                  className="w-full border-b border-slate-300 px-2 py-2 text-slate-900 text-sm focus:outline-none focus:border-slate-900"
                >
                  <option value="">All Dining Courts</option>
                  {diningCourts.map((court) => (
                    <option key={court} value={court}>
                      {court.charAt(0).toUpperCase() + court.slice(1)}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={selectedMealTime}
                onChange={(e) => setSelectedMealTime(e.target.value)}
                className="w-full border-b border-slate-300 px-2 py-2 text-slate-900 text-sm focus:outline-none focus:border-slate-900"
              >
                <option value="">All Meal Times</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="late lunch">Late Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>

            {foods.length === 0 ? (
              <p className="text-slate-500 text-sm">No foods available</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(foodsByStation)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([station, stationFoods]) => (
                    <div key={station}>
                      <h3 className="text-sm font-medium text-slate-900 mb-2 pb-1 border-b border-slate-200">
                        {station}
                      </h3>
                      <div className="space-y-2">
                        {stationFoods.map((food) => {
                          const macros = food.macros || {};
                          return (
                            <div
                              key={food.id}
                              className="flex items-center justify-between gap-4 py-2 hover:bg-slate-50"
                            >
                              <div className="flex-1">
                                <div className="text-sm text-slate-900">{food.name}</div>
                                <div className="text-xs text-slate-500">
                                  {food.calories}cal • P:{Math.round(macros.protein || 0)} C:{Math.round(macros.carbs || 0)} F:{Math.round(macros.fats || 0)}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleQuickAdd(food.id, 1)}
                                className="px-3 py-1 text-xs border border-slate-300 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Logged Meals */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-light text-slate-900 mb-4">Logged Meals</h3>
            {selectedDayLogs.length === 0 ? (
              <p className="text-slate-500 text-sm">No meals logged</p>
            ) : (
              <div className="space-y-2">
                {selectedDayLogs.map((log) => {
                  const food = foodsById.get(log.foodId);
                  if (!food) return null;

                  const macros = food.macros || {};
                  const servingsValue = Number(log.servings) || 0;

                  return (
                    <div key={log.id} className="flex items-start justify-between gap-4 py-2 border-b border-slate-100">
                      <div className="flex-1">
                        <div className="text-sm text-slate-900">{food.name}</div>
                        <div className="text-xs text-slate-500">
                          {servingsValue}x • {Math.round((food.calories || 0) * servingsValue)}cal
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLog(log.id)}
                        className="text-xs text-red-600 hover:text-red-700 underline"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Section */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light text-slate-900">Activities</h3>
              <Link
                href="/gym"
                className="text-sm text-slate-600 hover:text-slate-900 underline"
              >
                Gym Dashboard
              </Link>
            </div>

            {selectedDayActivityLogs.length === 0 ? (
              <p className="text-slate-500 text-sm">No activities logged</p>
            ) : (
              <div className="space-y-2">
                {selectedDayActivityLogs.map((log) => {
                  const activity = activitiesById.get(log.activityId);
                  if (!activity) return null;

                  const durationValue = Number(log.duration) || 0;
                  const caloriesBurned = Math.round((activity.calories_per_hour * durationValue) / 60);

                  return (
                    <div key={log.id} className="flex items-start justify-between gap-4 py-2 border-b border-slate-100">
                      <div className="flex-1">
                        <div className="text-sm text-slate-900">{activity.name}</div>
                        <div className="text-xs text-slate-500">
                          {durationValue}min • {caloriesBurned}cal
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveActivityLog(log.id)}
                        className="text-xs text-red-600 hover:text-red-700 underline"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function MinimalStatRow({ label, value, goal, unit, isBold = false }) {
  const hasGoal = goal !== null && goal !== undefined;
  const percentage = hasGoal && goal > 0 ? Math.min(100, (value / goal) * 100) : null;

  return (
    <div className="flex items-center justify-between py-2">
      <span className={`text-slate-600 ${isBold ? 'font-medium' : ''}`}>{label}</span>
      <div className="flex items-center gap-4">
        {hasGoal && percentage !== null && (
          <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${percentage >= 100 ? 'bg-green-500' : 'bg-slate-900'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
        <span className={`text-slate-900 ${isBold ? 'font-medium' : ''} min-w-[80px] text-right`}>
          {value}{unit}
          {hasGoal && <span className="text-slate-400 text-sm ml-1">/ {goal}{unit}</span>}
        </span>
      </div>
    </div>
  );
}
