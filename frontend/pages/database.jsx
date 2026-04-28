import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { ALL_PURDUE_CATEGORIES, FOOD_CO_LOCATIONS } from '../utils/diningLocations';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const PAGE_SIZE = 100;
const MEAL_TIMES = ['All', 'Breakfast', 'Brunch', 'Lunch', 'Late Lunch', 'Dinner'];
const HOVER_DELAY = 400;

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Calendar picker (from index.jsx) ──
function CalendarPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(current.getFullYear());
  const [viewMonth, setViewMonth] = useState(current.getMonth());

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const selectedDay = current.getFullYear() === viewYear && current.getMonth() === viewMonth ? current.getDate() : null;
  const todayStr = localDateStr();

  function pick(day) {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  }
  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }

  const isToday = value === localDateStr();
  const dayNames7 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const displayDate = value
    ? (isToday ? 'Today' : `${dayNames7[current.getDay()]} · ${monthNames[current.getMonth()]} ${current.getDate()}`)
    : 'Select date';

  return (
    <div ref={ref} className="relative" data-calendar>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full border bg-theme-bg-secondary text-theme-text-primary text-left font-mono flex items-center justify-between hover:bg-theme-bg-hover transition-all px-2 py-1.5 border-theme-text-primary/30 text-sm gap-2`}>
        <span className={`whitespace-nowrap ${isToday ? 'text-yellow-500/80 font-bold' : ''}`}>{displayDate}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60 shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-[min(18rem,calc(100vw-1rem))] border border-theme-text-primary bg-theme-bg-primary"
          style={{ animation: `fadeInTooltip 0.15s ${EASE} both` }}>
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
              const isTodayDay = dateStr === todayStr;
              return (
                <button key={day} type="button" onClick={() => pick(day)}
                  className={`py-1.5 font-mono text-sm transition-colors ${
                    isSelected ? 'bg-theme-text-primary text-theme-bg-primary font-bold'
                    : isTodayDay ? 'border border-theme-text-primary font-bold hover:bg-theme-bg-hover'
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

// ── Meal time dropdown ──
function MealTimeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const hoverTimer = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative"
      onMouseEnter={() => { clearTimeout(hoverTimer.current); hoverTimer.current = setTimeout(() => { if (!open) setOpen(true); }, HOVER_DELAY); }}
      onMouseLeave={() => { clearTimeout(hoverTimer.current); setOpen(false); }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full border bg-theme-bg-secondary text-theme-text-primary text-left font-mono flex items-center justify-between hover:bg-theme-bg-hover transition-all px-2 py-1.5 border-theme-text-primary/30 text-sm gap-2">
        <span className="whitespace-nowrap truncate">{value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-50 shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: `transform 0.2s ${EASE}` }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-full overflow-y-auto border border-theme-text-primary bg-theme-bg-primary"
          style={{ animation: `fadeInTooltip 0.15s ${EASE} both` }}>
          {MEAL_TIMES.map(m => (
            <button key={m} type="button"
              onClick={() => { onChange(m); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                value === m ? 'bg-theme-text-primary text-theme-bg-primary font-bold' : 'hover:bg-theme-bg-hover text-theme-text-primary'
              }`}>
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Location category groups ──
const LOCATION_GROUPS = [
  ...ALL_PURDUE_CATEGORIES.map(cat => ({ label: cat.label, locations: cat.locations })),
  { label: 'Food Co', locations: FOOD_CO_LOCATIONS.map(l => l.name) },
];

function buildCourtParam(selectedLabels) {
  const names = [];
  for (const group of LOCATION_GROUPS) {
    if (selectedLabels.has(group.label)) {
      names.push(...group.locations);
    }
  }
  return names.join(',');
}

// ── Sort field config ──
const SORT_FIELDS = [
  { key: 'calories', label: 'Cal', color: 'text-yellow-500', dimColor: 'text-yellow-500/50' },
  { key: 'protein', label: 'P', color: 'text-blue-400', dimColor: 'text-blue-400/50' },
  { key: 'carbs', label: 'C', color: 'text-orange-400', dimColor: 'text-orange-400/50' },
  { key: 'fats', label: 'F', color: 'text-red-400', dimColor: 'text-red-400/50' },
];

function getMacroVal(food, field) {
  if (field === 'calories') return food.calories || 0;
  const m = food.macros || {};
  if (field === 'fats') return parseFloat(m.fats ?? m.fat ?? 0) || 0;
  return parseFloat(m[field] ?? 0) || 0;
}

// ── Main page ──
export default function DatabasePage() {
  const [selectedDate, setSelectedDate] = useState(() => localDateStr());
  const [mealTime, setMealTime] = useState('All');
  const [selectedGroups, setSelectedGroups] = useState(() => new Set(['Dining Courts']));
  const [includeBeverages, setIncludeBeverages] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState('calories');
  const [sortDir, setSortDir] = useState('desc');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState(null);
  const abortRef = useRef(null);

  // Serialize selectedGroups for dependency tracking
  const groupsKey = useMemo(() => [...selectedGroups].sort().join(','), [selectedGroups]);

  // Fetch foods when filters change
  const fetchFoods = useCallback(async () => {
    if (selectedGroups.size === 0) { setFoods([]); return; }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('dining_court', buildCourtParam(selectedGroups));
    if (mealTime !== 'All') params.set('meal_time', mealTime);
    if (selectedDate) params.set('date', selectedDate);

    try {
      const res = await fetch(`/api/foods?${params.toString()}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setFoods(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError('Could not load foods.');
      setFoods([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [groupsKey, mealTime, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchFoods(); }, [fetchFoods]);

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [groupsKey, mealTime, selectedDate, searchText, sortField, sortDir, includeBeverages]);

  // Filter + sort
  const sortedFoods = useMemo(() => {
    const filtered = foods.filter(f => {
      if (!includeBeverages && (f.station || '').toLowerCase() === 'beverages') return false;
      if (searchText && !f.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
    // Deduplicate by name+calories (same food at multiple courts)
    const seen = new Set();
    const deduped = [];
    for (const f of filtered) {
      const key = `${f.name.toLowerCase()}|${f.calories}`;
      if (!seen.has(key)) { seen.add(key); deduped.push(f); }
    }
    return deduped.sort((a, b) => {
      const av = getMacroVal(a, sortField);
      const bv = getMacroVal(b, sortField);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [foods, sortField, sortDir, includeBeverages, searchText]);

  const visibleFoods = sortedFoods.slice(0, visibleCount);
  const hasMore = visibleCount < sortedFoods.length;

  function toggleGroup(label) {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  }

  const sortLabel = SORT_FIELDS.find(f => f.key === sortField)?.label || 'Cal';

  return (
    <Layout>
      <Head>
        <title>Food Database | BoilerFuel</title>
      </Head>

      <style jsx global>{`
        @keyframes fadeInTooltip { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInRow { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 600px; } }
      `}</style>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-theme-text-primary tracking-tight">Food Database</h1>
          <p className="text-sm text-theme-text-tertiary mt-1">Rank and compare all Purdue dining foods by any nutrient</p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="w-44">
            <CalendarPicker value={selectedDate} onChange={setSelectedDate} />
          </div>
          <div className="w-32">
            <MealTimeDropdown value={mealTime} onChange={setMealTime} />
          </div>
          <div className="flex-1 min-w-[140px]">
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search foods..."
              className="w-full border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-theme-text-primary hover:bg-theme-bg-hover transition-all"
            />
          </div>
        </div>

        {/* Location category pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {LOCATION_GROUPS.map(g => {
            const active = selectedGroups.has(g.label);
            return (
              <button key={g.label} type="button" onClick={() => toggleGroup(g.label)}
                className={`px-3 py-1.5 border text-xs font-bold uppercase tracking-wider transition-colors ${
                  active
                    ? 'border-theme-text-primary bg-theme-text-primary text-theme-bg-primary'
                    : 'border-theme-text-primary/20 text-theme-text-tertiary hover:border-theme-text-primary/50 hover:text-theme-text-secondary'
                }`}>
                {g.label} <span className="opacity-50">({g.locations.length})</span>
              </button>
            );
          })}
          <span className="text-theme-text-primary/10">|</span>
          <button type="button" onClick={() => setIncludeBeverages(v => !v)}
            className={`px-3 py-1.5 border text-xs font-bold uppercase tracking-wider transition-colors ${
              includeBeverages
                ? 'border-theme-text-primary bg-theme-text-primary text-theme-bg-primary'
                : 'border-theme-text-primary/20 text-theme-text-tertiary hover:border-theme-text-primary/50 hover:text-theme-text-secondary'
            }`}>
            Beverages
          </button>
        </div>

        {/* Sort pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Sort by</span>
          {SORT_FIELDS.map(sf => {
            const active = sortField === sf.key;
            return (
              <button key={sf.key} type="button" onClick={() => toggleSort(sf.key)}
                className={`px-2.5 py-1 border text-xs font-bold uppercase tracking-wider transition-colors ${
                  active
                    ? `border-current ${sf.color}`
                    : `border-theme-text-primary/15 ${sf.dimColor} hover:border-current`
                }`}>
                {sf.label}
                {active && (sortDir === 'desc' ? ' \u25BC' : ' \u25B2')}
              </button>
            );
          })}
        </div>

        {/* Results summary */}
        {!loading && selectedGroups.size > 0 && (
          <div className="text-xs text-theme-text-tertiary mb-3 font-mono">
            {sortedFoods.length} food{sortedFoods.length !== 1 ? 's' : ''} &middot; sorted by {sortLabel} ({sortDir === 'desc' ? 'high\u2192low' : 'low\u2192high'})
          </div>
        )}

        {/* Empty state: no groups selected */}
        {selectedGroups.size === 0 && !loading && (
          <div className="py-16 text-center text-theme-text-tertiary">
            <p className="text-sm">Select at least one location category above to browse foods.</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-0">
            <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
              <tbody>
                {Array.from({ length: 8 }, (_, i) => (
                  <tr key={i} className="border-b border-theme-text-primary/5 animate-pulse">
                    <td className="py-3 w-10"><div className="h-3 bg-theme-text-primary/10 rounded-sm w-6" /></td>
                    <td className="py-3"><div className="h-3 bg-theme-text-primary/10 rounded-sm w-3/4" /></td>
                    <td className="py-3 hidden sm:table-cell w-40"><div className="h-3 bg-theme-text-primary/8 rounded-sm w-2/3" /></td>
                    <td className="py-3 hidden md:table-cell w-24"><div className="h-3 bg-theme-text-primary/8 rounded-sm w-1/2" /></td>
                    <td className="py-3 hidden lg:table-cell w-14"><div className="h-3 bg-theme-text-primary/8 rounded-sm w-full" /></td>
                    <td className="py-3 hidden lg:table-cell w-14"><div className="h-3 bg-theme-text-primary/8 rounded-sm w-full" /></td>
                    <td className="py-3 hidden lg:table-cell w-14"><div className="h-3 bg-theme-text-primary/8 rounded-sm w-full" /></td>
                    <td className="py-3 w-16"><div className="h-3 bg-theme-text-primary/8 rounded-sm w-full" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="py-8 text-center text-red-400 text-sm">{error}</div>
        )}

        {/* Results table */}
        {!loading && selectedGroups.size > 0 && sortedFoods.length > 0 && (
          <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-theme-text-primary/20">
                <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-tertiary w-10">#</th>
                <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary">Food</th>
                <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary hidden sm:table-cell w-40">Location</th>
                <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary hidden md:table-cell w-24">Meal</th>
                {SORT_FIELDS.filter(sf => sf.key !== 'calories').map(sf => (
                  <th key={sf.key}
                    className={`py-3 font-bold uppercase text-xs tracking-wider text-right cursor-pointer select-none transition-colors w-14 hidden lg:table-cell ${
                      sortField === sf.key ? sf.color : `${sf.dimColor} hover:${sf.color}`
                    }`}
                    onClick={() => toggleSort(sf.key)}>
                    {sf.label}{sortField === sf.key ? (sortDir === 'desc' ? ' \u25BC' : ' \u25B2') : ''}
                  </th>
                ))}
                <th className={`py-3 font-bold uppercase text-xs tracking-wider text-right cursor-pointer select-none transition-colors w-16 ${
                    sortField === 'calories' ? 'text-yellow-500' : 'text-yellow-500/50 hover:text-yellow-500'
                  }`}
                  onClick={() => toggleSort('calories')}>
                  Cal{sortField === 'calories' ? (sortDir === 'desc' ? ' \u25BC' : ' \u25B2') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleFoods.map((food, i) => {
                const rank = i + 1;
                const macros = food.macros || {};
                const rowKey = `${food.id}-${food.dining_court}-${food.name}`;
                const isExpanded = expandedId === rowKey;
                return (
                  <tr key={rowKey} className="border-b border-theme-text-primary/5 group">
                    <td colSpan={8} className="p-0">
                      <div className="flex items-center cursor-pointer hover:bg-theme-bg-secondary/50 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : rowKey)}>
                        {/* Rank */}
                        <div className={`py-2.5 w-10 shrink-0 text-center font-mono tabular-nums text-sm ${
                          rank <= 3 ? 'text-yellow-500 font-bold' : 'text-theme-text-tertiary'
                        }`}>
                          {rank}
                        </div>
                        {/* Food name */}
                        <div className="py-2.5 flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                              className="shrink-0 text-theme-text-tertiary transition-transform duration-200"
                              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                              <polyline points="9 6 15 12 9 18" />
                            </svg>
                            <span className="truncate group-hover:text-theme-text-primary transition-colors">{food.name}</span>
                            {macros.is_vegetarian && (
                              <span className="shrink-0 text-[9px] font-bold border border-green-500/60 text-green-500 px-1 py-0 leading-tight">VG</span>
                            )}
                            {macros.is_vegan && (
                              <span className="shrink-0 text-[9px] font-bold border border-emerald-400/60 text-emerald-400 px-1 py-0 leading-tight">V</span>
                            )}
                          </div>
                          <span className="block sm:hidden text-xs text-theme-text-tertiary capitalize mt-0.5 pl-[18px]">{food.dining_court} &middot; {food.meal_time}</span>
                        </div>
                        {/* Location */}
                        <div className="py-2 px-2 text-theme-text-secondary capitalize hidden sm:block w-40 shrink-0 whitespace-nowrap overflow-hidden text-ellipsis text-sm">{food.dining_court}</div>
                        {/* Meal */}
                        <div className="py-2 px-2 text-theme-text-tertiary capitalize hidden md:block w-24 shrink-0 text-sm">{food.meal_time}</div>
                        {/* P C F */}
                        <div className="py-2 text-right font-mono tabular-nums w-14 shrink-0 text-theme-text-tertiary/60 hidden lg:block text-sm">
                          {macros.protein != null ? Math.round(macros.protein) : '—'}
                        </div>
                        <div className="py-2 text-right font-mono tabular-nums w-14 shrink-0 text-theme-text-tertiary/60 hidden lg:block text-sm">
                          {macros.carbs != null ? Math.round(macros.carbs) : '—'}
                        </div>
                        <div className="py-2 text-right font-mono tabular-nums w-14 shrink-0 text-theme-text-tertiary/60 hidden lg:block text-sm">
                          {(macros.fats ?? macros.fat) != null ? Math.round(macros.fats ?? macros.fat) : '—'}
                        </div>
                        {/* Cal */}
                        <div className="py-2 pl-2 text-right font-mono tabular-nums w-16 shrink-0 text-theme-text-secondary font-bold">
                          {food.calories || '—'}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-theme-text-primary/10 bg-theme-bg-secondary/30 px-4 sm:px-6 py-4"
                          style={{ animation: `fadeInRow 0.2s ${EASE} both` }}>
                          {/* Main macros */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                            <div className="border border-theme-text-primary/10 px-3 py-2">
                              <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Calories</div>
                              <div className="text-lg font-bold tabular-nums">{food.calories}</div>
                            </div>
                            <div className="border border-theme-text-primary/10 px-3 py-2">
                              <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Protein</div>
                              <div className="text-lg font-bold tabular-nums">{macros.protein != null ? Number(macros.protein).toFixed(1) : '—'}<span className="text-xs text-theme-text-tertiary">g</span></div>
                            </div>
                            <div className="border border-theme-text-primary/10 px-3 py-2">
                              <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Carbs</div>
                              <div className="text-lg font-bold tabular-nums">{macros.carbs != null ? Number(macros.carbs).toFixed(1) : '—'}<span className="text-xs text-theme-text-tertiary">g</span></div>
                            </div>
                            <div className="border border-theme-text-primary/10 px-3 py-2">
                              <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Fat</div>
                              <div className="text-lg font-bold tabular-nums">{(macros.fats ?? macros.fat) != null ? Number(macros.fats ?? macros.fat).toFixed(1) : '—'}<span className="text-xs text-theme-text-tertiary">g</span></div>
                            </div>
                          </div>
                          {/* Secondary nutrients */}
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
                            {[
                              { label: 'Sat. Fat', val: macros.saturated_fat },
                              { label: 'Cholesterol', val: macros.cholesterol, unit: 'mg' },
                              { label: 'Sodium', val: macros.sodium, unit: 'mg' },
                              { label: 'Fiber', val: macros.fiber },
                              { label: 'Sugar', val: macros.sugar },
                              { label: 'Added Sugar', val: macros.added_sugar },
                            ].map(n => (
                              <div key={n.label} className="border border-theme-text-primary/5 px-1.5 py-1.5">
                                <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-theme-text-tertiary/70 leading-tight">{n.label}</div>
                                <div className="text-sm font-bold tabular-nums mt-0.5">
                                  {n.val != null ? Number(n.val).toFixed(1) : '—'}
                                  <span className="text-[10px] text-theme-text-tertiary">{n.unit || 'g'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Tags */}
                          <div className="flex items-center flex-wrap gap-1.5 mt-3">
                            {macros.is_vegan && (
                              <span className="text-[10px] font-bold border border-emerald-400/50 text-emerald-400 px-2 py-0.5">Vegan</span>
                            )}
                            {macros.is_vegetarian && !macros.is_vegan && (
                              <span className="text-[10px] font-bold border border-green-500/50 text-green-500 px-2 py-0.5">Vegetarian</span>
                            )}
                            {macros.allergens && macros.allergens.map(a => (
                              <span key={a} className="text-[10px] border border-theme-text-tertiary/20 text-theme-text-tertiary px-2 py-0.5">{a}</span>
                            ))}
                          </div>
                          {/* Metadata */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-theme-text-tertiary">
                            {food.station && <span>{food.station}</span>}
                            {food.dining_court && <span className="capitalize">{food.dining_court}</span>}
                            {food.meal_time && <span className="capitalize">{food.meal_time}</span>}
                            {(() => { const ss = macros.serving_size || food.serving_size || ''; const skip = !ss || /^(1 serving|serving|unknown)$/i.test(ss.trim()); return !skip ? <span>{ss}</span> : null; })()}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {hasMore && (
                <tr>
                  <td colSpan={8} className="py-6 text-center">
                    <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                      className="px-6 py-2 text-sm uppercase tracking-wider border border-theme-text-primary/30 text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary transition-colors font-mono">
                      Show more ({sortedFoods.length - visibleCount} remaining)
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* No results */}
        {!loading && selectedGroups.size > 0 && sortedFoods.length === 0 && !error && (
          <div className="py-16 text-center text-theme-text-tertiary">
            <p className="text-sm">No foods found for these filters.</p>
            <p className="text-xs mt-2">Try selecting &ldquo;All&rdquo; for Meal Time, or enable more location categories.</p>
          </div>
        )}

        {/* Back to home */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-theme-text-tertiary hover:text-theme-text-primary transition-colors uppercase tracking-wider">
            &larr; Back to meal tracker
          </Link>
        </div>
      </div>
    </Layout>
  );
}
