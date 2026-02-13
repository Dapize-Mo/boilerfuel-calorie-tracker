import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';

// ── Custom black & white calendar picker ──
function CalendarPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(current.getFullYear());
  const [viewMonth, setViewMonth] = useState(current.getMonth());

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const selectedDay = current.getFullYear() === viewYear && current.getMonth() === viewMonth ? current.getDate() : null;
  const todayStr = new Date().toISOString().slice(0, 10);

  function pick(day) {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Format display
  const displayDate = value
    ? `${monthNames[current.getMonth()]} ${current.getDate()}, ${current.getFullYear()}`
    : 'Select date';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full p-2 border border-theme-text-primary bg-theme-bg-secondary text-theme-text-primary text-left font-mono flex items-center justify-between hover:bg-theme-bg-hover transition-colors"
      >
        <span>{displayDate}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 w-72 border border-theme-text-primary bg-theme-bg-primary shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-theme-text-primary/20">
            <button type="button" onClick={prevMonth} className="px-2 py-1 hover:bg-theme-bg-hover text-theme-text-primary font-bold">&lt;</button>
            <span className="font-bold text-sm uppercase tracking-wider">{monthNames[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="px-2 py-1 hover:bg-theme-bg-hover text-theme-text-primary font-bold">&gt;</button>
          </div>
          {/* Day names */}
          <div className="grid grid-cols-7 text-center text-xs font-bold uppercase text-theme-text-secondary border-b border-theme-text-primary/10 py-2 px-2">
            {dayNames.map(d => <div key={d}>{d}</div>)}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7 text-center text-sm p-2 gap-y-1">
            {Array.from({ length: firstDay }, (_, i) => <div key={'e' + i} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = day === selectedDay;
              const isToday = dateStr === todayStr;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pick(day)}
                  className={`py-1.5 font-mono text-sm transition-colors
                    ${isSelected
                      ? 'bg-theme-text-primary text-theme-bg-primary font-bold'
                      : isToday
                        ? 'border border-theme-text-primary font-bold hover:bg-theme-bg-hover'
                        : 'hover:bg-theme-bg-hover text-theme-text-primary'
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {/* Today shortcut */}
          <div className="border-t border-theme-text-primary/10 p-2">
            <button
              type="button"
              onClick={() => { onChange(todayStr); setOpen(false); setViewMonth(new Date().getMonth()); setViewYear(new Date().getFullYear()); }}
              className="w-full text-center text-xs uppercase tracking-wider py-1 hover:bg-theme-bg-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [location, setLocation] = useState('All');
  const [mealTime, setMealTime] = useState('All');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [foods, setFoods] = useState([]);
  const [locations, setLocations] = useState(['All']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const mealTimes = ['All', 'Breakfast', 'Lunch', 'Dinner'];

  // Fetch dining court locations from Neon DB
  useEffect(() => {
    fetch('/api/dining-courts')
      .then(res => res.json())
      .then(courts => {
        if (Array.isArray(courts)) {
          setLocations(['All', ...courts]);
        }
      })
      .catch(err => console.error('Failed to load locations:', err));
  }, []);

  // Fetch foods from Neon DB
  const fetchFoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (location !== 'All') params.set('dining_court', location);
      if (mealTime !== 'All') params.set('meal_time', mealTime);

      const res = await fetch(`/api/foods?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setFoods(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch foods:', err);
      setError('Could not load foods. Check your database connection.');
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, [location, mealTime]);

  function handleSearch() {
    setShowResults(true);
    fetchFoods();
  }

  function handleBack() {
    setShowResults(false);
    setFoods([]);
  }

  // Re-fetch when filters change in results mode
  useEffect(() => {
    if (showResults) fetchFoods();
  }, [showResults, fetchFoods]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const dateLabel = `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
      <Head>
        <title>BoilerFuel - Dining Menu</title>
      </Head>

      {/* ═══ LANDING / HERO VIEW ═══ */}
      {!showResults && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 transition-all duration-500">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-[0.25em] mb-3">
              BoilerFuel
            </h1>
            <p className="text-theme-text-tertiary text-sm tracking-[0.15em] uppercase">
              Purdue Dining Court Menus
            </p>
          </div>

          {/* Three filter boxes */}
          <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div>
              <label className="block mb-1.5 font-bold uppercase text-xs tracking-wider text-theme-text-secondary text-center">
                Date
              </label>
              <CalendarPicker value={selectedDate} onChange={setSelectedDate} />
            </div>

            <div>
              <label className="block mb-1.5 font-bold uppercase text-xs tracking-wider text-theme-text-secondary text-center">
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary focus:border-theme-text-primary outline-none transition-colors"
              >
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 font-bold uppercase text-xs tracking-wider text-theme-text-secondary text-center">
                Meal Time
              </label>
              <select
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
                className="w-full p-2 border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary focus:border-theme-text-primary outline-none transition-colors"
              >
                {mealTimes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="px-10 py-3 border-2 border-theme-text-primary text-theme-text-primary font-bold uppercase tracking-[0.2em] text-sm hover:bg-theme-text-primary hover:text-theme-bg-primary transition-all duration-200"
          >
            View Menu
          </button>

          {/* Subtle admin link */}
          <Link href="/admin" className="mt-12 text-xs uppercase tracking-widest text-theme-text-tertiary/40 hover:text-theme-text-tertiary transition-colors">
            Admin
          </Link>
        </div>
      )}

      {/* ═══ RESULTS VIEW ═══ */}
      {showResults && (
        <div className="min-h-screen flex flex-col transition-all duration-500">
          {/* Compact header with filters */}
          <header className="border-b border-theme-text-primary/10 px-6 md:px-12 lg:px-20 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Back + Title */}
              <div className="flex items-center gap-4 mr-auto">
                <button
                  onClick={handleBack}
                  className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
                  title="Back to search"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold uppercase tracking-[0.15em]">BoilerFuel</h1>
              </div>

              {/* Inline filters */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <CalendarPicker value={selectedDate} onChange={setSelectedDate} />

                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="p-1.5 border border-theme-text-primary/20 bg-theme-bg-secondary text-theme-text-primary text-sm focus:border-theme-text-primary outline-none"
                >
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                <select
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  className="p-1.5 border border-theme-text-primary/20 bg-theme-bg-secondary text-theme-text-primary text-sm focus:border-theme-text-primary outline-none"
                >
                  {mealTimes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </header>

          {/* Results body */}
          <main className="flex-1 px-6 md:px-12 lg:px-20 py-8">
            {error && (
              <div className="mb-6 p-4 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Summary bar */}
            {!loading && (
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-text-primary/10">
                <span className="text-xs uppercase tracking-widest text-theme-text-tertiary">
                  {foods.length} item{foods.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-theme-text-tertiary">
                  {dateLabel} &middot; {location !== 'All' ? location : 'All locations'} &middot; {mealTime !== 'All' ? mealTime : 'All meals'}
                </span>
              </div>
            )}

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-theme-text-primary/20">
                  <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary">Food Item</th>
                  <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary hidden sm:table-cell">Location</th>
                  <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary hidden md:table-cell">Meal</th>
                  <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary text-right">Cal</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-theme-text-tertiary">
                      <span className="inline-block animate-pulse">Loading...</span>
                    </td>
                  </tr>
                ) : foods.length > 0 ? (
                  foods.map(food => (
                    <tr key={food.id} className="border-b border-theme-text-primary/5 hover:bg-theme-bg-secondary/50 transition-colors group">
                      <td className="py-3 pr-4">
                        <span className="group-hover:text-theme-text-primary transition-colors">{food.name}</span>
                        <span className="block sm:hidden text-xs text-theme-text-tertiary capitalize mt-0.5">{food.dining_court} &middot; {food.meal_time}</span>
                      </td>
                      <td className="py-3 px-4 text-theme-text-secondary capitalize hidden sm:table-cell">{food.dining_court}</td>
                      <td className="py-3 px-4 text-theme-text-tertiary capitalize hidden md:table-cell">{food.meal_time}</td>
                      <td className="py-3 pl-4 text-right font-mono tabular-nums text-theme-text-secondary">{food.calories}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-theme-text-tertiary italic">
                      No foods found for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </main>

          {/* Footer */}
          <footer className="border-t border-theme-text-primary/5 px-6 md:px-12 lg:px-20 py-6 mt-auto">
            <p className="text-xs text-theme-text-tertiary tracking-wide">
              BoilerFuel &middot; Purdue Dining Data &middot; {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      )}
    </div>
  );
}

// index has its own layout — skip the shared Layout wrapper
Home.getLayout = (page) => page;
