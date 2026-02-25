import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSession, signIn } from 'next-auth/react';
import { useTheme } from '../context/ThemeContext';
import { useMeals } from '../context/MealContext';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { downloadAppleHealthExport } from '../utils/appleHealth';
import { generatePDFReport } from '../utils/pdfExport';

const QRCode = dynamic(() => import('../components/QRCode'), { ssr: false });

function ProgressBar({ label, current, goal, unit = '', color = 'bg-theme-text-primary' }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const over = current > goal;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-theme-text-tertiary">{label}</span>
        <span className="text-sm font-mono tabular-nums">
          <span className={over ? 'text-red-500 font-bold' : 'text-theme-text-primary'}>{Math.round(current)}</span>
          <span className="text-theme-text-tertiary"> / {goal}{unit}</span>
        </span>
      </div>
      <div className="h-2 w-full bg-theme-text-primary/10 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${over ? 'bg-red-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateKey(key) {
  const d = new Date(key + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function shiftDate(dateKey, delta) {
  const d = new Date(dateKey + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const { data: googleSession } = useSession();
  const { meals, goals, setGoals, totals, clearMeals, removeMeal, mealsByDate, getWeight, setWeight, weightByDate, exportData, importData, templates, saveTemplate, deleteTemplate, applyTemplate, dietaryPrefs, setDietaryPrefs, waterByDate, getWater, addWater, syncNow, reloadFromStorage, getStreak } = useMeals();
  const [editingGoals, setEditingGoals] = useState(false);
  const [draft, setDraft] = useState(goals);
  const [goalWarnings, setGoalWarnings] = useState([]);
  const [weightInput, setWeightInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayKey);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | creating | paired | joining | error
  const [syncCode, setSyncCode] = useState('');
  const [syncSecret, setSyncSecret] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinSecret, setJoinSecret] = useState('');
  const [syncError, setSyncError] = useState('');
  const [syncMsg, setSyncMsg] = useState('');
  const [weightImportStatus, setWeightImportStatus] = useState(''); // '' | 'success' | 'error'
  const [weightImportMsg, setWeightImportMsg] = useState('');
  const weightFileRef = useRef(null);
  const importFileRef = useRef(null);
  const [importMsg, setImportMsg] = useState('');
  const [logFilter, setLogFilter] = useState(null); // null | meal-time string

  // Notification settings
  const [notifPermission, setNotifPermission] = useState('default');
  const [mealReminder, setMealReminder] = useState(false);

  // Google Fit export state
  const [fitExporting, setFitExporting] = useState(false);
  const [fitMsg, setFitMsg] = useState('');
  const [fitError, setFitError] = useState('');
  const todayStr = getTodayKey();
  const thirtyDaysAgo = (() => { const d = new Date(todayStr + 'T00:00:00'); d.setDate(d.getDate() - 30); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const [fitStartDate, setFitStartDate] = useState(thirtyDaysAgo);
  const [fitEndDate, setFitEndDate] = useState(todayStr);

  // Swipe left/right to change date
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: useCallback(() => setSelectedDate(d => shiftDate(d, 1)), []),
    onSwipeRight: useCallback(() => setSelectedDate(d => shiftDate(d, -1)), []),
  });

  // Load notification state
  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
      setMealReminder(localStorage.getItem('boilerfuel_notif_meal') === '1');
    }
  }, []);

  async function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  }

  function toggleMealReminder(enabled) {
    setMealReminder(enabled);
    localStorage.setItem('boilerfuel_notif_meal', enabled ? '1' : '0');
  }

  // Check if already paired on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem('boilerfuel_sync_token');
      const secret = localStorage.getItem('boilerfuel_sync_secret');
      if (token && secret) {
        setSyncCode(token);
        setSyncSecret(secret);
        setSyncStatus('paired');
      }
    } catch {}
  }, []);

  const isToday = selectedDate === getTodayKey();

  // Meals for the selected date (today uses context's `meals`, other dates use mealsByDate)
  const dateMeals = useMemo(() => {
    if (isToday) return meals;
    return (mealsByDate || {})[selectedDate] || [];
  }, [isToday, meals, mealsByDate, selectedDate]);

  // Compute totals for the selected date
  const dateTotals = useMemo(() => {
    if (isToday) return totals;
    return dateMeals.reduce(
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
  }, [isToday, totals, dateMeals]);

  // Dates that have logged meals (for dot indicators)
  const datesWithData = useMemo(() => {
    return new Set(Object.keys(mealsByDate || {}));
  }, [mealsByDate]);

  // Logging streak (consecutive days from today going backward)
  const loggingStreak = useMemo(() => {
    let streak = 0;
    const today = getTodayKey();
    const d = new Date(today + 'T00:00:00');
    // Only count today if it has meals
    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if ((mealsByDate[key] || []).length > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [mealsByDate]);

  // Group meals by meal_time
  const mealGroups = useMemo(() => {
    const order = ['breakfast', 'brunch', 'lunch', 'dinner'];
    const normalize = (mt) => {
      const key = (mt || 'other').toLowerCase().trim();
      if (key === 'late lunch' || key === 'latelunch' || key === 'late-lunch') return ['lunch'];
      if (key.includes('/')) return key.split('/').map(k => k.trim());
      return [key];
    };
    const groups = {};
    for (const m of dateMeals) {
      const keys = normalize(m.meal_time);
      for (const key of keys) {
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
      }
    }
    const sorted = [];
    for (const key of order) {
      if (groups[key]) sorted.push({ label: key.charAt(0).toUpperCase() + key.slice(1), meals: groups[key] });
    }
    for (const key of Object.keys(groups)) {
      if (!order.includes(key)) {
        sorted.push({ label: key.charAt(0).toUpperCase() + key.slice(1), meals: groups[key] });
      }
    }
    return sorted;
  }, [dateMeals]);

  function startEditing() {
    setDraft(goals);
    setEditingGoals(true);
  }
  function saveGoals(force = false) {
    const cal = Math.max(0, parseInt(draft.calories) || 0);
    const protein = Math.max(0, parseInt(draft.protein) || 0);
    const carbs = Math.max(0, parseInt(draft.carbs) || 0);
    const fat = Math.max(0, parseInt(draft.fat) || 0);

    if (!force) {
      const warnings = [];
      if (cal > 0 && cal < 1200) warnings.push('Calorie goal is very low (under 1,200 cal/day). This may be unhealthy.');
      if (cal > 5000) warnings.push('Calorie goal is very high (over 5,000 cal/day). Verify this is intentional.');
      const macroCal = protein * 4 + carbs * 4 + fat * 9;
      if (cal > 0 && macroCal > 0 && Math.abs(macroCal - cal) / cal > 0.3) {
        warnings.push(`Macro totals (~${macroCal} cal) are more than 30% off from your calorie goal (${cal} cal).`);
      }
      if (warnings.length > 0) {
        setGoalWarnings(warnings);
        return;
      }
    }

    setGoalWarnings([]);
    setGoals({
      calories: Math.max(0, parseInt(draft.calories) || 0),
      protein: Math.max(0, parseInt(draft.protein) || 0),
      carbs: Math.max(0, parseInt(draft.carbs) || 0),
      fat: Math.max(0, parseInt(draft.fat) || 0),
      saturated_fat: Math.max(0, parseInt(draft.saturated_fat) || 0),
      fiber: Math.max(0, parseInt(draft.fiber) || 0),
      sugar: Math.max(0, parseInt(draft.sugar) || 0),
      sodium: Math.max(0, parseInt(draft.sodium) || 0),
      cholesterol: Math.max(0, parseInt(draft.cholesterol) || 0),
      added_sugar: Math.max(0, parseInt(draft.added_sugar) || 0),
    });
    setEditingGoals(false);
  }
  function cancelEditing() {
    setEditingGoals(false);
  }

  function exportWeightCSV() {
    const rows = Object.entries(weightByDate || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, w]) => `${date},${w}`);
    const csv = ['date,weight_lbs', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boilerfuel-weight-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportWeightJSON() {
    const sorted = Object.fromEntries(
      Object.entries(weightByDate || {}).sort(([a], [b]) => a.localeCompare(b))
    );
    const blob = new Blob([JSON.stringify(sorted, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boilerfuel-weight-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleWeightImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        let entries = {};
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JSON format');
          entries = parsed;
        } else {
          // CSV: skip header row, parse date,weight_lbs
          const lines = text.trim().split('\n').filter(Boolean);
          for (const line of lines) {
            if (line.toLowerCase().startsWith('date')) continue;
            const [date, weight] = line.split(',');
            if (!date || !weight) continue;
            const d = date.trim();
            const w = parseFloat(weight.trim());
            if (/^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(w) && w > 0) {
              entries[d] = w;
            }
          }
        }
        const count = Object.keys(entries).length;
        if (count === 0) throw new Error('No valid entries found');
        for (const [date, weight] of Object.entries(entries)) {
          setWeight(weight, date);
        }
        setWeightImportStatus('success');
        setWeightImportMsg(`Imported ${count} weight entr${count === 1 ? 'y' : 'ies'}.`);
        setTimeout(() => { setWeightImportStatus(''); setWeightImportMsg(''); }, 4000);
      } catch (err) {
        setWeightImportStatus('error');
        setWeightImportMsg(err.message || 'Failed to parse file.');
        setTimeout(() => { setWeightImportStatus(''); setWeightImportMsg(''); }, 4000);
      }
    };
    reader.readAsText(file);
  }

  return (
    <>
      <Head>
        <title>Profile - BoilerFuel</title>
        <meta name="description" content="BoilerFuel preferences and nutrition tracking" />
      </Head>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono" {...swipeHandlers}>
        <div className="max-w-7xl mx-auto px-4 sm:px-10 py-10 sm:py-24 space-y-8 sm:space-y-12">

          {/* Header */}
          <header className="space-y-4">
            <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </Link>
            <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.2em]">Profile</h1>
            <div className="w-12 h-0.5 bg-yellow-500" />
            <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
              Nutrition &amp; Preferences
            </p>
          </header>

          <div className="lg:grid lg:grid-cols-[5fr_4fr_4fr] lg:gap-10 space-y-16 lg:space-y-0">
          {/* ── Left column: Nutrition ── */}
          <div>
          {/* ═══ NUTRITION ═══ */}
          <section className="space-y-6">
            {/* Date navigation */}
            <div className="flex items-center justify-between border-b border-yellow-500/20 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">
                {isToday ? "Today\u2019s" : formatDateKey(selectedDate)} Nutrition
              </h2>
              {dateMeals.length > 0 && (
                <span className="text-xs text-theme-text-tertiary">
                  <span className="text-yellow-500/80 font-bold">{dateMeals.length}</span> item{dateMeals.length !== 1 ? 's' : ''} logged
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedDate(d => shiftDate(d, -1))}
                className="px-3 py-2 border border-theme-text-primary/20 text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary transition-colors text-sm font-bold">
                &larr;
              </button>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-bold uppercase tracking-wider">{formatDateKey(selectedDate)}</span>
                {!isToday && (
                  <button
                    onClick={() => setSelectedDate(getTodayKey())}
                    className="text-[10px] uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
                    Go to today
                  </button>
                )}
                {/* Dot indicators for nearby dates with data */}
                <div className="flex gap-1 mt-1">
                  {[-3, -2, -1, 0, 1, 2, 3].map(offset => {
                    const d = shiftDate(selectedDate, offset);
                    const hasData = datesWithData.has(d);
                    const isCurrent = offset === 0;
                    return (
                      <button key={offset}
                        onClick={() => setSelectedDate(shiftDate(selectedDate, offset))}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          isCurrent ? 'bg-theme-text-primary' :
                          hasData ? 'bg-theme-text-primary/40 hover:bg-theme-text-primary/70' :
                          'bg-theme-text-primary/10 hover:bg-theme-text-primary/20'
                        }`}
                        title={d}
                      />
                    );
                  })}
                </div>
              </div>
              <button
                onClick={() => setSelectedDate(d => shiftDate(d, 1))}
                disabled={isToday}
                className={`px-3 py-2 border border-theme-text-primary/20 text-sm font-bold transition-colors ${
                  isToday ? 'text-theme-text-tertiary/30 cursor-not-allowed' : 'text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary'
                }`}>
                &rarr;
              </button>
            </div>

            {/* Streak badge */}
            {loggingStreak > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 border border-yellow-500/20 bg-yellow-500/5">
                <span className="text-lg leading-none" role="img" aria-label="fire">🔥</span>
                <div>
                  <span className="text-sm font-bold tabular-nums text-yellow-500">{loggingStreak}</span>
                  <span className="text-xs text-theme-text-tertiary"> day{loggingStreak !== 1 ? 's' : ''} in a row</span>
                </div>
                {loggingStreak >= 7 && <span className="ml-auto text-[10px] text-yellow-500/60 font-bold uppercase tracking-wider">Week streak!</span>}
                {loggingStreak >= 30 && <span className="ml-auto text-[10px] text-yellow-500/80 font-bold uppercase tracking-wider">Month streak!</span>}
              </div>
            )}

            {/* Progress bars */}
            <div className="space-y-4">
              <ProgressBar label="Calories" current={dateTotals.calories} goal={goals.calories} unit=" kcal" />
              <ProgressBar label="Protein" current={dateTotals.protein} goal={goals.protein} unit="g" />
              <ProgressBar label="Carbs" current={dateTotals.carbs} goal={goals.carbs} unit="g" />
              <ProgressBar label="Fat" current={dateTotals.fat} goal={goals.fat} unit="g" />
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-4 gap-px bg-theme-text-primary/10">
              {[
                { label: 'Cal', value: Math.round(dateTotals.calories) },
                { label: 'Pro', value: `${Math.round(dateTotals.protein)}g` },
                { label: 'Carb', value: `${Math.round(dateTotals.carbs)}g` },
                { label: 'Fat', value: `${Math.round(dateTotals.fat)}g` },
              ].map(s => (
                <div key={s.label} className="bg-theme-bg-primary px-3 py-3 text-center">
                  <div className="text-lg font-bold tabular-nums">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Extended nutrition breakdown with progress bars */}
            <div className="space-y-4">
              <ProgressBar label="Saturated Fat" current={dateTotals.saturated_fat} goal={goals.saturated_fat ?? 20} unit="g" />
              <ProgressBar label="Fiber" current={dateTotals.fiber} goal={goals.fiber ?? 28} unit="g" />
              <ProgressBar label="Sugar" current={dateTotals.sugar} goal={goals.sugar ?? 50} unit="g" />
              <ProgressBar label="Added Sugar" current={dateTotals.added_sugar} goal={goals.added_sugar ?? 25} unit="g" />
              <ProgressBar label="Sodium" current={dateTotals.sodium} goal={goals.sodium ?? 2300} unit="mg" />
              <ProgressBar label="Cholesterol" current={dateTotals.cholesterol} goal={goals.cholesterol ?? 300} unit="mg" />
            </div>

            {/* Logged meals grouped by meal time */}
            {dateMeals.length > 0 && (
              <div className="border border-theme-text-primary/10">
                <div className="flex items-center justify-between px-4 py-2 bg-theme-bg-secondary/50 border-b border-theme-text-primary/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text-tertiary">Logged Foods</span>
                  {isToday && (
                    <button
                      onClick={clearMeals}
                      className="text-[10px] uppercase tracking-widest text-theme-text-tertiary hover:text-red-500 transition-colors">
                      Clear All
                    </button>
                  )}
                </div>
                {mealGroups.length > 1 && (
                  <div className="flex gap-1 px-4 py-2 border-b border-theme-text-primary/10 flex-wrap">
                    {mealGroups.map(g => (
                      <button key={g.label}
                        onClick={() => setLogFilter(f => f === g.label ? null : g.label)}
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                          logFilter === g.label
                            ? 'border-theme-text-primary bg-theme-text-primary text-theme-bg-primary'
                            : 'border-theme-text-primary/20 text-theme-text-tertiary hover:border-theme-text-primary/50 hover:text-theme-text-primary'
                        }`}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="max-h-72 overflow-y-auto">
                  {mealGroups.filter(g => !logFilter || g.label === logFilter).map(group => {
                    const groupCals = group.meals.reduce((s, m) => s + (m.calories || 0), 0);
                    // Group meals by food id
                    const grouped = [];
                    const seen = {};
                    for (const m of group.meals) {
                      const key = m.id || m.name;
                      if (seen[key]) { seen[key].count++; seen[key].totalCal += (m.calories || 0); }
                      else { const entry = { ...m, count: 1, totalCal: m.calories || 0 }; seen[key] = entry; grouped.push(entry); }
                    }
                    return (
                      <div key={group.label}>
                        <div className="flex items-center justify-between px-4 py-1.5 bg-theme-bg-tertiary/50 border-b border-theme-text-primary/5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text-secondary">{group.label}</span>
                          <span className="text-[10px] font-mono tabular-nums text-theme-text-tertiary">{Math.round(groupCals)} cal</span>
                        </div>
                        {grouped.map((m, i) => (
                          <div key={`${m.id}-${i}`} className="flex items-center justify-between px-4 py-2 text-sm border-b border-theme-text-primary/5 last:border-b-0">
                            <div className="flex-1 min-w-0 mr-3">
                              <div className="flex items-center gap-2">
                                <span className="truncate">{m.name}</span>
                                {m.count > 1 && (
                                  <span className="shrink-0 text-[10px] font-bold bg-theme-text-primary text-theme-bg-primary px-1.5 py-0.5 tabular-nums">{m.count}</span>
                                )}
                              </div>
                              {(m.dining_court || m.meal_time) && (
                                <span className="text-[10px] text-theme-text-tertiary capitalize">
                                  {m.dining_court}{m.dining_court && m.meal_time ? ' · ' : ''}{m.meal_time}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-mono tabular-nums text-theme-text-secondary">{Math.round(m.totalCal)} cal</span>
                              <button onClick={() => removeMeal(m, selectedDate)}
                                className="w-5 h-5 flex items-center justify-center border border-theme-text-primary/20 text-theme-text-tertiary hover:border-red-500/50 hover:text-red-500 transition-colors"
                                title="Remove one serving">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dateMeals.length === 0 && (
              <div className="border border-dashed border-theme-text-primary/20 py-8 text-center">
                <p className="text-sm text-theme-text-tertiary">
                  {isToday ? 'No foods logged today.' : `No foods logged on ${formatDateKey(selectedDate)}.`}
                </p>
                {isToday && (
                  <p className="text-xs text-theme-text-tertiary/60 mt-1">Click a food on the menu and press Add to start tracking.</p>
                )}
              </div>
            )}
          </section>
          </div>{/* end left column */}

          {/* ── Col 2: Core Settings ── */}
          <div className="space-y-10">
          {/* ═══ SETTINGS ═══ */}
          <section className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-yellow-500/20 pb-2">
              Settings
            </h2>

            {/* Daily Goals */}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-2">Daily Goals</div>
              {editingGoals ? (
                <div className="border border-theme-text-primary/20 p-4 sm:p-5 space-y-4">
                  <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Primary</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'calories', label: 'Calories', unit: 'kcal' },
                      { key: 'protein', label: 'Protein', unit: 'g' },
                      { key: 'carbs', label: 'Carbs', unit: 'g' },
                      { key: 'fat', label: 'Fat', unit: 'g' },
                    ].map(f => (
                      <div key={f.key} className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-theme-text-tertiary block">{f.label} ({f.unit})</label>
                        <input
                          type="number"
                          min="0"
                          value={draft[f.key]}
                          onChange={e => setDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary px-3 py-2 font-mono text-sm focus:border-theme-text-primary focus:outline-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mt-2">Additional</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'saturated_fat', label: 'Saturated Fat', unit: 'g' },
                      { key: 'fiber', label: 'Fiber', unit: 'g' },
                      { key: 'sugar', label: 'Sugar', unit: 'g' },
                      { key: 'added_sugar', label: 'Added Sugar', unit: 'g' },
                      { key: 'sodium', label: 'Sodium', unit: 'mg' },
                      { key: 'cholesterol', label: 'Cholesterol', unit: 'mg' },
                    ].map(f => (
                      <div key={f.key} className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-theme-text-tertiary block">{f.label} ({f.unit})</label>
                        <input
                          type="number"
                          min="0"
                          value={draft[f.key] ?? ''}
                          onChange={e => setDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary px-3 py-2 font-mono text-sm focus:border-theme-text-primary focus:outline-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  {goalWarnings.length > 0 && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/50 space-y-1">
                      {goalWarnings.map((w, i) => (
                        <p key={i} className="text-xs text-yellow-400">⚠️ {w}</p>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => saveGoals(true)}
                          className="px-3 py-1.5 bg-yellow-500 text-slate-900 text-xs font-bold rounded hover:bg-yellow-600 transition-colors">
                          Save Anyway
                        </button>
                        <button onClick={() => setGoalWarnings([])}
                          className="px-3 py-1.5 text-xs text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
                          Go Back
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => saveGoals(false)}
                      className="px-4 py-2 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors">
                      Save
                    </button>
                    <button onClick={cancelEditing}
                      className="px-4 py-2 border border-theme-text-primary/30 text-theme-text-tertiary text-xs uppercase tracking-wider hover:text-theme-text-primary transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={startEditing}
                  className="w-full flex items-center justify-between px-5 py-4 border border-theme-text-primary/20 hover:bg-theme-bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <div className="text-left">
                      <span className="text-sm font-bold uppercase tracking-wider block">Edit Goals</span>
                      <span className="text-xs text-theme-text-tertiary">
                        {goals.calories} kcal &middot; {goals.protein}g P &middot; {goals.carbs}g C &middot; {goals.fat}g F
                      </span>
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-theme-text-tertiary shrink-0">
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Theme Toggle */}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-2">Appearance</div>
              <div className="border border-theme-text-primary/20">
                <button
                  onClick={() => setTheme('light')}
                  className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
                    theme === 'light' ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    <div className="text-left">
                      <span className="text-sm font-bold uppercase tracking-wider block">Light</span>
                      <span className={`text-xs ${theme === 'light' ? 'opacity-60' : 'text-theme-text-tertiary'}`}>Bright background, dark text</span>
                    </div>
                  </div>
                  {theme === 'light' && (
                    <span className="text-[10px] uppercase tracking-widest font-bold">Active</span>
                  )}
                </button>

                <div className="h-px bg-theme-text-primary/10" />

                <button
                  onClick={() => setTheme('dark')}
                  className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
                    theme === 'dark' ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    <div className="text-left">
                      <span className="text-sm font-bold uppercase tracking-wider block">Dark</span>
                      <span className={`text-xs ${theme === 'dark' ? 'opacity-60' : 'text-theme-text-tertiary'}`}>Dark background, light text</span>
                    </div>
                  </div>
                  {theme === 'dark' && (
                    <span className="text-[10px] uppercase tracking-widest font-bold">Active</span>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* ═══ WEIGHT TRACKING ═══ */}
          <section className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-yellow-500/20 pb-2">
              Weight Tracking
            </h2>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-theme-text-tertiary block">Today&rsquo;s Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weightInput || (getWeight(selectedDate) ?? '')}
                  onChange={e => setWeightInput(e.target.value)}
                  placeholder="Enter weight"
                  className="w-full border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary px-3 py-2 font-mono text-sm focus:border-theme-text-primary focus:outline-none transition-colors"
                />
              </div>
              <button
                onClick={() => { if (weightInput) { setWeight(weightInput, selectedDate); setWeightInput(''); } }}
                className="px-4 py-2 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors">
                Save
              </button>
            </div>
            <Link href="/stats" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors inline-flex items-center gap-1">
              View weight trend &rarr;
            </Link>

            {/* Import / Export */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Import &amp; Export</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportWeightCSV}
                  disabled={!Object.keys(weightByDate || {}).length}
                  className="px-3 py-1.5 border border-theme-text-primary/30 text-theme-text-secondary text-[10px] font-bold uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  Export CSV
                </button>
                <button
                  onClick={exportWeightJSON}
                  disabled={!Object.keys(weightByDate || {}).length}
                  className="px-3 py-1.5 border border-theme-text-primary/30 text-theme-text-secondary text-[10px] font-bold uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  Export JSON
                </button>
                <button
                  onClick={() => weightFileRef.current?.click()}
                  className="px-3 py-1.5 border border-theme-text-primary/20 text-theme-text-tertiary text-[10px] font-bold uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors">
                  Import
                </button>
                <input
                  ref={weightFileRef}
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  onChange={handleWeightImport}
                />
              </div>
              {weightImportMsg && (
                <p className={`text-xs ${weightImportStatus === 'error' ? 'text-red-400' : 'text-green-500'}`}>
                  {weightImportMsg}
                </p>
              )}
              <p className="text-[10px] text-theme-text-tertiary">
                CSV format: <span className="font-mono">date,weight_lbs</span> &mdash; one row per day. Import merges with existing data.
              </p>
            </div>
          </section>

          {/* ═══ DIETARY PREFERENCES ═══ */}
          <section className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-yellow-500/20 pb-2">
              Dietary Preferences
            </h2>
            <p className="text-xs text-theme-text-tertiary">These filters apply globally across the menu. Foods that don&rsquo;t match will be hidden.</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={dietaryPrefs.vegetarian}
                  onChange={e => setDietaryPrefs({ vegetarian: e.target.checked })}
                  className="accent-green-500 w-4 h-4" />
                <span className="text-sm"><span className="text-green-500 font-bold">VG</span> Vegetarian only</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={dietaryPrefs.vegan}
                  onChange={e => setDietaryPrefs({ vegan: e.target.checked })}
                  className="accent-emerald-400 w-4 h-4" />
                <span className="text-sm"><span className="text-emerald-400 font-bold">V</span> Vegan only</span>
              </label>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-theme-text-tertiary block">Exclude allergens (comma-separated)</label>
                <input
                  type="text"
                  value={(dietaryPrefs.excludeAllergens || []).join(', ')}
                  onChange={e => setDietaryPrefs({ excludeAllergens: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="e.g. Gluten, Eggs, Tree Nuts"
                  className="w-full border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary px-3 py-2 text-sm focus:border-theme-text-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
          </section>

          {/* ═══ REMINDERS ═══ */}
          {'Notification' in (typeof window !== 'undefined' ? window : {}) && (
            <section className="space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-yellow-500/20 pb-2">
                Reminders
              </h2>

              {notifPermission === 'denied' && (
                <div className="border border-red-500/30 px-4 py-3 text-xs text-red-400">
                  Notifications are blocked for this site. Enable them in your browser settings to use reminders.
                </div>
              )}

              {notifPermission === 'default' && (
                <div className="space-y-3">
                  <p className="text-xs text-theme-text-tertiary">
                    Allow notifications so BoilerFuel can remind you to log meals and warn you when your streak is at risk.
                  </p>
                  <button
                    onClick={requestNotificationPermission}
                    className="px-4 py-2 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors"
                  >
                    Enable Notifications
                  </button>
                </div>
              )}

              {notifPermission === 'granted' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 px-4 py-3 border border-green-500/20 bg-green-500/5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500 shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-xs font-bold text-green-500">Notifications enabled</p>
                      <p className="text-[10px] text-theme-text-tertiary mt-0.5">
                        Streak reminders fire automatically at 8&nbsp;pm if you haven&rsquo;t logged today.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mealReminder}
                      onChange={e => toggleMealReminder(e.target.checked)}
                      className="accent-yellow-500 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-bold">Meal reminders</span>
                      <p className="text-[10px] text-theme-text-tertiary mt-0.5">
                        Remind me to log lunch (noon) and dinner (6&nbsp;pm) if I haven&rsquo;t already.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </section>
          )}
          </div>{/* end col 2 */}

          {/* ── Col 3: Data & Sync ── */}
          <div className="space-y-10">
          {/* ═══ MEAL TEMPLATES (BETA) ═══ */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b border-theme-text-primary/10 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">
                Meal Templates
              </h2>
              <span className="text-[9px] font-bold border border-blue-500/50 text-blue-500 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Beta</span>
            </div>
            {meals.length > 0 && (
              <div>
                <button
                  onClick={() => {
                    const name = prompt('Template name:');
                    if (name) saveTemplate(name, meals);
                  }}
                  className="px-4 py-2 border border-theme-text-primary/30 text-theme-text-tertiary text-xs uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors">
                  Save today&rsquo;s meals as template
                </button>
              </div>
            )}
            {templates.length > 0 ? (
              <div className="border border-theme-text-primary/10 divide-y divide-theme-text-primary/5">
                {templates.map(t => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm font-bold">{t.name}</div>
                      <div className="text-[10px] text-theme-text-tertiary">{t.foods.length} items &middot; {Math.round(t.foods.reduce((s, f) => s + (f.calories || 0), 0))} cal</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => applyTemplate(t)}
                        className="px-3 py-1.5 border border-theme-text-primary/30 text-xs uppercase tracking-wider text-theme-text-secondary hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors">
                        Apply
                      </button>
                      <button onClick={() => deleteTemplate(t.id)}
                        className="px-3 py-1.5 border border-red-500/30 text-xs uppercase tracking-wider text-red-500/60 hover:bg-red-500 hover:text-white transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-theme-text-tertiary">No templates saved yet. Log some meals and save them as a template for quick re-use.</p>
            )}
          </section>

          {/* ═══ EXPORT DATA ═══ */}
          <section className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-yellow-500/20 pb-2">
              Export Data
            </h2>
            <p className="text-xs text-theme-text-tertiary">Download your meal history. All data is stored locally in your browser.</p>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <button
                onClick={() => {
                  const csv = exportData('csv');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `boilerfuel-export-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors">
                Export CSV
              </button>
              <button
                onClick={() => {
                  const json = exportData('json');
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `boilerfuel-export-${new Date().toISOString().slice(0, 10)}.json`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 border border-theme-text-primary/30 text-theme-text-tertiary text-xs uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors">
                Export JSON
              </button>
              <button
                onClick={() => {
                  const csv = exportData('cronometer');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `boilerfuel-cronometer-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                  URL.revokeObjectURL(url);
                }}
                title="Import this CSV into Cronometer, then use Cronometer's Google Fit sync"
                className="px-4 py-2 border border-theme-text-primary/30 text-theme-text-tertiary text-xs uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors">
                Export for Cronometer
              </button>
              <button
                onClick={() => {
                  const json = exportData('gdata');
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `boilerfuel-gdata-${new Date().toISOString().slice(0, 10)}.json`; a.click();
                  URL.revokeObjectURL(url);
                }}
                title="Google Fit API format — com.google.nutrition data points"
                className="px-4 py-2 border border-theme-text-primary/30 text-theme-text-tertiary text-xs uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors">
                Export GData
              </button>
              <button
                onClick={() => {
                  const result = downloadAppleHealthExport(mealsByDate);
                  if (result.success) {
                    alert(`Exported ${result.recordCount} records to ${result.filename}`);
                  } else {
                    alert('Apple Health export failed: ' + (result.error || 'Unknown error'));
                  }
                }}
                title="Apple Health XML export — import on iPhone via Health app"
                className="px-4 py-2 border border-theme-text-primary/30 text-theme-text-tertiary text-xs uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors">
                Apple Health XML
              </button>
              <button
                onClick={() => generatePDFReport(mealsByDate, goals, weightByDate)}
                title="Generate a printable PDF summary of your nutrition data"
                className="px-4 py-2 border border-theme-text-primary/30 text-theme-text-tertiary text-xs uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors">
                Export PDF
              </button>
            </div>
            <p className="text-[10px] text-theme-text-tertiary">
              <strong className="text-theme-text-secondary">GData</strong> exports the exact <code>com.google.nutrition</code> payload used by the Google Fit REST API — useful for inspection or external tools. <strong className="text-theme-text-secondary">Cronometer CSV</strong> can be imported into <a href="https://cronometer.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-theme-text-primary">Cronometer</a> (free), which syncs with Google Fit. <strong className="text-theme-text-secondary">Apple Health XML</strong> generates an import file for the iOS Health app. <strong className="text-theme-text-secondary">PDF</strong> creates a printable nutrition summary.
            </p>

            {/* Import Data */}
            <div className="mt-4 pt-4 border-t border-theme-text-primary/10">
              <p className="text-xs text-theme-text-tertiary mb-2">Restore from a previous JSON export.</p>
              <input
                ref={importFileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const result = importData(ev.target.result);
                    if (result.success) {
                      setImportMsg(`Imported ${result.imported} new meal${result.imported !== 1 ? 's' : ''}. Goals, water, and weight data merged.`);
                    } else {
                      setImportMsg('Import failed: ' + (result.error || 'Unknown error'));
                    }
                    setTimeout(() => setImportMsg(''), 5000);
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => importFileRef.current?.click()}
                className="px-4 py-2 border border-dashed border-theme-text-primary/30 text-theme-text-tertiary text-xs uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors">
                Import JSON Backup
              </button>
              {importMsg && (
                <p className={`mt-2 text-xs ${importMsg.startsWith('Import failed') ? 'text-red-400' : 'text-green-400'}`}>{importMsg}</p>
              )}
            </div>
          </section>

          {/* ═══ LOGGING STREAK ═══ */}
          {(() => {
            const streak = getStreak();
            return (
              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-yellow-500/20 pb-2">
                  Logging Streak
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 border border-theme-text-primary/10">
                    <div className="text-2xl font-bold text-theme-text-primary font-mono">{streak.currentStreak}</div>
                    <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mt-1">Current Streak</div>
                  </div>
                  <div className="text-center p-3 border border-theme-text-primary/10">
                    <div className="text-2xl font-bold text-theme-text-primary font-mono">{streak.longestStreak}</div>
                    <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mt-1">Best Streak</div>
                  </div>
                  <div className="text-center p-3 border border-theme-text-primary/10">
                    <div className="text-2xl font-bold text-theme-text-primary font-mono">{streak.totalDays}</div>
                    <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mt-1">Total Days</div>
                  </div>
                </div>
                {streak.currentStreak >= 7 && (
                  <p className="text-xs text-yellow-500 font-bold text-center">
                    {streak.currentStreak >= 30 ? 'Incredible! 30+ day streak!' : streak.currentStreak >= 14 ? 'Amazing! Two weeks strong!' : 'Great job! One week streak!'}
                  </p>
                )}
              </section>
            );
          })()}

          {/* ═══ GOOGLE FIT EXPORT ═══ */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-yellow-500/20 pb-2">
              Google Fit Export
            </h2>

            {googleSession?.accessToken ? (
              <div className="space-y-4">
                <p className="text-xs text-theme-text-tertiary">
                  Export your logged meals to Google Fit as nutrition data. Signed in as <span className="font-mono text-theme-text-primary">{googleSession.user?.email}</span>.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text-tertiary block">Start Date</label>
                    <input
                      type="date"
                      value={fitStartDate}
                      onChange={e => setFitStartDate(e.target.value)}
                      className="w-full border border-theme-text-primary/20 bg-theme-bg-secondary text-theme-text-primary px-3 py-2 font-mono text-sm focus:border-theme-text-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text-tertiary block">End Date</label>
                    <input
                      type="date"
                      value={fitEndDate}
                      onChange={e => setFitEndDate(e.target.value)}
                      className="w-full border border-theme-text-primary/20 bg-theme-bg-secondary text-theme-text-primary px-3 py-2 font-mono text-sm focus:border-theme-text-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {fitError && (
                  <div className="text-xs text-red-400 border border-red-500/20 px-3 py-2">{fitError}</div>
                )}
                {fitMsg && (
                  <div className="text-xs text-green-400 border border-green-500/20 px-3 py-2">{fitMsg}</div>
                )}

                <button
                  disabled={fitExporting}
                  onClick={async () => {
                    setFitExporting(true);
                    setFitError('');
                    setFitMsg('');
                    try {
                      const res = await fetch('/api/google-fit-export', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mealsByDate, startDate: fitStartDate, endDate: fitEndDate }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Export failed');
                      setFitMsg(`✓ Exported ${data.exported} meal${data.exported !== 1 ? 's' : ''} to Google Fit`);
                    } catch (err) {
                      setFitError(err.message || 'Export failed');
                    } finally {
                      setFitExporting(false);
                    }
                  }}
                  className="px-4 py-2 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors disabled:opacity-40 disabled:cursor-wait"
                >
                  {fitExporting ? 'Exporting…' : 'Export to Google Fit'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-theme-text-tertiary">
                  Sign in with Google to export your meal history to Google Fit as nutrition data.
                </p>
                <button
                  onClick={() => signIn('google')}
                  className="flex items-center gap-2 px-4 py-2 border border-theme-text-primary/30 text-theme-text-secondary text-xs font-bold uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Connect Google Fit
                </button>
              </div>
            )}
          </section>

          {/* ═══ DEVICE SYNC ═══ */}
          <section className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-yellow-500/20 pb-2">
              Device Sync
            </h2>
            <p className="text-xs text-theme-text-tertiary">
              Sync your data between devices. Your data is encrypted before leaving your browser — the server only stores an encrypted blob.
            </p>

            {syncError && (
              <div className="text-xs text-red-500 border border-red-500/20 px-3 py-2">{syncError}</div>
            )}
            {syncMsg && (
              <div className="text-xs text-green-600 border border-green-600/20 px-3 py-2">{syncMsg}</div>
            )}

            {/* Already paired */}
            {syncStatus === 'paired' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs font-bold text-theme-text-primary">Paired</span>
                  <span className="text-xs text-theme-text-tertiary font-mono">{syncCode}</span>
                </div>
                <p className="text-[10px] text-theme-text-tertiary">
                  Your data syncs automatically when you open the app or log meals. Changes are pushed after a 3-second delay.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setSyncMsg('');
                      setSyncError('');
                      try {
                        await syncNow();
                        setSyncMsg('Synced successfully!');
                        setTimeout(() => setSyncMsg(''), 3000);
                      } catch {
                        setSyncError('Sync failed. Check your connection.');
                      }
                    }}
                    className="px-4 py-2 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors">
                    Sync Now
                  </button>
                  <button
                    onClick={async () => {
                      const { unpair } = await import('../utils/sync');
                      await unpair();
                      setSyncStatus('idle');
                      setSyncCode('');
                      setSyncSecret('');
                      setSyncMsg('Unpaired successfully.');
                      setTimeout(() => setSyncMsg(''), 3000);
                    }}
                    className="px-4 py-2 border border-red-500/30 text-red-500 text-xs uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors">
                    Unpair
                  </button>
                </div>
              </div>
            )}

            {/* Not paired — show options */}
            {syncStatus === 'idle' && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setSyncStatus('creating');
                      setSyncError('');
                      try {
                        const { createSyncPair } = await import('../utils/sync');
                        const { token, secret } = await createSyncPair();
                        setSyncCode(token);
                        setSyncSecret(secret);
                        setSyncStatus('paired');
                      } catch (err) {
                        setSyncError(err.message || 'Failed to create sync pair');
                        setSyncStatus('idle');
                      }
                    }}
                    className="px-4 py-2 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors">
                    Create Sync Code
                  </button>
                  <button
                    onClick={() => { setSyncStatus('joining'); setSyncError(''); }}
                    className="px-4 py-2 border border-theme-text-primary/30 text-theme-text-tertiary text-xs uppercase tracking-wider hover:text-theme-text-primary hover:border-theme-text-primary transition-colors">
                    Join Existing
                  </button>
                </div>
                <p className="text-[10px] text-theme-text-tertiary">
                  <strong>Create:</strong> generates a code + QR on this device. Open the other device and choose &ldquo;Join Existing&rdquo; there.<br />
                  <strong>Join:</strong> enter the code from your other device to pair.
                </p>
              </div>
            )}

            {/* Creating state */}
            {syncStatus === 'creating' && (
              <div className="text-xs text-theme-text-tertiary animate-pulse">Creating sync pair...</div>
            )}

            {/* Join flow */}
            {syncStatus === 'joining' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-theme-text-tertiary">Sync Code</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BF7X3K"
                    maxLength={6}
                    className="w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-2 text-sm font-mono tracking-[0.3em] text-center focus:border-theme-text-primary focus:outline-none transition-colors uppercase"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-theme-text-tertiary">Secret Key</label>
                  <input
                    type="text"
                    value={joinSecret}
                    onChange={e => setJoinSecret(e.target.value)}
                    placeholder="Paste the secret from your other device"
                    className="w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-2 text-xs font-mono focus:border-theme-text-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!joinCode || !joinSecret) {
                        setSyncError('Enter both the sync code and secret key.');
                        return;
                      }
                      setSyncError('');
                      try {
                        const { joinSyncPair } = await import('../utils/sync');
                        await joinSyncPair(joinCode.trim(), joinSecret.trim());
                        setSyncCode(joinCode.trim());
                        setSyncSecret(joinSecret.trim());
                        setSyncStatus('paired');
                        reloadFromStorage();
                        setSyncMsg('Paired and synced!');
                        setTimeout(() => setSyncMsg(''), 3000);
                      } catch (err) {
                        setSyncError(err.message || 'Failed to join. Check your code and secret.');
                      }
                    }}
                    className="px-4 py-2 border border-theme-text-primary text-theme-text-primary text-xs font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors">
                    Join
                  </button>
                  <button
                    onClick={() => { setSyncStatus('idle'); setSyncError(''); setJoinCode(''); setJoinSecret(''); }}
                    className="px-4 py-2 border border-theme-text-primary/20 text-theme-text-tertiary text-xs uppercase tracking-wider hover:text-theme-text-primary transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Show code + QR when just paired (from Create) */}
            {syncStatus === 'paired' && syncSecret && (
              <div className="space-y-4 border border-theme-text-primary/10 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-theme-text-tertiary">
                  Share with your other device
                </div>
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="border border-theme-text-primary/10 p-2 bg-white">
                    <QRCode text={`BF:${syncCode}:${syncSecret}`} size={160} />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div>
                      <div className="text-[9px] text-theme-text-tertiary uppercase tracking-widest mb-1">Sync Code</div>
                      <div className="text-2xl font-mono font-bold tracking-[0.3em] text-theme-text-primary select-all">{syncCode}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-theme-text-tertiary uppercase tracking-widest mb-1">Secret Key</div>
                      <div className="text-xs font-mono text-theme-text-secondary break-all select-all bg-theme-bg-secondary px-2 py-1">{syncSecret}</div>
                    </div>
                    <p className="text-[10px] text-theme-text-tertiary">
                      On your other device, go to Profile &rarr; Device Sync &rarr; Join Existing, and enter both values above.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
          </div>{/* end col 3 */}
          </div>{/* end three-column grid */}

          {/* Footer */}
          <footer className="border-t border-theme-text-primary/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6 text-xs uppercase tracking-widest">
              <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
              <Link href="/stats" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Stats</Link>
              <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
              <Link href="/changelog" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Changelog</Link>
              <Link href="/privacy" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Privacy</Link>
              <Link href="/admin" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Admin</Link>
            </div>
            <span className="text-xs text-theme-text-tertiary/40">{new Date().getFullYear()}</span>
          </footer>

        </div>
      </div>
    </>
  );
}

ProfilePage.getLayout = (page) => page;
