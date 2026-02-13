import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { LOCATION_CATEGORIES } from '../utils/diningLocations';

// ── Smoother easing ──
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const TRANSITION_MS = 900; // cooldown for scroll-triggered transitions

// ── Custom black & white calendar picker ──
function CalendarPicker({ value, onChange, compact = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(current.getFullYear());
  const [viewMonth, setViewMonth] = useState(current.getMonth());

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

  const displayDate = value
    ? `${monthNames[current.getMonth()]} ${current.getDate()}, ${current.getFullYear()}`
    : 'Select date';

  return (
    <div ref={ref} className="relative" data-calendar>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full border bg-theme-bg-secondary text-theme-text-primary text-left font-mono flex items-center justify-between hover:bg-theme-bg-hover transition-all ${
          compact ? 'px-2 py-1.5 border-theme-text-primary/30 text-sm gap-2' : 'p-2 border-theme-text-primary gap-3'
        }`}>
        <span className="whitespace-nowrap">{displayDate}</span>
        <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60 shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-72 border border-theme-text-primary bg-theme-bg-primary shadow-lg">
          <div className="flex items-center justify-between p-3 border-b border-theme-text-primary/20">
            <button type="button" onClick={prevMonth} className="px-2 py-1 hover:bg-theme-bg-hover text-theme-text-primary font-bold">&lt;</button>
            <span className="font-bold text-sm uppercase tracking-wider">{monthNames[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="px-2 py-1 hover:bg-theme-bg-hover text-theme-text-primary font-bold">&gt;</button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-bold uppercase text-theme-text-secondary border-b border-theme-text-primary/10 py-2 px-2">
            {dayNames.map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 text-center text-sm p-2 gap-y-1">
            {Array.from({ length: firstDay }, (_, i) => <div key={'e' + i} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = day === selectedDay;
              const isToday = dateStr === todayStr;
              return (
                <button key={day} type="button" onClick={() => pick(day)}
                  className={`py-1.5 font-mono text-sm transition-colors ${
                    isSelected ? 'bg-theme-text-primary text-theme-bg-primary font-bold'
                    : isToday ? 'border border-theme-text-primary font-bold hover:bg-theme-bg-hover'
                    : 'hover:bg-theme-bg-hover text-theme-text-primary'
                  }`}>{day}</button>
              );
            })}
          </div>
          <div className="border-t border-theme-text-primary/10 p-2">
            <button type="button"
              onClick={() => { onChange(todayStr); setOpen(false); setViewMonth(new Date().getMonth()); setViewYear(new Date().getFullYear()); }}
              className="w-full text-center text-xs uppercase tracking-wider py-1 hover:bg-theme-bg-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors">
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Custom grouped location dropdown ──
function LocationDropdown({ value, onChange, availableLocations, compact = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filter categories to only show locations that exist in DB
  const availSet = new Set((availableLocations || []).map(l => l.toLowerCase()));
  const filteredCategories = LOCATION_CATEGORIES.map(cat => ({
    ...cat,
    locations: cat.locations.filter(loc => availSet.has(loc.toLowerCase())),
  })).filter(cat => cat.locations.length > 0);

  // Display text
  const displayText = value.type === 'all' ? 'All'
    : value.type === 'category' ? value.value
    : value.value;

  function select(newVal) {
    onChange(newVal);
    setOpen(false);
  }

  const isActive = (type, val) => value.type === type && value.value === val;

  return (
    <div ref={ref} className="relative" data-location-dropdown>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full border bg-theme-bg-secondary text-theme-text-primary text-left font-mono flex items-center justify-between hover:bg-theme-bg-hover transition-all ${
          compact ? 'px-2 py-1.5 border-theme-text-primary/30 text-sm gap-2' : 'p-2 border-theme-text-primary gap-3'
        }`}>
        <span className="whitespace-nowrap truncate">{displayText}</span>
        <svg width={compact ? 12 : 14} height={compact ? 12 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-50 shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: `transform 0.2s ${EASE}` }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 w-64 max-h-80 overflow-y-auto border border-theme-text-primary bg-theme-bg-primary shadow-lg"
          style={{ animation: `fadeInTooltip 0.15s ${EASE} both` }}>
          {/* All */}
          <button type="button" onClick={() => select({ type: 'all', value: 'All' })}
            className={`w-full text-left px-3 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
              isActive('all', 'All') ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-hover text-theme-text-primary'
            }`}>
            All Locations
          </button>

          {filteredCategories.map(cat => (
            <div key={cat.label}>
              {/* Category header — clickable to select all in category */}
              <button type="button"
                onClick={() => select({ type: 'category', value: cat.label, locations: cat.locations })}
                className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-widest border-t border-theme-text-primary/10 transition-colors ${
                  isActive('category', cat.label)
                    ? 'bg-theme-text-primary text-theme-bg-primary'
                    : 'bg-theme-bg-tertiary/50 hover:bg-theme-bg-hover text-theme-text-secondary'
                }`}>
                {cat.label}
              </button>
              {/* Individual locations */}
              {cat.locations.map(loc => (
                <button key={loc} type="button"
                  onClick={() => select({ type: 'single', value: loc })}
                  className={`w-full text-left px-5 py-1.5 text-sm transition-colors ${
                    isActive('single', loc)
                      ? 'bg-theme-text-primary text-theme-bg-primary'
                      : 'hover:bg-theme-bg-hover text-theme-text-primary'
                  }`}>
                  {loc}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Macro tooltip ──
function MacroTooltip({ food, pos }) {
  if (!food || !pos) return null;
  const macros = food.macros || {};
  return (
    <div style={{
      position: 'fixed', zIndex: 100,
      left: Math.min(pos.x + 12, (typeof window !== 'undefined' ? window.innerWidth - 200 : 600)),
      top: pos.y - 10,
      animation: `fadeInTooltip 0.15s ${EASE} both`,
      pointerEvents: 'none',
    }}
      className="bg-theme-bg-secondary border border-theme-text-primary/20 shadow-xl px-4 py-3 font-mono text-xs">
      <div className="font-bold text-theme-text-primary mb-2 text-sm">{food.name}</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        <span className="text-theme-text-tertiary">Calories</span>
        <span className="text-right text-theme-text-primary font-bold">{food.calories}</span>
        <span className="text-theme-text-tertiary">Protein</span>
        <span className="text-right text-theme-text-primary">{macros.protein ?? '—'}g</span>
        <span className="text-theme-text-tertiary">Carbs</span>
        <span className="text-right text-theme-text-primary">{macros.carbs ?? '—'}g</span>
        <span className="text-theme-text-tertiary">Fat</span>
        <span className="text-right text-theme-text-primary">{macros.fats ?? macros.fat ?? '—'}g</span>
      </div>
      {food.station && (
        <div className="mt-2 pt-2 border-t border-theme-text-primary/10 text-theme-text-tertiary">
          Station: {food.station}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// ── Main Home component ──
// ══════════════════════════════════════
export default function Home() {
  // ── State ──
  const [location, setLocation] = useState({ type: 'all', value: 'All' });
  const [mealTime, setMealTime] = useState('All');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [foods, setFoods] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('landing');
  const [calorieSort, setCalorieSort] = useState(null); // null | 'asc' | 'desc'
  const [hoveredFood, setHoveredFood] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  const mealTimes = ['All', 'Breakfast', 'Lunch', 'Dinner'];
  const isLanding = view === 'landing';

  // ── Refs ──
  const resultsRef = useRef(null);
  const transitioning = useRef(false);
  const scrollDeltaRef = useRef(0);
  const scrollTimeoutRef = useRef(null);
  const touchStartY = useRef(null);

  // ── Fetch available locations ──
  useEffect(() => {
    fetch('/api/dining-courts')
      .then(res => res.json())
      .then(courts => {
        if (Array.isArray(courts)) setAvailableLocations(courts);
      })
      .catch(err => console.error('Failed to load locations:', err));
  }, []);

  // ── Fetch foods ──
  const fetchFoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (location.type === 'single') {
        params.set('dining_court', location.value);
      } else if (location.type === 'category' && location.locations) {
        params.set('dining_court', location.locations.join(','));
      }
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

  // ── Transition helpers ──
  function startTransition(nextView) {
    if (transitioning.current) return;
    transitioning.current = true;
    if (nextView === 'results') {
      fetchFoods();
    }
    setView(nextView);
    setTimeout(() => { transitioning.current = false; }, TRANSITION_MS);
  }

  function handleViewMenu() {
    startTransition('results');
  }

  function handleBack() {
    if (resultsRef.current) resultsRef.current.scrollTop = 0;
    setHoveredFood(null);
    setTooltipPos(null);
    startTransition('landing');
  }

  // Re-fetch when filters change while in results view
  useEffect(() => {
    if (view === 'results') fetchFoods();
  }, [view, fetchFoods]);

  // ── Scroll-based navigation: landing → results ──
  useEffect(() => {
    if (view !== 'landing') return;

    function onWheel(e) {
      // Don't trigger if inside calendar or dropdown
      if (e.target.closest('[data-calendar]') || e.target.closest('[data-location-dropdown]')) return;
      if (transitioning.current) return;

      // Accumulate delta
      scrollDeltaRef.current += e.deltaY;
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => { scrollDeltaRef.current = 0; }, 300);

      if (scrollDeltaRef.current > 80) {
        scrollDeltaRef.current = 0;
        handleViewMenu();
      }
      // Prevent native overscroll on landing
      e.preventDefault();
    }

    // Touch events
    function onTouchStart(e) {
      touchStartY.current = e.touches[0].clientY;
    }
    function onTouchMove(e) {
      if (transitioning.current || touchStartY.current === null) return;
      const delta = touchStartY.current - e.touches[0].clientY;
      if (delta > 60) {
        touchStartY.current = null;
        handleViewMenu();
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll-based navigation: results → landing (scroll up at top) ──
  useEffect(() => {
    if (view !== 'results') return;
    const el = resultsRef.current;
    if (!el) return;

    let upDelta = 0;
    let upTimeout = null;

    function onWheel(e) {
      if (transitioning.current) return;
      if (el.scrollTop > 1) { upDelta = 0; return; }
      if (e.deltaY < 0) {
        upDelta += Math.abs(e.deltaY);
        clearTimeout(upTimeout);
        upTimeout = setTimeout(() => { upDelta = 0; }, 300);
        if (upDelta > 60) {
          upDelta = 0;
          handleBack();
          e.preventDefault();
        }
      } else {
        upDelta = 0;
      }
    }

    let tStartY = null;
    function onTouchStart(e) { tStartY = e.touches[0].clientY; }
    function onTouchMove(e) {
      if (transitioning.current || tStartY === null) return;
      if (el.scrollTop > 1) { tStartY = null; return; }
      const delta = e.touches[0].clientY - tStartY;
      if (delta > 60) {
        tStartY = null;
        handleBack();
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      clearTimeout(upTimeout);
    };
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sorted + grouped foods ──
  const sortedFoods = useMemo(() => {
    if (!calorieSort) return foods;
    return [...foods].sort((a, b) => calorieSort === 'asc' ? a.calories - b.calories : b.calories - a.calories);
  }, [foods, calorieSort]);

  // Group by dining court → station (for multi-court views), or just station (single court)
  const groupedFoods = useMemo(() => {
    const showCourtHeaders = location.type !== 'single';
    const groups = [];
    let currentCourt = null;
    let currentStation = null;

    for (const food of sortedFoods) {
      const court = food.dining_court || 'Unknown';
      const station = food.station || 'General';

      if (showCourtHeaders && court !== currentCourt) {
        groups.push({ type: 'court-header', label: court });
        currentCourt = court;
        currentStation = null;
      }
      if (station !== currentStation || (showCourtHeaders && court !== currentCourt)) {
        // After a court-header, always show the first station
        if (station !== currentStation) {
          groups.push({ type: 'station-header', label: station, court });
          currentStation = station;
        }
      }
      groups.push({ type: 'food', food });
    }
    return groups;
  }, [sortedFoods, location.type]);

  // ── Calorie sort toggle ──
  function toggleCalorieSort() {
    setCalorieSort(prev => prev === null ? 'asc' : prev === 'asc' ? 'desc' : null);
  }

  // ── Tooltip handlers (RAF-throttled to avoid re-render storm) ──
  const rafRef = useRef(null);
  function onFoodMouseEnter(food, e) {
    setHoveredFood(food);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }
  function onFoodMouseMove(e) {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setTooltipPos({ x: e.clientX, y: e.clientY });
      rafRef.current = null;
    });
  }
  function onFoodMouseLeave() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setHoveredFood(null);
    setTooltipPos(null);
  }

  // ── Date label ──
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const dateLabel = `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

  // ── Location display for summary bar ──
  const locationLabel = location.type === 'all' ? 'All locations'
    : location.type === 'category' ? location.value
    : location.value;

  // ── Label style — collapses height+fades ──
  const labelStyle = {
    display: 'block', fontWeight: 'bold', textTransform: 'uppercase',
    fontSize: '0.7rem', letterSpacing: '0.05em', textAlign: 'center',
    transition: `opacity 0.4s ${EASE}, max-height 0.5s ${EASE}, margin-bottom 0.5s ${EASE}`,
    opacity: isLanding ? 0.6 : 0,
    maxHeight: isLanding ? 20 : 0,
    marginBottom: isLanding ? 6 : 0,
    overflow: 'hidden',
  };

  // ── Select style — padding/font shrink ──
  const selectStyle = {
    width: '100%', fontFamily: 'inherit', outline: 'none',
    transition: `padding 0.6s ${EASE}, font-size 0.6s ${EASE}`,
    padding: isLanding ? 8 : 6,
    fontSize: isLanding ? '1rem' : '0.875rem',
  };

  // ── Sort arrow indicator ──
  const sortArrow = calorieSort === 'asc' ? ' ▲' : calorieSort === 'desc' ? ' ▼' : '';

  // Count food rows
  let rowIndex = 0;

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono"
         style={{ position: 'relative', overflow: 'hidden' }}>
      <Head>
        <title>BoilerFuel - Dining Menu</title>
      </Head>

      {/* ── Back arrow ── */}
      <button onClick={handleBack}
        className="text-theme-text-tertiary hover:text-theme-text-primary"
        style={{
          position: 'fixed', top: 18, left: 24, zIndex: 30,
          transition: `opacity 0.4s ${EASE}`,
          opacity: isLanding ? 0 : 1,
          pointerEvents: isLanding ? 'none' : 'auto',
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
        }}
        title="Back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      {/* ── Title — slides from center to top-left (GPU-composited) ── */}
      <h1 className="font-bold uppercase"
        style={{
          position: 'fixed', zIndex: 20, whiteSpace: 'nowrap', lineHeight: 1.1,
          willChange: 'transform, opacity',
          /* Anchor at top-left, use transform for all movement */
          top: 0, left: 0,
          transition: `transform 0.85s ${EASE}, font-size 0.7s ${EASE}, letter-spacing 0.7s ${EASE}`,
          transform: isLanding
            ? 'translate(calc(50vw - 50%), 35vh)'
            : 'translate(64px, 18px)',
          fontSize: isLanding ? 'clamp(2rem, 5vw, 3.5rem)' : '1.25rem',
          letterSpacing: isLanding ? '0.25em' : '0.15em',
        }}>
        BoilerFuel
      </h1>

      {/* ── Subtitle — fades out ── */}
      <p className="text-theme-text-tertiary"
        style={{
          position: 'fixed', zIndex: 20,
          top: 'calc(35vh + clamp(2.5rem, 5.5vw, 4rem))',
          left: '50%', transform: 'translateX(-50%)',
          transition: `opacity 0.4s ${EASE}`,
          opacity: isLanding ? 1 : 0,
          pointerEvents: 'none',
          fontSize: '0.875rem', letterSpacing: '0.15em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
        Purdue Dining Court Menus
      </p>

      {/* ── Filters — slide from center to top-right (GPU-composited) ── */}
      <div style={{
        position: 'fixed', zIndex: 40,
        display: 'flex', alignItems: 'flex-end',
        willChange: 'transform',
        /* Anchor top-right, transform for movement */
        top: 0, right: 0,
        transition: `transform 0.85s ${EASE}, gap 0.6s ${EASE}`,
        transform: isLanding
          ? 'translate(calc(-50vw + 50%), 50vh)'
          : 'translate(-24px, 13px)',
        gap: isLanding ? 16 : 10,
      }}>
        <div style={{ width: isLanding ? 180 : 150, transition: `width 0.7s ${EASE}` }}>
          <label style={labelStyle} className="text-theme-text-secondary">Date</label>
          <CalendarPicker value={selectedDate} onChange={setSelectedDate} compact={!isLanding} />
        </div>
        <div style={{ width: isLanding ? 180 : 150, transition: `width 0.7s ${EASE}` }}>
          <label style={labelStyle} className="text-theme-text-secondary">Location</label>
          <LocationDropdown value={location} onChange={setLocation} availableLocations={availableLocations} compact={!isLanding} />
        </div>
        <div style={{ width: isLanding ? 180 : 130, transition: `width 0.7s ${EASE}` }}>
          <label style={labelStyle} className="text-theme-text-secondary">Meal Time</label>
          <select value={mealTime} onChange={(e) => setMealTime(e.target.value)}
            className="border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary focus:border-theme-text-primary"
            style={selectStyle}>
            {mealTimes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* ── View Menu button — fades out ── */}
      <button onClick={handleViewMenu}
        className="border-2 border-theme-text-primary text-theme-text-primary font-bold uppercase hover:bg-theme-text-primary hover:text-theme-bg-primary"
        style={{
          position: 'fixed', zIndex: 20,
          top: '64vh', left: '50%', transform: 'translateX(-50%)',
          transition: `opacity 0.4s ${EASE}`,
          opacity: isLanding ? 1 : 0,
          pointerEvents: isLanding ? 'auto' : 'none',
          padding: '12px 40px',
          letterSpacing: '0.2em', fontSize: '0.875rem',
          background: 'transparent', cursor: 'pointer',
        }}>
        View Menu
      </button>

      {/* ── Scroll hint ── */}
      <div style={{
        position: 'fixed', zIndex: 20,
        top: '73vh', left: '50%',
        transition: `opacity 0.4s ${EASE}`,
        opacity: isLanding ? 0.25 : 0,
        pointerEvents: 'none',
        animation: isLanding ? `scrollHintBounce 2s ${EASE} infinite` : 'none',
      }}>
        <div className="flex flex-col items-center gap-1">
          <span className="text-theme-text-tertiary" style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            or scroll
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-theme-text-tertiary">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* ── Admin link — fades out ── */}
      <div style={{
        position: 'fixed', zIndex: 20,
        top: '82vh', left: '50%', transform: 'translateX(-50%)',
        transition: `opacity 0.4s ${EASE}`,
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
        transition: `opacity 0.5s ${EASE}`,
        opacity: isLanding ? 0 : 0.1,
        background: 'currentColor',
      }} />

      {/* ── Results table area ── */}
      <div ref={resultsRef}
        style={{
          position: 'fixed', top: 61, left: 0, right: 0, bottom: 0, zIndex: 10,
          overflowY: 'auto',
          willChange: 'transform, opacity',
          transition: `opacity 0.55s ${EASE} ${isLanding ? '0s' : '0.15s'}, transform 0.55s ${EASE} ${isLanding ? '0s' : '0.15s'}, visibility 0s ${isLanding ? '0.55s' : '0s'}`,
          opacity: isLanding ? 0 : 1,
          transform: isLanding ? 'translateY(20px)' : 'translateY(0)',
          visibility: isLanding ? 'hidden' : 'visible',
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
                {dateLabel} &middot; {locationLabel} &middot; {mealTime !== 'All' ? mealTime : 'All meals'}
              </span>
            </div>
          )}

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-theme-text-primary/20">
                <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary">Food Item</th>
                <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary hidden sm:table-cell">Location</th>
                <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary hidden md:table-cell">Meal</th>
                <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary text-right cursor-pointer select-none hover:text-theme-text-primary transition-colors"
                  onClick={toggleCalorieSort}
                  title="Click to sort by calories">
                  Cal{sortArrow}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-theme-text-tertiary">
                    <span className="inline-block animate-pulse">Loading...</span>
                  </td>
                </tr>
              ) : groupedFoods.length > 0 ? (
                groupedFoods.map((item, i) => {
                  if (item.type === 'court-header') {
                    return (
                      <tr key={`court-${item.label}-${i}`}>
                        <td colSpan={4} className="pt-6 pb-2 px-0"
                          style={i < 60 ? { animation: `slideInStation 0.35s ${EASE} ${Math.min(i * 0.008, 0.4)}s both` } : undefined}>
                          <div className="text-sm font-bold uppercase tracking-widest text-theme-text-primary border-b-2 border-theme-text-primary/20 pb-1">
                            {item.label}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  if (item.type === 'station-header') {
                    return (
                      <tr key={`station-${item.court}-${item.label}-${i}`}>
                        <td colSpan={4} className="pt-4 pb-1 px-0"
                          style={i < 60 ? { animation: `slideInStation 0.35s ${EASE} ${Math.min(i * 0.008, 0.4)}s both` } : undefined}>
                          <div className="text-xs font-bold uppercase tracking-wider text-theme-text-tertiary pl-1"
                            style={{ borderLeft: '3px solid', borderColor: 'rgb(var(--color-accent-primary))', paddingLeft: 8 }}>
                            {item.label}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  // Food row
                  const food = item.food;
                  const ri = rowIndex++;
                  return (
                    <tr key={food.id}
                      className="border-b border-theme-text-primary/5 hover:bg-theme-bg-secondary/50 transition-colors group cursor-default"
                      style={ri < 40 ? { animation: `fadeInRow 0.35s ${EASE} ${Math.min(ri * 0.012, 0.5)}s both` } : undefined}
                      onMouseEnter={(e) => onFoodMouseEnter(food, e)}
                      onMouseMove={onFoodMouseMove}
                      onMouseLeave={onFoodMouseLeave}>
                      <td className="py-3 pr-4">
                        <span className="group-hover:text-theme-text-primary transition-colors">{food.name}</span>
                        <span className="block sm:hidden text-xs text-theme-text-tertiary capitalize mt-0.5">{food.dining_court} &middot; {food.meal_time}</span>
                      </td>
                      <td className="py-3 px-4 text-theme-text-secondary capitalize hidden sm:table-cell">{food.dining_court}</td>
                      <td className="py-3 px-4 text-theme-text-tertiary capitalize hidden md:table-cell">{food.meal_time}</td>
                      <td className="py-3 pl-4 text-right font-mono tabular-nums text-theme-text-secondary">{food.calories}</td>
                    </tr>
                  );
                })
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

      {/* ── Macro tooltip (results view only) ── */}
      {!isLanding && <MacroTooltip food={hoveredFood} pos={tooltipPos} />}
    </div>
  );
}

// index has its own layout — skip the shared Layout wrapper
Home.getLayout = (page) => page;
