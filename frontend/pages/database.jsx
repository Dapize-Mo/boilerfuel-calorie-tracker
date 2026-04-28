import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ALL_PURDUE_CATEGORIES, FOOD_CO_LOCATIONS } from '../utils/diningLocations';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const PAGE_SIZE = 100;
const MEAL_TIMES = ['All', 'Breakfast', 'Brunch', 'Lunch', 'Late Lunch', 'Dinner'];
const HOVER_DELAY = 400;

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Calendar picker ──
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
    ? (isToday ? 'Today' : `${monthNames[current.getMonth()]} ${current.getDate()}`)
    : 'Select date';

  return (
    <div ref={ref} className="relative" data-calendar>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full border border-theme-text-primary/20 bg-theme-bg-secondary text-theme-text-primary text-left font-mono flex items-center justify-between hover:border-theme-text-primary/40 hover:bg-theme-bg-hover transition-all px-3 py-2 text-sm gap-2">
        <span className="whitespace-nowrap">{displayDate}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-[min(18rem,calc(100vw-1rem))] border border-theme-text-primary/30 bg-theme-bg-primary shadow-lg"
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
      onMouseLeave={() => { clearTimeout(hoverTimer.current); }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full border border-theme-text-primary/20 bg-theme-bg-secondary text-theme-text-primary text-left font-mono flex items-center justify-between hover:border-theme-text-primary/40 hover:bg-theme-bg-hover transition-all px-3 py-2 text-sm gap-2">
        <span className="whitespace-nowrap truncate">{value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40 shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: `transform 0.2s ${EASE}` }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-full overflow-y-auto border border-theme-text-primary/30 bg-theme-bg-primary shadow-lg"
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
  { key: 'calories', label: 'Cal', color: 'text-yellow-500', dimColor: 'text-yellow-500/40' },
  { key: 'protein', label: 'P', color: 'text-blue-400', dimColor: 'text-blue-400/40' },
  { key: 'carbs', label: 'C', color: 'text-orange-400', dimColor: 'text-orange-400/40' },
  { key: 'fats', label: 'F', color: 'text-red-400', dimColor: 'text-red-400/40' },
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
  const activeSortField = SORT_FIELDS.find(f => f.key === sortField);

  return (
    <>
      <Head>
        <title>Food Database | BoilerFuel</title>
      </Head>

      <style jsx global>{`
        @keyframes fadeInTooltip { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInRow { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 600px; } }
      `}</style>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-10 sm:py-20">

      {/* Header */}
      <header className="space-y-4 mb-8">
        <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
          &larr; Back
        </Link>
        <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.2em]">Food Database</h1>
        <div className="w-12 h-px bg-theme-text-primary/30" />
        <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
          Rank and compare all Purdue dining foods by any nutrient
        </p>
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-widest text-theme-text-tertiary mb-1">Date</label>
          <div className="w-36">
            <CalendarPicker value={selectedDate} onChange={setSelectedDate} />
          </div>
        </div>
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-widest text-theme-text-tertiary mb-1">Meal</label>
          <div className="w-32">
            <MealTimeDropdown value={mealTime} onChange={setMealTime} />
          </div>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[9px] font-bold uppercase tracking-widest text-theme-text-tertiary mb-1">Search</label>
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Filter by name..."
            className="w-full border border-theme-text-primary/20 bg-theme-bg-secondary text-theme-text-primary px-3 py-2 text-sm font-mono focus:outline-none focus:border-theme-text-primary/50 hover:border-theme-text-primary/40 hover:bg-theme-bg-hover transition-all placeholder:text-theme-text-tertiary/40"
          />
        </div>
      </div>

      {/* Location category pills + sort controls */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {LOCATION_GROUPS.map(g => {
          const active = selectedGroups.has(g.label);
          return (
            <button key={g.label} type="button" onClick={() => toggleGroup(g.label)}
              className={`px-2.5 py-1 border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                active
                  ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-500'
                  : 'border-theme-text-primary/10 text-theme-text-tertiary/60 hover:border-theme-text-primary/30 hover:text-theme-text-secondary'
              }`}>
              {g.label} <span className="opacity-50">({g.locations.length})</span>
            </button>
          );
        })}
        <span className="text-theme-text-primary/10 mx-0.5">|</span>
        <button type="button" onClick={() => setIncludeBeverages(v => !v)}
          className={`px-2.5 py-1 border text-[10px] font-bold uppercase tracking-wider transition-colors ${
            includeBeverages
              ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-500'
              : 'border-theme-text-primary/10 text-theme-text-tertiary/60 hover:border-theme-text-primary/30 hover:text-theme-text-secondary'
          }`}>
          Beverages
        </button>
      </div>

      {/* Sort pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-[9px] uppercase tracking-widest text-theme-text-tertiary/50 mr-0.5">Sort</span>
        {SORT_FIELDS.map(sf => {
          const active = sortField === sf.key;
          return (
            <button key={sf.key} type="button" onClick={() => toggleSort(sf.key)}
              className={`px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                active
                  ? `border-current ${sf.color}`
                  : `border-theme-text-primary/10 ${sf.dimColor} hover:border-current`
              }`}>
              {sf.label}
              {active && (sortDir === 'desc' ? ' \u25BC' : ' \u25B2')}
            </button>
          );
        })}

        {/* Results count inline */}
        {!loading && selectedGroups.size > 0 && (
          <span className="text-[10px] text-theme-text-tertiary/50 font-mono ml-2">
            {sortedFoods.length} food{sortedFoods.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Empty state: no groups selected */}
      {selectedGroups.size === 0 && !loading && (
        <div className="py-20 text-center">
          <p className="text-sm text-theme-text-tertiary">Select a location category to browse foods.</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-0">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-theme-text-primary/5 animate-pulse">
              <div className="w-8 h-3 bg-theme-text-primary/8 rounded-sm" />
              <div className="flex-1 h-3 bg-theme-text-primary/8 rounded-sm" style={{ maxWidth: `${40 + Math.random() * 30}%` }} />
              <div className="w-20 h-3 bg-theme-text-primary/5 rounded-sm hidden sm:block" />
              <div className="w-16 h-3 bg-theme-text-primary/5 rounded-sm hidden md:block" />
              <div className="w-10 h-3 bg-theme-text-primary/5 rounded-sm" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="py-8 text-center text-red-400 text-sm">{error}</div>
      )}

      {/* Results table */}
      {!loading && selectedGroups.size > 0 && sortedFoods.length > 0 && (
        <div className="border-t border-theme-text-primary/10">
          {/* Table header */}
          <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-theme-text-tertiary/50 py-2 border-b border-theme-text-primary/10">
            <div className="w-10 shrink-0 text-center">#</div>
            <div className="flex-1 min-w-0">Food</div>
            <div className="w-28 shrink-0 hidden sm:block">Location</div>
            <div className="w-20 shrink-0 hidden md:block">Meal</div>
            {SORT_FIELDS.filter(sf => sf.key !== 'calories').map(sf => (
              <div key={sf.key}
                className={`w-12 shrink-0 text-right cursor-pointer select-none transition-colors hidden lg:block ${
                  sortField === sf.key ? sf.color : `${sf.dimColor} hover:${sf.color}`
                }`}
                onClick={() => toggleSort(sf.key)}>
                {sf.label}{sortField === sf.key ? (sortDir === 'desc' ? ' \u25BC' : ' \u25B2') : ''}
              </div>
            ))}
            <div className={`w-16 shrink-0 text-right cursor-pointer select-none transition-colors ${
                sortField === 'calories' ? 'text-yellow-500' : 'text-yellow-500/40 hover:text-yellow-500'
              }`}
              onClick={() => toggleSort('calories')}>
              Cal{sortField === 'calories' ? (sortDir === 'desc' ? ' \u25BC' : ' \u25B2') : ''}
            </div>
          </div>

          {/* Rows */}
          {visibleFoods.map((food, i) => {
            const rank = i + 1;
            const macros = food.macros || {};
            const rowKey = `${food.id}-${food.dining_court}-${food.name}`;
            const isExpanded = expandedId === rowKey;
            return (
              <div key={rowKey} className="border-b border-theme-text-primary/5 group">
                <div className="flex items-center cursor-pointer hover:bg-theme-bg-secondary/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : rowKey)}>
                  {/* Rank */}
                  <div className={`py-2.5 w-10 shrink-0 text-center font-mono tabular-nums text-sm ${
                    rank <= 3 ? 'text-yellow-500 font-bold' : 'text-theme-text-tertiary/50'
                  }`}>
                    {rank}
                  </div>
                  {/* Food name */}
                  <div className="py-2.5 flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                        className="shrink-0 text-theme-text-tertiary/40 transition-transform duration-200"
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        <polyline points="9 6 15 12 9 18" />
                      </svg>
                      <span className="truncate text-sm text-theme-text-primary/90 group-hover:text-theme-text-primary transition-colors">{food.name}</span>
                      {macros.is_vegetarian && (
                        <span className="shrink-0 text-[8px] font-bold border border-green-500/40 text-green-500/80 px-1 py-0 leading-tight">VG</span>
                      )}
                      {macros.is_vegan && (
                        <span className="shrink-0 text-[8px] font-bold border border-emerald-400/40 text-emerald-400/80 px-1 py-0 leading-tight">V</span>
                      )}
                    </div>
                    <span className="block sm:hidden text-[10px] text-theme-text-tertiary/50 capitalize mt-0.5 pl-[18px]">{food.dining_court} &middot; {food.meal_time}</span>
                  </div>
                  {/* Location */}
                  <div className="py-2 w-28 shrink-0 text-theme-text-tertiary/60 capitalize hidden sm:block whitespace-nowrap overflow-hidden text-ellipsis text-xs">{food.dining_court}</div>
                  {/* Meal */}
                  <div className="py-2 w-20 shrink-0 text-theme-text-tertiary/40 capitalize hidden md:block text-xs">{food.meal_time}</div>
                  {/* P C F — highlight active sort column */}
                  {[
                    { key: 'protein', val: macros.protein },
                    { key: 'carbs', val: macros.carbs },
                    { key: 'fats', val: macros.fats ?? macros.fat },
                  ].map(col => (
                    <div key={col.key} className={`py-2 text-right font-mono tabular-nums w-12 shrink-0 hidden lg:block text-xs ${
                      sortField === col.key ? (activeSortField?.color || 'text-theme-text-secondary') + ' font-bold' : 'text-theme-text-tertiary/40'
                    }`}>
                      {col.val != null ? Math.round(col.val) : '\u2014'}
                    </div>
                  ))}
                  {/* Cal */}
                  <div className={`py-2 text-right font-mono tabular-nums w-16 shrink-0 text-sm ${
                    sortField === 'calories' ? 'text-yellow-500 font-bold' : 'text-theme-text-secondary font-bold'
                  }`}>
                    {food.calories || '\u2014'}
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
                        <div className="text-lg font-bold tabular-nums">{macros.protein != null ? Number(macros.protein).toFixed(1) : '\u2014'}<span className="text-xs text-theme-text-tertiary">g</span></div>
                      </div>
                      <div className="border border-theme-text-primary/10 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Carbs</div>
                        <div className="text-lg font-bold tabular-nums">{macros.carbs != null ? Number(macros.carbs).toFixed(1) : '\u2014'}<span className="text-xs text-theme-text-tertiary">g</span></div>
                      </div>
                      <div className="border border-theme-text-primary/10 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Fat</div>
                        <div className="text-lg font-bold tabular-nums">{(macros.fats ?? macros.fat) != null ? Number(macros.fats ?? macros.fat).toFixed(1) : '\u2014'}<span className="text-xs text-theme-text-tertiary">g</span></div>
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
                            {n.val != null ? Number(n.val).toFixed(1) : '\u2014'}
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
              </div>
            );
          })}
          {hasMore && (
            <div className="py-6 text-center">
              <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                className="px-6 py-2 text-xs uppercase tracking-wider border border-theme-text-primary/20 text-theme-text-tertiary hover:bg-theme-bg-secondary hover:text-theme-text-primary hover:border-theme-text-primary/40 transition-colors font-mono">
                Show more ({sortedFoods.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {!loading && selectedGroups.size > 0 && sortedFoods.length === 0 && !error && (
        <div className="py-20 text-center">
          <p className="text-sm text-theme-text-tertiary">No foods found for these filters.</p>
          <p className="text-xs mt-2 text-theme-text-tertiary/50">Try selecting &ldquo;All&rdquo; for Meal, or enable more locations.</p>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-theme-text-primary/10 pt-8 mt-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-widest">
          <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
          <Link href="/compare" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Compare</Link>
          <Link href="/profile" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Profile</Link>
          <Link href="/custom-foods" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Custom Foods</Link>
          <Link href="/tools" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Tools</Link>
          <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
          <Link href="/changelog" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Changelog</Link>
          <Link href="/privacy" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Privacy</Link>
          <Link href="/admin" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Admin</Link>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-theme-text-tertiary/40">BoilerFuel · {new Date().getFullYear()}</span>
      </footer>

        </div>
      </div>
    </>
  );
}

DatabasePage.getLayout = (page) => page;
