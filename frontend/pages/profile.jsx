import { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { useMeals } from '../context/MealContext';

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
  const { meals, goals, setGoals, totals, clearMeals, mealsByDate } = useMeals();
  const [editingGoals, setEditingGoals] = useState(false);
  const [draft, setDraft] = useState(goals);
  const [selectedDate, setSelectedDate] = useState(getTodayKey);

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

  // Group meals by meal_time
  const mealGroups = useMemo(() => {
    const order = ['breakfast', 'lunch', 'dinner'];
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
  function saveGoals() {
    setGoals({
      calories: Math.max(0, parseInt(draft.calories) || 0),
      protein: Math.max(0, parseInt(draft.protein) || 0),
      carbs: Math.max(0, parseInt(draft.carbs) || 0),
      fat: Math.max(0, parseInt(draft.fat) || 0),
    });
    setEditingGoals(false);
  }
  function cancelEditing() {
    setEditingGoals(false);
  }

  return (
    <>
      <Head>
        <title>Profile - BoilerFuel</title>
        <meta name="description" content="BoilerFuel preferences and nutrition tracking" />
      </Head>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-16 sm:py-24 space-y-16">

          {/* Header */}
          <header className="space-y-4">
            <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </Link>
            <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.2em]">Profile</h1>
            <div className="w-12 h-px bg-theme-text-primary/30" />
            <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
              Nutrition &amp; Preferences
            </p>
          </header>

          {/* ═══ NUTRITION ═══ */}
          <section className="space-y-6">
            {/* Date navigation */}
            <div className="flex items-center justify-between border-b border-theme-text-primary/10 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">
                {isToday ? "Today\u2019s" : formatDateKey(selectedDate)} Nutrition
              </h2>
              {dateMeals.length > 0 && (
                <span className="text-xs text-theme-text-tertiary">
                  {dateMeals.length} item{dateMeals.length !== 1 ? 's' : ''} logged
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

            {/* Extended nutrition breakdown */}
            <div className="border border-theme-text-primary/10">
              <div className="px-4 py-2 bg-theme-bg-secondary/50 border-b border-theme-text-primary/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text-tertiary">Detailed Breakdown</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-theme-text-primary/10">
                {[
                  { label: 'Saturated Fat', value: dateTotals.saturated_fat, unit: 'g' },
                  { label: 'Cholesterol', value: dateTotals.cholesterol, unit: 'mg' },
                  { label: 'Sodium', value: dateTotals.sodium, unit: 'mg' },
                  { label: 'Fiber', value: dateTotals.fiber, unit: 'g' },
                  { label: 'Sugar', value: dateTotals.sugar, unit: 'g' },
                  { label: 'Added Sugar', value: dateTotals.added_sugar, unit: 'g' },
                ].map(s => (
                  <div key={s.label} className="bg-theme-bg-primary px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">{s.label}</div>
                    <div className="text-base font-bold tabular-nums mt-1">
                      {Math.round(s.value)}<span className="text-xs text-theme-text-tertiary ml-0.5">{s.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
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
                <div className="max-h-72 overflow-y-auto">
                  {mealGroups.map(group => {
                    const groupCals = group.meals.reduce((s, m) => s + (m.calories || 0), 0);
                    return (
                      <div key={group.label}>
                        <div className="flex items-center justify-between px-4 py-1.5 bg-theme-bg-tertiary/50 border-b border-theme-text-primary/5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text-secondary">{group.label}</span>
                          <span className="text-[10px] font-mono tabular-nums text-theme-text-tertiary">{Math.round(groupCals)} cal</span>
                        </div>
                        {group.meals.map((m, i) => (
                          <div key={`${m.id}-${m.addedAt}-${i}`} className="flex items-center justify-between px-4 py-2 text-sm border-b border-theme-text-primary/5 last:border-b-0">
                            <div className="flex-1 min-w-0 mr-4">
                              <span className="truncate block">{m.name}</span>
                              {(m.dining_court || m.meal_time) && (
                                <span className="text-[10px] text-theme-text-tertiary capitalize">
                                  {m.dining_court}{m.dining_court && m.meal_time ? ' · ' : ''}{m.meal_time}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono tabular-nums text-theme-text-secondary shrink-0">{m.calories} cal</span>
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

          {/* ═══ GOALS ═══ */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-theme-text-primary/10 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">
                Daily Goals
              </h2>
              {!editingGoals && (
                <button onClick={startEditing}
                  className="text-[10px] uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
                  Edit
                </button>
              )}
            </div>

            {editingGoals ? (
              <div className="space-y-4">
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
                <div className="flex gap-2">
                  <button onClick={saveGoals}
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10">
                {[
                  { label: 'Calories', value: `${goals.calories}`, unit: 'kcal' },
                  { label: 'Protein', value: `${goals.protein}`, unit: 'g' },
                  { label: 'Carbs', value: `${goals.carbs}`, unit: 'g' },
                  { label: 'Fat', value: `${goals.fat}`, unit: 'g' },
                ].map(g => (
                  <div key={g.label} className="bg-theme-bg-primary px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">{g.label}</div>
                    <div className="text-base font-bold tabular-nums mt-1">{g.value}<span className="text-xs text-theme-text-tertiary ml-0.5">{g.unit}</span></div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ═══ SETTINGS ═══ */}
          <section className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              Settings
            </h2>

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

          {/* Footer */}
          <footer className="border-t border-theme-text-primary/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6 text-xs uppercase tracking-widest">
              <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
              <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
              <Link href="/changelog" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Changelog</Link>
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
