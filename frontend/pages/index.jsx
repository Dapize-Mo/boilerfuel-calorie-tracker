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
  const [view, setView] = useState('landing');

  const mealTimes = ['All', 'Breakfast', 'Lunch', 'Dinner'];
  const isLanding = view === 'landing';

  useEffect(() => {
    fetch('/api/dining-courts')
      .then(res => res.json())
      .then(courts => {
        if (Array.isArray(courts)) setLocations(['All', ...courts]);
      })
      .catch(err => console.error('Failed to load locations:', err));
  }, []);

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
      setError('Could not load foods.');
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, [location, mealTime]);

  function handleViewMenu() {
    fetchFoods();
    setView('results');
  }

  function handleBack() {
    setView('landing');
  }

  useEffect(() => {
    if (view === 'results') fetchFoods();
  }, [view, fetchFoods]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const dateLabel = `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

  // Shared animation curve
  const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';

  // Label style — collapses height + fades when leaving landing
  const labelStyle = {
    display: 'block', fontWeight: 'bold', textTransform: 'uppercase',
    fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'center',
    transition: `opacity 0.3s ease, max-height 0.4s ease, margin-bottom 0.4s ease`,
    opacity: isLanding ? 0.6 : 0,
    maxHeight: isLanding ? 20 : 0,
    marginBottom: isLanding ? 6 : 0,
    overflow: 'hidden',
  };

  // Select style — padding/font shrink for header mode
  const selectStyle = {
    width: '100%', fontFamily: 'inherit', outline: 'none',
    transition: `padding 0.5s ${ease}, font-size 0.5s ${ease}`,
    padding: isLanding ? 8 : 6,
    fontSize: isLanding ? '1rem' : '0.875rem',
  };

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono"
         style={{ position: 'relative', overflow: 'hidden' }}>
      <Head>
        <title>BoilerFuel - Dining Menu</title>
      </Head>

      {/* ── Back arrow ── */}
      <button
        onClick={handleBack}
        className="text-theme-text-tertiary hover:text-theme-text-primary"
        style={{
          position: 'fixed', top: 18, left: 24, zIndex: 30,
          transition: 'opacity 0.3s ease',
          opacity: isLanding ? 0 : 1,
          pointerEvents: isLanding ? 'none' : 'auto',
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
        }}
        title="Back"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      {/* ── Title — slides from center to top-left ── */}
      <h1
        className="font-bold uppercase"
        style={{
          position: 'fixed', zIndex: 20, whiteSpace: 'nowrap', lineHeight: 1.1,
          transition: `top 0.7s ${ease}, left 0.7s ${ease}, transform 0.7s ${ease}, font-size 0.7s ${ease}, letter-spacing 0.7s ${ease}`,
          top: isLanding ? '35vh' : 18,
          left: isLanding ? '50%' : 64,
          transform: isLanding ? 'translateX(-50%)' : 'translateX(0)',
          fontSize: isLanding ? 'clamp(2rem, 5vw, 3.5rem)' : '1.25rem',
          letterSpacing: isLanding ? '0.25em' : '0.15em',
        }}
      >
        BoilerFuel
      </h1>

      {/* ── Subtitle — fades out ── */}
      <p
        className="text-theme-text-tertiary"
        style={{
          position: 'fixed', zIndex: 20,
          top: 'calc(35vh + clamp(2.5rem, 5.5vw, 4rem))',
          left: '50%', transform: 'translateX(-50%)',
          transition: 'opacity 0.3s ease',
          opacity: isLanding ? 1 : 0,
          pointerEvents: 'none',
          fontSize: '0.875rem', letterSpacing: '0.15em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        Purdue Dining Court Menus
      </p>

      {/* ── Filters — slide from center to top-right ── */}
      <div style={{
        position: 'fixed', zIndex: 20,
        display: 'flex', alignItems: 'flex-end',
        transition: `top 0.7s ${ease}, right 0.7s ${ease}, transform 0.7s ${ease}, gap 0.5s ${ease}`,
        top: isLanding ? '50vh' : 13,
        right: isLanding ? '50%' : 24,
        transform: isLanding ? 'translateX(50%)' : 'translateX(0)',
        gap: isLanding ? 16 : 10,
      }}>
        <div style={{ width: isLanding ? 180 : 140, transition: `width 0.6s ${ease}` }}>
          <label style={labelStyle} className="text-theme-text-secondary">Date</label>
          <CalendarPicker value={selectedDate} onChange={setSelectedDate} />
        </div>
        <div style={{ width: isLanding ? 180 : 130, transition: `width 0.6s ${ease}` }}>
          <label style={labelStyle} className="text-theme-text-secondary">Location</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)}
            className="border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary focus:border-theme-text-primary"
            style={selectStyle}>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={{ width: isLanding ? 180 : 130, transition: `width 0.6s ${ease}` }}>
          <label style={labelStyle} className="text-theme-text-secondary">Meal Time</label>
          <select value={mealTime} onChange={(e) => setMealTime(e.target.value)}
            className="border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary focus:border-theme-text-primary"
            style={selectStyle}>
            {mealTimes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* ── View Menu button — fades out ── */}
      <button
        onClick={handleViewMenu}
        className="border-2 border-theme-text-primary text-theme-text-primary font-bold uppercase hover:bg-theme-text-primary hover:text-theme-bg-primary"
        style={{
          position: 'fixed', zIndex: 20,
          top: '64vh', left: '50%', transform: 'translateX(-50%)',
          transition: 'opacity 0.35s ease',
          opacity: isLanding ? 1 : 0,
          pointerEvents: isLanding ? 'auto' : 'none',
          padding: '12px 40px',
          letterSpacing: '0.2em', fontSize: '0.875rem',
          background: 'transparent', cursor: 'pointer',
        }}
      >
        View Menu
      </button>

      {/* ── Admin link — fades out ── */}
      <div style={{
        position: 'fixed', zIndex: 20,
        top: '78vh', left: '50%', transform: 'translateX(-50%)',
        transition: 'opacity 0.3s ease',
        opacity: isLanding ? 0.25 : 0,
        pointerEvents: isLanding ? 'auto' : 'none',
      }}>
        <Link href="/admin" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary"
          style={{ transition: 'color 0.2s' }}>
          Admin
        </Link>
      </div>

      {/* ── Header divider line ── */}
      <div style={{
        position: 'fixed', top: 60, left: 0, right: 0, height: 1, zIndex: 15,
        transition: 'opacity 0.4s ease',
        opacity: isLanding ? 0 : 0.1,
        background: 'currentColor',
      }} />

      {/* ── Results table area — slides up + fades in ── */}
      <div style={{
        position: 'fixed', top: 61, left: 0, right: 0, bottom: 0, zIndex: 10,
        overflowY: 'auto',
        transition: `opacity 0.5s ease ${isLanding ? '0s' : '0.15s'}, transform 0.5s ease ${isLanding ? '0s' : '0.15s'}`,
        opacity: isLanding ? 0 : 1,
        transform: isLanding ? 'translateY(30px)' : 'translateY(0)',
        pointerEvents: isLanding ? 'none' : 'auto',
      }}>
        <main className="px-6 md:px-12 lg:px-20 py-8">
          {error && (
            <div className="mb-6 p-4 border border-red-500/50 text-red-400 text-sm">{error}</div>
          )}

          {!loading && !isLanding && (
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
                foods.map((food, i) => (
                  <tr key={food.id}
                    className="border-b border-theme-text-primary/5 hover:bg-theme-bg-secondary/50 transition-colors group"
                    style={{ animation: `fadeInRow 0.3s ease-out ${Math.min(i * 0.015, 1)}s both` }}>
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

        <footer className="border-t border-theme-text-primary/5 px-6 md:px-12 lg:px-20 py-6">
          <p className="text-xs text-theme-text-tertiary tracking-wide">
            BoilerFuel &middot; Purdue Dining Data &middot; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}

// index has its own layout — skip the shared Layout wrapper
Home.getLayout = (page) => page;
