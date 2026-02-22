import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { LOCATION_CATEGORIES, FOOD_CO_LOCATIONS } from '../utils/diningLocations';
import { useMeals } from '../context/MealContext';
import dynamic from 'next/dynamic';

const BarcodeScanner = dynamic(() => import('../components/BarcodeScanner'), { ssr: false });

const CHUNK_SIZE = 60; // items per render batch

// ── Smoother easing ──
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const TRANSITION_MS = 900; // cooldown for scroll-triggered transitions

// ── Custom black & white calendar picker ──
function CalendarPicker({ value, onChange, compact = false, hideIcon = false }) {
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

  const dayNames7 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const isToday = value === new Date().toISOString().slice(0, 10);
  const displayDate = value
    ? compact
      ? (isToday ? 'Today' : `${dayNames7[current.getDay()]} · ${monthNames[current.getMonth()]} ${current.getDate()}`)
      : `${monthNames[current.getMonth()]} ${current.getDate()}, ${current.getFullYear()}`
    : 'Select date';

  return (
    <div ref={ref} className="relative" data-calendar>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full border bg-theme-bg-secondary text-theme-text-primary text-left font-mono flex items-center hover:bg-theme-bg-hover transition-all ${
          compact ? 'px-2 py-1.5 border-theme-text-primary/30 text-sm gap-2' : 'p-2 border-theme-text-primary gap-3'
        } ${hideIcon ? 'justify-center' : 'justify-between'}`}>
        <span className={`whitespace-nowrap ${compact && isToday ? 'text-yellow-500/80 font-bold' : ''}`}>{displayDate}</span>
        {!hideIcon && (
          <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60 shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-72 max-w-[calc(100vw-2rem)] border border-theme-text-primary bg-theme-bg-primary shadow-lg">
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

// ── Custom grouped location dropdown with two top-level groups ──
function LocationDropdown({ value, onChange, availableLocations, retailLocations, compact = false }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null); // 'purdue' | 'foodco' | null
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filter HFS categories to only show locations that exist in DB
  const availSet = new Set((availableLocations || []).map(l => l.toLowerCase()));
  const filteredCategories = LOCATION_CATEGORIES.map(cat => ({
    ...cat,
    locations: cat.locations.filter(loc => availSet.has(loc.toLowerCase())),
  })).filter(cat => cat.locations.length > 0);

  // Merge static Food Co list with live data from DB
  const foodCoList = (retailLocations && retailLocations.length > 0)
    ? retailLocations
    : FOOD_CO_LOCATIONS.map(l => l.name);

  // Display text
  const displayText = value.type === 'all' ? 'All Locations'
    : value.type === 'all-purdue' ? 'All Purdue'
    : value.type === 'all-foodco' ? 'Purdue Food Co'
    : value.type === 'category' ? value.value
    : value.value;

  function select(newVal) {
    onChange(newVal);
    setOpen(false);
  }

  const isActive = (type, val) => value.type === type && value.value === val;

  function toggleGroup(group) {
    setExpanded(prev => prev === group ? null : group);
  }

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
        <div className="absolute z-50 mt-1 left-0 w-72 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto border border-theme-text-primary bg-theme-bg-primary shadow-lg"
          style={{ animation: `fadeInTooltip 0.15s ${EASE} both` }}>
          {/* All Locations */}
          <button type="button" onClick={() => select({ type: 'all', value: 'All' })}
            className={`w-full text-left px-3 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
              isActive('all', 'All') ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-hover text-theme-text-primary'
            }`}>
            All Locations
          </button>

          {/* ── All Purdue (HFS) collapsible group ── */}
          <div className="border-t border-theme-text-primary/20">
            <button type="button"
              onClick={() => toggleGroup('purdue')}
              className={`w-full text-left px-3 py-2.5 text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-between transition-colors ${
                (value.type === 'all-purdue' || (value.type === 'category' && LOCATION_CATEGORIES.some(c => c.label === value.value)) || (value.type === 'single' && availSet.has(value.value?.toLowerCase())))
                  ? 'bg-theme-text-primary/10 text-theme-text-primary'
                  : 'bg-theme-bg-tertiary/50 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-hover'
              }`}>
              <span>All Purdue</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-50"
                style={{ transform: expanded === 'purdue' ? 'rotate(180deg)' : 'rotate(0)', transition: `transform 0.2s ${EASE}` }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {expanded === 'purdue' && (
              <div>
                {/* Select all HFS locations */}
                <button type="button"
                  onClick={() => select({ type: 'all-purdue', value: 'All Purdue', locations: filteredCategories.flatMap(c => c.locations) })}
                  className={`w-full text-left px-5 py-1.5 text-sm font-bold transition-colors ${
                    isActive('all-purdue', 'All Purdue') ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-hover text-theme-text-primary'
                  }`}>
                  All Purdue Dining
                </button>

                {filteredCategories.map(cat => (
                  <div key={cat.label}>
                    <button type="button"
                      onClick={() => select({ type: 'category', value: cat.label, locations: cat.locations })}
                      className={`w-full text-left px-5 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                        isActive('category', cat.label)
                          ? 'bg-theme-text-primary text-theme-bg-primary'
                          : 'text-theme-text-tertiary hover:bg-theme-bg-hover hover:text-theme-text-secondary'
                      }`}>
                      {cat.label}
                    </button>
                    {cat.locations.map(loc => (
                      <button key={loc} type="button"
                        onClick={() => select({ type: 'single', value: loc })}
                        className={`w-full text-left px-8 py-1 text-sm transition-colors ${
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

          {/* ── Purdue Food Co collapsible group ── */}
          <div className="border-t border-theme-text-primary/20">
            <button type="button"
              onClick={() => toggleGroup('foodco')}
              className={`w-full text-left px-3 py-2.5 text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-between transition-colors ${
                (value.type === 'all-foodco' || (value.type === 'single' && foodCoList.some(n => n === value.value)))
                  ? 'bg-theme-text-primary/10 text-theme-text-primary'
                  : 'bg-theme-bg-tertiary/50 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-hover'
              }`}>
              <span>Purdue Food Co</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-50"
                style={{ transform: expanded === 'foodco' ? 'rotate(180deg)' : 'rotate(0)', transition: `transform 0.2s ${EASE}` }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {expanded === 'foodco' && (
              <div>
                {/* Select all Food Co locations */}
                <button type="button"
                  onClick={() => select({ type: 'all-foodco', value: 'Purdue Food Co', locations: foodCoList })}
                  className={`w-full text-left px-5 py-1.5 text-sm font-bold transition-colors ${
                    isActive('all-foodco', 'Purdue Food Co') ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-hover text-theme-text-primary'
                  }`}>
                  All Food Co
                </button>

                {foodCoList.map(name => (
                  <button key={name} type="button"
                    onClick={() => select({ type: 'single', value: name, source: 'foodco' })}
                    className={`w-full text-left px-8 py-1 text-sm transition-colors ${
                      isActive('single', name)
                        ? 'bg-theme-text-primary text-theme-bg-primary'
                        : 'hover:bg-theme-bg-hover text-theme-text-primary'
                    }`}>
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Beverage row (used in sidebar) ──
function BeverageRow({ food, getCount, selectedDate, handleAddMeal, removeMeal, highlight }) {
  const count = getCount(food.id, selectedDate);
  const macros = food.macros || {};
  return (
    <div className={`flex items-center gap-2 px-3 py-2 border-b border-theme-text-primary/5 hover:bg-theme-bg-secondary/50 transition-colors text-sm ${highlight ? 'bg-yellow-500/[0.03]' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="truncate text-theme-text-primary text-xs leading-tight">{food.name}</div>
        <div className="text-[10px] text-theme-text-tertiary tabular-nums mt-0.5">
          {food.calories} cal
          {macros.protein != null && <> · {macros.protein}p</>}
          {macros.carbs != null && <> · {macros.carbs}c</>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {count > 0 && (
          <span className="text-[9px] font-bold bg-theme-text-primary text-theme-bg-primary px-1 py-0.5 tabular-nums">
            {count}
          </span>
        )}
        <button
          onClick={(e) => handleAddMeal(food, e)}
          className="p-1 border border-theme-text-primary/20 text-theme-text-tertiary hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors"
          title="Add to log">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); removeMeal(food, selectedDate); }}
          disabled={count === 0}
          className={`p-1 border transition-colors ${count > 0 ? 'border-theme-text-primary/20 text-theme-text-tertiary hover:bg-theme-text-primary hover:text-theme-bg-primary' : 'border-theme-text-primary/10 text-theme-text-tertiary/20 cursor-not-allowed'}`}
          title="Remove from log">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>
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
      left: Math.min(pos.x + 12, (typeof window !== 'undefined' ? window.innerWidth - 240 : 600)),
      top: Math.min(pos.y - 10, (typeof window !== 'undefined' ? window.innerHeight - 180 : 400)),
      maxWidth: 'calc(100vw - 32px)',
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
  const router = useRouter();
  const { addMeal, removeMeal, getCount, isFavorite, toggleFavorite, dietaryPrefs, getWater, addWater, mealsByDate, goals, templates, saveTemplate, deleteTemplate, applyTemplate } = useMeals();
  // ── State ──
  const [location, setLocation] = useState({ type: 'all', value: 'All' });
  const [mealTime, setMealTime] = useState('All');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [foods, setFoods] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [retailLocations, setRetailLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('landing');
  const [calorieSort, setCalorieSort] = useState(null); // null | 'asc' | 'desc'
  const [hoveredFood, setHoveredFood] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [mealPickerFood, setMealPickerFood] = useState(null); // food waiting for meal selection
  const [mealPickerOptions, setMealPickerOptions] = useState(null); // restricted options for compound meal times
  const [infoFood, setInfoFood] = useState(null); // food for the ingredients/info modal
  const [searchText, setSearchText] = useState(''); // food search filter
  const [servingsInput, setServingsInput] = useState({}); // { [foodId]: number }
  const [showFilters, setShowFilters] = useState(false); // dietary/nutrition filter panel
  const [nutritionFilter, setNutritionFilter] = useState({ minProtein: '', maxCalories: '', vegetarian: false, vegan: false, allergenFree: '' });
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showProfileTooltip, setShowProfileTooltip] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const mealTimes = ['All', 'Breakfast', 'Brunch', 'Lunch', 'Late Lunch', 'Dinner'];
  const isLanding = view === 'landing';

  // ── Date navigation ──
  function prevDay() {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  }
  function nextDay() {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  }

  // ── Add meal handler (shows picker if mealTime is All) ──
  function handleAddMeal(food, e, servingsOverride) {
    if (e) e.stopPropagation();
    const servings = servingsOverride || servingsInput[food.id] || 1;
    if (mealTime !== 'All') {
      addMeal(food, mealTime.toLowerCase(), selectedDate, servings);
    } else if (food.meal_time && food.meal_time.toLowerCase() !== 'all') {
      const mt = food.meal_time.toLowerCase();
      // Compound meal times like "Breakfast/Lunch" → show picker with those options
      if (mt.includes('/')) {
        const parts = mt.split('/').map(p => p.trim().charAt(0).toUpperCase() + p.trim().slice(1));
        setMealPickerOptions(parts);
        setMealPickerFood(food);
      } else {
        addMeal(food, mt, selectedDate, servings);
      }
    } else {
      setMealPickerOptions(null);
      setMealPickerFood(food);
    }
  }

  // ── Refs ──
  const resultsRef = useRef(null);
  const searchInputRef = useRef(null);
  const transitioning = useRef(false);
  const scrollDeltaRef = useRef(0);
  const scrollTimeoutRef = useRef(null);
  const touchStartY = useRef(null);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    function onKeyDown(e) {
      // Escape: close expanded row
      if (e.key === 'Escape') {
        if (expandedId) { setExpandedId(null); return; }
        if (mealPickerFood) { setMealPickerFood(null); return; }
        if (infoFood) { setInfoFood(null); return; }
        if (showBarcodeScanner) { setShowBarcodeScanner(false); return; }
        if (showFilters) { setShowFilters(false); return; }
        if (showTemplates) { setShowTemplates(false); return; }
      }
      // '/': focus search box (only in results view, not when already typing)
      if (e.key === '/' && view === 'results' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expandedId, mealPickerFood, infoFood, showBarcodeScanner, showFilters, showTemplates, view]);

  // ── Responsive: track mobile ──
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Fetch available locations (HFS + retail) ──
  useEffect(() => {
    fetch('/api/dining-courts')
      .then(res => res.json())
      .then(courts => {
        if (Array.isArray(courts)) setAvailableLocations(courts);
      })
      .catch(err => console.error('Failed to load locations:', err));

    fetch('/api/retail-locations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRetailLocations(data.map(l => l.name));
      })
      .catch(() => {}); // silently fail — static list fallback in dropdown
  }, []);

  // ── Fetch foods (with abort to prevent stale responses) ──
  const abortRef = useRef(null);
  const fetchFoods = useCallback(async () => {
    // Cancel any in-flight request so stale responses never overwrite fresh ones
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (location.type === 'single') {
      params.set('dining_court', location.value);
    } else if (location.type === 'category' && location.locations) {
      params.set('dining_court', location.locations.join(','));
    } else if ((location.type === 'all-purdue' || location.type === 'all-foodco') && location.locations) {
      params.set('dining_court', location.locations.join(','));
    }
    if (mealTime !== 'All') params.set('meal_time', mealTime);
    if (selectedDate) params.set('date', selectedDate);
    const cacheKey = `bf_menu_${params.toString()}`;
    try {
      const res = await fetch(`/api/foods?${params.toString()}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      setFoods(items);
      // Cache for offline use
      try { localStorage.setItem(cacheKey, JSON.stringify(items)); } catch {}
    } catch (err) {
      if (err.name === 'AbortError') return; // superseded by a newer request
      // Try loading from cache on network failure
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setFoods(JSON.parse(cached));
          setError('Showing cached data (offline)');
          return;
        }
      } catch {}
      setError('Could not load foods.');
      setFoods([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [location, mealTime, selectedDate]);

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

  // ── Split beverages from regular foods + apply filters ──
  const { regularFoods, beverageFoods } = useMemo(() => {
    const regular = [];
    const bevs = [];
    for (const f of foods) {
      // Text search filter
      if (searchText && !f.name.toLowerCase().includes(searchText.toLowerCase())) continue;
      // Favorites filter
      if (showFavsOnly && !isFavorite(f.id)) continue;
      // Dietary filters
      const macros = f.macros || {};
      if (nutritionFilter.vegetarian && !macros.is_vegetarian) continue;
      if (nutritionFilter.vegan && !macros.is_vegan) continue;
      if (nutritionFilter.allergenFree) {
        const exclude = nutritionFilter.allergenFree.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
        const allergens = (macros.allergens || []).map(a => a.toLowerCase());
        if (exclude.some(e => allergens.some(a => a.includes(e)))) continue;
      }
      // Nutrition range filters
      if (nutritionFilter.minProtein && (parseFloat(macros.protein) || 0) < parseFloat(nutritionFilter.minProtein)) continue;
      if (nutritionFilter.maxCalories && f.calories > parseFloat(nutritionFilter.maxCalories)) continue;
      // Also apply global dietary prefs from context
      if (dietaryPrefs.vegetarian && !macros.is_vegetarian) continue;
      if (dietaryPrefs.vegan && !macros.is_vegan) continue;
      if (dietaryPrefs.excludeAllergens?.length > 0) {
        const allergens = (macros.allergens || []).map(a => a.toLowerCase());
        if (dietaryPrefs.excludeAllergens.some(e => allergens.some(a => a.includes(e.toLowerCase())))) continue;
      }

      if ((f.station || '').toLowerCase() === 'beverages') bevs.push(f);
      else regular.push(f);
    }
    return { regularFoods: regular, beverageFoods: bevs };
  }, [foods, searchText, showFavsOnly, isFavorite, nutritionFilter, dietaryPrefs]);

  // ── Recent beverages (logged before, across all dates) ──
  const recentBeverageIds = useMemo(() => {
    const freq = {};
    for (const [, dayMeals] of Object.entries(mealsByDate)) {
      for (const m of dayMeals) {
        if ((m.station || '').toLowerCase() === 'beverages' || (m.dining_court || '').toLowerCase() === 'beverages') {
          freq[m.id] = (freq[m.id] || 0) + 1;
        }
      }
    }
    // Sort by frequency, return top IDs
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [mealsByDate]);

  // ── Get collection components for a food item ──
  // Uses macros.components from the database (scraped via GraphQL v3 API)
  // Falls back to station-based grouping if no component data available
  const stationItemsMap = useMemo(() => {
    const map = new Map();
    for (const f of regularFoods) {
      const key = `${(f.dining_court || '').toLowerCase()}|${(f.station || '').toLowerCase()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(f);
    }
    return map;
  }, [regularFoods]);

  function getCollectionComponents(food) {
    const macros = food.macros || {};
    // Prefer component data from the database (scraped via GraphQL)
    if (macros.components && macros.components.length > 0) {
      return macros.components.map((c, idx) => ({
        id: `${food.id}-comp-${idx}`,
        name: c.name,
        calories: c.calories || 0,
        macros: {
          protein: c.protein || 0,
          carbs: c.carbs || 0,
          fats: c.fats || 0,
          fat: c.fats || 0,
          serving_size: c.serving_size || '1 serving',
          saturated_fat: c.saturated_fat || 0,
          cholesterol: c.cholesterol || 0,
          sodium: c.sodium || 0,
          fiber: c.fiber || 0,
          sugar: c.sugar || 0,
          added_sugar: c.added_sugar || 0,
          is_vegetarian: c.is_vegetarian || false,
          is_vegan: c.is_vegan || false,
          allergens: c.allergens || [],
          ingredients: c.ingredients || '',
        },
        dining_court: food.dining_court,
        station: food.station,
        meal_time: food.meal_time,
      }));
    }
    // Fallback: group by station (other items with nutrition in same station)
    const key = `${(food.dining_court || '').toLowerCase()}|${(food.station || '').toLowerCase()}`;
    const items = stationItemsMap.get(key) || [];
    return items.filter(f => f.id !== food.id && (f.calories > 0 || f.macros?.protein || f.macros?.carbs || f.macros?.fats || f.macros?.fat));
  }

  // ── Sorted + grouped foods (excluding beverages) ──
  const sortedFoods = useMemo(() => {
    if (!calorieSort) return regularFoods;
    return [...regularFoods].sort((a, b) => calorieSort === 'asc' ? a.calories - b.calories : b.calories - a.calories);
  }, [regularFoods, calorieSort]);

  // Group by dining court → station (for multi-court views), or just station (single court)
  // "By Request" station is always placed last within each court
  const groupedFoods = useMemo(() => {
    const showCourtHeaders = location.type !== 'single';

    // Build a nested structure: court → station → foods[]
    const courtMap = new Map();
    for (const food of sortedFoods) {
      const court = food.dining_court || 'Unknown';
      const station = food.station || 'General';
      if (!courtMap.has(court)) courtMap.set(court, new Map());
      const stationMap = courtMap.get(court);
      if (!stationMap.has(station)) stationMap.set(station, []);
      stationMap.get(station).push(food);
    }

    // Sort stations within each court: "By Request" goes last
    const isByRequest = (name) => name.toLowerCase().replace(/\s+/g, '') === 'byrequest';
    const groups = [];
    for (const [court, stationMap] of courtMap) {
      if (showCourtHeaders) groups.push({ type: 'court-header', label: court });
      const stations = [...stationMap.entries()].sort((a, b) => {
        const aLast = isByRequest(a[0]) ? 1 : 0;
        const bLast = isByRequest(b[0]) ? 1 : 0;
        return aLast - bLast;
      });
      for (const [station, foods] of stations) {
        groups.push({ type: 'station-header', label: station, court });
        for (const food of foods) {
          groups.push({ type: 'food', food });
        }
      }
    }
    return groups;
  }, [sortedFoods, location.type]);

  // ── Calorie sort toggle ──
  function toggleCalorieSort() {
    setCalorieSort(prev => prev === null ? 'asc' : prev === 'asc' ? 'desc' : null);
  }

  // ── Tooltip handlers (RAF-throttled, disabled on touch devices) ──
  const rafRef = useRef(null);
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  function onFoodMouseEnter(food, e) {
    if (isTouchDevice) return;
    setHoveredFood(food);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }
  function onFoodMouseMove(e) {
    if (isTouchDevice) return;
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

  // ── Selected date totals (for profile tooltip) ──
  const selectedDateTotals = useMemo(() => {
    const dayMeals = mealsByDate[selectedDate] || [];
    return dayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (parseFloat(m.macros?.protein) || 0),
        carbs: acc.carbs + (parseFloat(m.macros?.carbs) || 0),
        fat: acc.fat + (parseFloat(m.macros?.fats || m.macros?.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [mealsByDate, selectedDate]);

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

  // ── Progressive rendering: show items in chunks ──
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  // Reset visible count when foods change
  useEffect(() => { setVisibleCount(CHUNK_SIZE); }, [foods]);
  const visibleGroups = useMemo(() => groupedFoods.slice(0, visibleCount), [groupedFoods, visibleCount]);
  const hasMore = visibleCount < groupedFoods.length;

  // Count food rows
  let rowIndex = 0;

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono"
         style={{ position: 'relative', overflow: 'hidden', maxWidth: '100vw' }}>
      <Head>
        <title>BoilerFuel - Dining Menu</title>
      </Head>

      {/* ── Calorie progress bar — thin line at very top ── */}
      {(() => {
        const pct = Math.min((selectedDateTotals.calories / (goals?.calories || 2000)) * 100, 100);
        const over = selectedDateTotals.calories > (goals?.calories || 2000);
        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 100,
            background: 'rgba(var(--color-text-primary), 0.06)',
            transition: `opacity 0.4s ${EASE}`,
            opacity: isLanding ? 0 : 1,
            pointerEvents: 'none',
          }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: over ? 'rgb(239 68 68)' : selectedDateTotals.calories > 0 ? 'rgb(234 179 8)' : 'transparent',
              transition: `width 0.6s ${EASE}, background 0.3s`,
            }} />
          </div>
        );
      })()}

      {/* ── Back arrow ── */}
      <button onClick={handleBack}
        className="text-theme-text-tertiary hover:text-theme-text-primary"
        style={{
          position: 'fixed', top: isMobile ? 12 : 16, left: isMobile ? 12 : 24, zIndex: 30,
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
        onClick={() => { if (!isLanding) handleBack(); }}
        style={{
          position: 'fixed', zIndex: 20, whiteSpace: 'nowrap', lineHeight: 1.1,
          willChange: 'transform, opacity',
          cursor: isLanding ? 'default' : 'pointer',
          top: 0, left: 0,
          transition: `transform 0.85s ${EASE}, font-size 0.7s ${EASE}, letter-spacing 0.7s ${EASE}`,
          transform: isLanding
            ? `translate(calc(50vw - 50%), ${isMobile ? '18vh' : '35vh'})`
            : isMobile ? 'translate(38px, 12px)' : 'translate(64px, 16px)',
          fontSize: isLanding ? 'clamp(1.75rem, 5vw, 3.5rem)' : isMobile ? '0.85rem' : '1.25rem',
          letterSpacing: isLanding ? '0.25em' : '0.15em',
        }}>
        Boiler<span style={{ color: 'rgb(var(--color-accent-primary))' }}>Fuel</span>
      </h1>

      {/* ── Subtitle — fades out ── */}
      <p className="text-theme-text-tertiary"
        style={{
          position: 'fixed', zIndex: 20,
          top: isMobile ? 'calc(18vh + clamp(2rem, 5vw, 3.5rem))' : 'calc(35vh + clamp(2.5rem, 5.5vw, 4rem))',
          left: '50%', transform: 'translateX(-50%)',
          transition: `opacity 0.4s ${EASE}`,
          opacity: isLanding ? 1 : 0,
          pointerEvents: 'none',
          fontSize: isMobile ? '0.65rem' : '0.875rem', letterSpacing: '0.15em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
        Purdue Dining Court Menus
      </p>

      {/* ── Filters — slide from center to top-right (GPU-composited) ── */}
      <div style={{
        position: 'fixed', zIndex: 40,
        display: 'flex',
        alignItems: isLanding && isMobile ? 'stretch' : 'flex-end',
        flexDirection: isLanding && isMobile ? 'column' : 'row',
        willChange: 'transform',
        top: 0,
        ...(isLanding ? { right: 0 } : isMobile ? { left: 0, right: 0, paddingLeft: 12, paddingRight: 12 } : { right: 0 }),
        transition: `transform 0.85s ${EASE}, gap 0.6s ${EASE}`,
        transform: isLanding
          ? isMobile
            ? 'translate(calc(-50vw + 50%), 34vh)'
            : 'translate(calc(-50vw + 50%), 50vh)'
          : isMobile
            ? 'translate(0, 44px)'
            : 'translate(-72px, 13px)',
        gap: isLanding ? (isMobile ? 10 : 16) : (isMobile ? 6 : 10),
        justifyContent: !isLanding && isMobile ? 'space-between' : undefined,
      }}>
        <div style={{ flex: !isLanding && isMobile ? '1 1 0' : undefined, width: isLanding ? (isMobile ? 220 : 180) : (isMobile ? undefined : 150), transition: `width 0.7s ${EASE}` }}>
          <label style={labelStyle} className="text-theme-text-secondary">Date</label>
          {isLanding ? (
            <CalendarPicker value={selectedDate} onChange={setSelectedDate} compact={false} />
          ) : (
            <div className="flex items-stretch gap-0.5">
              <button onClick={prevDay} className="border border-theme-text-primary/30 px-1.5 text-sm font-bold text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text-primary transition-colors">&#8249;</button>
              <div className="flex-1 min-w-0"><CalendarPicker value={selectedDate} onChange={setSelectedDate} compact={true} hideIcon={true} /></div>
              <button onClick={nextDay} className="border border-theme-text-primary/30 px-1.5 text-sm font-bold text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text-primary transition-colors">&#8250;</button>
              {selectedDate !== new Date().toISOString().slice(0, 10) && (
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
                  className="border border-yellow-500/40 px-1.5 text-[9px] font-bold text-yellow-500/70 hover:bg-yellow-500/10 hover:text-yellow-500 transition-colors uppercase tracking-wide whitespace-nowrap"
                  title="Jump to today">
                  Today
                </button>
              )}
            </div>
          )}
        </div>
        <div style={{ flex: !isLanding && isMobile ? '1 1 0' : undefined, width: isLanding ? (isMobile ? 220 : 200) : (isMobile ? undefined : 170), transition: `width 0.7s ${EASE}` }}>
          <label style={labelStyle} className="text-theme-text-secondary">Location</label>
          <LocationDropdown value={location} onChange={setLocation} availableLocations={availableLocations} retailLocations={retailLocations} compact={!isLanding} />
        </div>
        <div style={{ flex: !isLanding && isMobile ? '1 1 0' : undefined, width: isLanding ? (isMobile ? 220 : 180) : (isMobile ? undefined : 130), transition: `width 0.7s ${EASE}` }}>
          <label style={labelStyle} className="text-theme-text-secondary">Meal Time</label>
          <select value={mealTime} onChange={(e) => setMealTime(e.target.value)}
            className={`border bg-theme-bg-secondary text-theme-text-primary focus:border-theme-text-primary ${
              isLanding ? 'border-theme-text-primary' : 'border-theme-text-primary/30'
            }`}
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
          top: isMobile ? '72vh' : '64vh', left: '50%', transform: 'translateX(-50%)',
          transition: `opacity 0.4s ${EASE}`,
          opacity: isLanding ? 1 : 0,
          pointerEvents: isLanding ? 'auto' : 'none',
          padding: isMobile ? '10px 32px' : '12px 40px',
          letterSpacing: '0.2em', fontSize: isMobile ? '0.8rem' : '0.875rem',
          background: 'transparent', cursor: 'pointer',
        }}>
        View Menu
      </button>

      {/* ── Scroll hint ── */}
      <div style={{
        position: 'fixed', zIndex: 20,
        top: isMobile ? '80vh' : '73vh', left: '50%',
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
        top: isMobile ? '88vh' : '82vh', left: '50%', transform: 'translateX(-50%)',
        transition: `opacity 0.4s ${EASE}`,
        opacity: isLanding ? 0.25 : 0,
        pointerEvents: isLanding ? 'auto' : 'none',
      }}>
        <Link href="/admin" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary"
          style={{ transition: 'color 0.2s' }}>
          Admin
        </Link>
      </div>

      {/* ── Profile icon — always visible, top-right ── */}
      <div
        onClick={() => router.push('/profile')}
        onMouseEnter={() => !isTouchDevice && setShowProfileTooltip(true)}
        onMouseLeave={() => setShowProfileTooltip(false)}
        title="Profile"
        className="group cursor-pointer"
        style={{
          position: 'fixed', zIndex: 50,
          willChange: 'transform, opacity',
          transition: `top 0.5s ${EASE}, right 0.5s ${EASE}, opacity 0.4s ${EASE}`,
          top: isLanding ? (isMobile ? 16 : 24) : (isMobile ? 8 : 12),
          right: isMobile ? 12 : 24,
          opacity: 1,
        }}>
        <div className={`flex items-center justify-center border text-theme-text-primary hover:bg-theme-bg-hover transition-all ${
          isLanding ? 'border-theme-text-primary/30 bg-transparent' : 'border-theme-text-primary bg-theme-bg-secondary'
        }`}
          style={{ width: 36, height: 36 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
          </svg>
        </div>
        {showProfileTooltip && (
          <div className="absolute right-0 top-full mt-1.5 w-44 border border-theme-text-primary/20 bg-theme-bg-secondary shadow-lg p-3 font-mono pointer-events-none"
            style={{ animation: `fadeInTooltip 0.15s ${EASE} both` }}>
            <div className="text-[9px] uppercase tracking-widest text-theme-text-tertiary mb-2">{dateLabel}</div>
            {selectedDateTotals.calories > 0 ? (
              <>
                <div className="text-2xl font-bold tabular-nums leading-none">{selectedDateTotals.calories}</div>
                <div className="text-[9px] text-theme-text-tertiary mb-2">calories</div>
                <div className="flex gap-2 text-[10px] tabular-nums">
                  <div><span className="font-bold">{Math.round(selectedDateTotals.protein)}</span><span className="text-theme-text-tertiary">g P</span></div>
                  <div><span className="font-bold">{Math.round(selectedDateTotals.carbs)}</span><span className="text-theme-text-tertiary">g C</span></div>
                  <div><span className="font-bold">{Math.round(selectedDateTotals.fat)}</span><span className="text-theme-text-tertiary">g F</span></div>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums leading-none text-theme-text-tertiary/40">0</div>
                <div className="text-[9px] text-theme-text-tertiary/60 mb-1">calories logged</div>
                <div className="text-[9px] text-theme-text-tertiary/40 italic">No meals tracked yet</div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Header divider line ── */}
      <div style={{
        position: 'fixed', top: isMobile ? 82 : 52, left: 0, right: 0, height: 1, zIndex: 15,
        transition: `opacity 0.5s ${EASE}`,
        opacity: isLanding ? 0 : 0.1,
        background: 'currentColor',
      }} />

      {/* ── Results table area ── */}
      <div ref={resultsRef}
        style={{
          position: 'fixed', top: isMobile ? 83 : 53, left: 0, right: 0, bottom: 0, zIndex: 10,
          overflowY: 'auto', overflowX: 'hidden',
          willChange: 'opacity',
          transition: `opacity 0.5s ${EASE} ${isLanding ? '0s' : '0.2s'}, visibility 0s ${isLanding ? '0.5s' : '0s'}`,
          opacity: isLanding ? 0 : 1,
          visibility: isLanding ? 'hidden' : 'visible',
          pointerEvents: isLanding ? 'none' : 'auto',
        }}>
        <main className={`px-4 sm:px-6 md:px-12 lg:px-20 py-6 sm:py-8 ${selectedDateTotals.calories > 0 ? 'pb-16' : ''}`}>
          {error && (
            <div className="mb-6 p-4 border border-red-500/50 text-red-400 text-sm">{error}</div>
          )}

          {!loading && !isLanding && (
            <>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-theme-text-primary/10">
              <span className="text-xs uppercase tracking-widest text-theme-text-tertiary">
                <span className="text-yellow-500/80 font-bold">{regularFoods.length + beverageFoods.length}</span> item{regularFoods.length + beverageFoods.length !== 1 ? 's' : ''}
                {searchText && <> matching &ldquo;{searchText}&rdquo;</>}
              </span>
              <div className="flex items-center gap-3">
                {/* Stats link */}
                <Link href="/stats" className="text-[10px] uppercase tracking-widest text-yellow-500/70 hover:text-yellow-500 transition-colors">
                  Stats
                </Link>
              </div>
            </div>

            {/* Search + filter bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex-1 min-w-[140px] relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Search foods..."
                  className="w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-1.5 text-xs focus:border-theme-text-primary focus:outline-none transition-colors pl-8"
                />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-text-tertiary">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {searchText && (
                  <button onClick={() => setSearchText('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-text-tertiary hover:text-theme-text-primary text-xs">&times;</button>
                )}
              </div>
              <button
                onClick={() => setShowFavsOnly(f => !f)}
                className={`px-2 py-1.5 border text-xs transition-colors ${showFavsOnly ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 'border-theme-text-primary/20 text-theme-text-tertiary hover:text-theme-text-primary'}`}
                title="Show favorites only"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill={showFavsOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
              <button
                onClick={() => setShowFilters(f => !f)}
                className={`px-2.5 py-1.5 border text-[10px] uppercase tracking-wider font-bold transition-colors ${showFilters ? 'border-theme-text-primary text-theme-text-primary' : 'border-theme-text-primary/20 text-theme-text-tertiary hover:text-theme-text-primary'}`}
              >
                Filters
              </button>
              <button
                onClick={() => setShowTemplates(f => !f)}
                className={`px-2.5 py-1.5 border text-[10px] uppercase tracking-wider font-bold transition-colors flex items-center gap-1 ${showTemplates ? 'border-theme-text-primary text-theme-text-primary' : 'border-theme-text-primary/20 text-theme-text-tertiary hover:text-theme-text-primary'}`}
                title="Meal templates"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Tmpl{templates?.length > 0 ? ` (${templates.length})` : ''}
              </button>
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="px-2 py-1.5 border border-theme-text-primary/20 text-theme-text-tertiary hover:text-theme-text-primary hover:border-theme-text-primary/40 transition-colors"
                title="Scan barcode to look up nutrition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="1" /><line x1="6" y1="8" x2="6" y2="16" /><line x1="9" y1="8" x2="9" y2="16" strokeWidth="1" /><line x1="11" y1="8" x2="11" y2="16" /><line x1="14" y1="8" x2="14" y2="16" strokeWidth="1" /><line x1="16" y1="8" x2="16" y2="16" /><line x1="18" y1="8" x2="18" y2="16" strokeWidth="1" />
                </svg>
              </button>
            </div>

            {/* Templates panel */}
            {showTemplates && (
              <div className="mb-4 p-3 border border-theme-text-primary/15 bg-theme-bg-secondary/30"
                style={{ animation: `fadeInRow 0.2s ${EASE} both` }}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-theme-text-tertiary mb-3">Meal Templates</div>
                {/* Save current day as template */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const dayMeals = mealsByDate[selectedDate] || [];
                        if (!templateName.trim() || dayMeals.length === 0) return;
                        saveTemplate(templateName.trim(), dayMeals);
                        setTemplateName('');
                      }
                    }}
                    placeholder="Name for today's meals..."
                    className="flex-1 min-w-0 border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-2 py-1 text-xs font-mono focus:border-theme-text-primary focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const dayMeals = mealsByDate[selectedDate] || [];
                      if (!templateName.trim() || dayMeals.length === 0) return;
                      saveTemplate(templateName.trim(), dayMeals);
                      setTemplateName('');
                    }}
                    disabled={!templateName.trim() || (mealsByDate[selectedDate] || []).length === 0}
                    className="shrink-0 px-3 py-1 border text-[10px] uppercase tracking-wider font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-theme-text-primary/30 text-theme-text-secondary hover:bg-theme-text-primary hover:text-theme-bg-primary"
                    title={(mealsByDate[selectedDate] || []).length === 0 ? 'No meals logged for this date' : 'Save as template'}
                  >
                    Save day
                  </button>
                </div>
                {/* Template list */}
                {!templates || templates.length === 0 ? (
                  <div className="text-xs text-theme-text-tertiary/60 italic py-1">No templates saved yet. Log meals then save them as a template.</div>
                ) : (
                  <div className="space-y-1.5">
                    {templates.map(t => (
                      <div key={t.id} className="flex items-center gap-2 text-xs border border-theme-text-primary/8 px-2.5 py-2 bg-theme-bg-primary/30">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-theme-text-primary truncate">{t.name}</div>
                          <div className="text-[10px] text-theme-text-tertiary tabular-nums">{t.foods.length} item{t.foods.length !== 1 ? 's' : ''} &middot; {t.foods.reduce((s, f) => s + (f.calories || 0), 0)} cal</div>
                        </div>
                        <button
                          onClick={() => applyTemplate(t, selectedDate)}
                          className="shrink-0 px-2 py-0.5 border border-theme-text-primary/30 text-[10px] uppercase tracking-wider text-theme-text-secondary hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors">
                          Apply
                        </button>
                        <button
                          onClick={() => deleteTemplate(t.id)}
                          className="shrink-0 px-1.5 py-0.5 border border-red-500/20 text-red-500/50 hover:border-red-500/60 hover:text-red-500 transition-colors text-sm leading-none"
                          title="Delete template">
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Filter panel */}
            {showFilters && (
              <div className="mb-4 p-3 border border-theme-text-primary/15 bg-theme-bg-secondary/30 space-y-3"
                style={{ animation: `fadeInRow 0.2s ${EASE} both` }}>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={nutritionFilter.vegetarian}
                      onChange={e => setNutritionFilter(p => ({ ...p, vegetarian: e.target.checked }))}
                      className="accent-green-500" />
                    <span className="text-green-500 font-bold">VG</span> Vegetarian
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" checked={nutritionFilter.vegan}
                      onChange={e => setNutritionFilter(p => ({ ...p, vegan: e.target.checked }))}
                      className="accent-emerald-400" />
                    <span className="text-emerald-400 font-bold">V</span> Vegan
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text-tertiary whitespace-nowrap">Min Protein</label>
                    <input type="number" min="0" value={nutritionFilter.minProtein}
                      onChange={e => setNutritionFilter(p => ({ ...p, minProtein: e.target.value }))}
                      placeholder="0"
                      className="w-20 border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-2 py-1 text-xs font-mono focus:outline-none" />
                    <span className="text-[10px] text-theme-text-tertiary">g</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text-tertiary whitespace-nowrap">Max Calories</label>
                    <input type="number" min="0" value={nutritionFilter.maxCalories}
                      onChange={e => setNutritionFilter(p => ({ ...p, maxCalories: e.target.value }))}
                      placeholder="any"
                      className="w-20 border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-2 py-1 text-xs font-mono focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-theme-text-tertiary whitespace-nowrap">Exclude allergens</label>
                    <input type="text" value={nutritionFilter.allergenFree}
                      onChange={e => setNutritionFilter(p => ({ ...p, allergenFree: e.target.value }))}
                      placeholder="e.g. gluten, eggs"
                      className="w-32 border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-2 py-1 text-xs focus:outline-none" />
                  </div>
                </div>
                {(nutritionFilter.vegetarian || nutritionFilter.vegan || nutritionFilter.minProtein || nutritionFilter.maxCalories || nutritionFilter.allergenFree) && (
                  <button onClick={() => setNutritionFilter({ minProtein: '', maxCalories: '', vegetarian: false, vegan: false, allergenFree: '' })}
                    className="text-[10px] uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
            </>
          )}

          <div className={`${beverageFoods.length > 0 ? 'xl:flex xl:gap-6' : ''}`}>
          {/* ── Main food table ── */}
          <div className="flex-1 min-w-0">
          <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-theme-text-primary/20">
                <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary">Food Item</th>
                <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary hidden sm:table-cell w-36">Location</th>
                <th className="py-3 font-bold uppercase text-xs tracking-wider text-theme-text-secondary hidden md:table-cell w-28">Meal</th>
                <th className="py-3 font-bold uppercase text-xs tracking-wider text-yellow-500/70 text-right cursor-pointer select-none hover:text-yellow-500 transition-colors w-16"
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
              ) : visibleGroups.length > 0 ? (
                <>
                {visibleGroups.map((item, i) => {
                  if (item.type === 'court-header') {
                    return (
                      <tr key={`court-${item.label}-${i}`}>
                        <td colSpan={4} className="pt-6 pb-2 px-0"
                          style={i < 20 ? { animation: `slideInStation 0.3s ${EASE} ${Math.min(i * 0.015, 0.25)}s both` } : undefined}>
                          <div className="text-sm font-bold uppercase tracking-widest text-theme-text-primary border-b-2 border-yellow-500/30 pb-1">
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
                          style={i < 20 ? { animation: `slideInStation 0.3s ${EASE} ${Math.min(i * 0.015, 0.25)}s both` } : undefined}>
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
                  const isExpanded = expandedId === food.id;
                  const count = getCount(food.id, selectedDate);
                  const macros = food.macros || {};
                  const noNutrition = food.calories === 0 && !macros.protein && !macros.carbs && !(macros.fats || macros.fat);
                  // Estimate calories from component data for BYO items — sum all non-zero components
                  const estimatedCal = noNutrition ? (() => {
                    const comps = (macros.components || []).filter(c => c.calories > 0);
                    if (comps.length === 0) return null;
                    return comps.reduce((s, c) => s + c.calories, 0);
                  })() : null;
                  const fav = isFavorite(food.id);
                  return (
                    <tr key={food.id}
                      className={`border-b border-theme-text-primary/5 transition-colors group ${fav ? 'bg-yellow-500/[0.03]' : ''}`}
                      style={ri < 20 ? { animation: `fadeInRow 0.3s ${EASE} ${Math.min(ri * 0.02, 0.3)}s both` } : undefined}>
                      <td colSpan={4} className="p-0">
                        {/* Clickable summary row — hover shows tooltip, click expands */}
                        <div className="flex items-center cursor-pointer hover:bg-theme-bg-secondary/50 transition-colors overflow-hidden"
                          onClick={() => setExpandedId(isExpanded ? null : food.id)}
                          onMouseEnter={(e) => { if (!isExpanded) onFoodMouseEnter(food, e); }}
                          onMouseMove={(e) => { if (!isExpanded) onFoodMouseMove(e); }}
                          onMouseLeave={onFoodMouseLeave}>
                          <div className="py-3 pr-4 flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                                className="shrink-0 text-theme-text-tertiary transition-transform duration-200"
                                style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                <polyline points="9 6 15 12 9 18" />
                              </svg>
                              {fav && <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" className="shrink-0 text-yellow-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                              <span className="group-hover:text-theme-text-primary transition-colors truncate">{food.name}</span>
                              {/* Dietary tag icons */}
                              {macros.is_vegetarian && (
                                <span className="shrink-0 text-[9px] font-bold border border-green-500/60 text-green-500 px-1 py-0 rounded-sm leading-tight" title="Vegetarian">VG</span>
                              )}
                              {macros.is_vegan && (
                                <span className="shrink-0 text-[9px] font-bold border border-emerald-400/60 text-emerald-400 px-1 py-0 rounded-sm leading-tight" title="Vegan">V</span>
                              )}
                              {macros.allergens && macros.allergens.length > 0 && (
                                <span className="shrink-0 text-[9px] text-theme-text-tertiary/60 hidden sm:inline" title={macros.allergens.join(', ')}>
                                  {macros.allergens.slice(0, 3).map(a => a.replace('Tree Nuts', 'Nuts').replace('Shellfish', 'Shell')).join(' · ')}{macros.allergens.length > 3 ? ' …' : ''}
                                </span>
                              )}
                              {noNutrition && getCollectionComponents(food).length > 0 && (
                                <span className="shrink-0 text-[9px] font-bold border border-theme-text-primary/40 text-theme-text-secondary px-1 py-0 rounded-sm leading-tight" title="Click to see components">Build Your Own</span>
                              )}
                              {noNutrition && getCollectionComponents(food).length === 0 && (
                                <span className="shrink-0 text-[9px] font-bold border border-amber-500/50 text-amber-500/80 px-1 py-0 rounded-sm leading-tight" title="Nutrition data not available from Purdue">N/A</span>
                              )}
                              {count > 0 && (
                                <span className="shrink-0 text-[10px] font-bold bg-theme-text-primary text-theme-bg-primary px-1.5 py-0.5 tabular-nums">
                                  {count}
                                </span>
                              )}
                            </div>
                            <span className="block sm:hidden text-xs text-theme-text-tertiary capitalize mt-0.5 pl-[18px]">{food.dining_court} &middot; {food.meal_time}</span>
                          </div>
                          <div className="py-3 px-4 text-theme-text-secondary capitalize hidden sm:block w-36 shrink-0">{food.dining_court}</div>
                          <div className="py-3 px-4 text-theme-text-tertiary capitalize hidden md:block w-28 shrink-0">{food.meal_time}</div>
                          <div className={`py-3 pl-4 text-right font-mono tabular-nums w-16 shrink-0 ${noNutrition && !estimatedCal ? 'text-amber-500/60' : noNutrition && estimatedCal ? 'text-theme-text-tertiary' : 'text-theme-text-secondary'}`}>
                            {noNutrition ? (estimatedCal ? `~${estimatedCal}` : 'N/A') : (food.calories || '—')}
                          </div>
                        </div>

                        {/* Expanded detail panel */}
                        {isExpanded && (() => {
                          const components = noNutrition ? getCollectionComponents(food) : [];
                          const isCollection = noNutrition && components.length > 0;
                          return (
                          <div className="border-t border-theme-text-primary/10 bg-theme-bg-secondary/30"
                            style={{ animation: `fadeInRow 0.2s ${EASE} both` }}>

                            {isCollection ? (
                              /* ── Collection view: show station components ── */
                              <div className="px-4 sm:px-6 py-4">
                                <div className="text-xs font-bold uppercase tracking-wider text-theme-text-tertiary mb-3">
                                  Build Your Own &middot; {components.length} item{components.length !== 1 ? 's' : ''}
                                </div>
                                <div className="space-y-1">
                                  {components.map(comp => {
                                    const cm = comp.macros || {};
                                    const compCount = getCount(comp.id, selectedDate);
                                    return (
                                      <div key={comp.id} className="flex items-center gap-2 px-2 sm:px-3 py-2 sm:py-2.5 border border-theme-text-primary/5 hover:bg-theme-bg-secondary/50 transition-colors">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-xs sm:text-sm truncate">{comp.name}</span>
                                            {cm.is_vegetarian && (
                                              <span className="shrink-0 text-[9px] font-bold border border-green-500/60 text-green-500 px-1 py-0 rounded-sm leading-tight">VG</span>
                                            )}
                                            {cm.is_vegan && (
                                              <span className="shrink-0 text-[9px] font-bold border border-emerald-400/60 text-emerald-400 px-1 py-0 rounded-sm leading-tight">V</span>
                                            )}
                                            {compCount > 0 && (
                                              <span className="shrink-0 text-[10px] font-bold bg-theme-text-primary text-theme-bg-primary px-1.5 py-0.5 tabular-nums">{compCount}</span>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-theme-text-tertiary tabular-nums mt-0.5">
                                            {comp.calories} cal
                                            {cm.protein != null && <> &middot; {cm.protein}g P</>}
                                            {cm.carbs != null && <> &middot; {cm.carbs}g C</>}
                                            {(cm.fats ?? cm.fat) != null && <> &middot; {cm.fats ?? cm.fat}g F</>}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={(e) => handleAddMeal(comp, e)}
                                            className="p-1.5 sm:p-2 border border-theme-text-primary/30 text-theme-text-secondary hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors"
                                            title="Add to log">
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); removeMeal(comp, selectedDate); }}
                                            disabled={compCount === 0}
                                            className={`p-1.5 sm:p-2 border transition-colors ${compCount > 0 ? 'border-theme-text-primary/30 text-theme-text-secondary hover:bg-theme-text-primary hover:text-theme-bg-primary' : 'border-theme-text-primary/10 text-theme-text-tertiary/20 cursor-not-allowed'}`}
                                            title="Remove from log">
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                {(() => {
                                  const compsWithCal = components.filter(c => c.calories > 0);
                                  if (compsWithCal.length === 0) return null;
                                  const total = compsWithCal.reduce((s, c) => s + c.calories, 0);
                                  return (
                                    <div className="mt-3 pt-3 border-t border-theme-text-primary/10 flex items-center justify-between gap-3">
                                      <div>
                                        <span className="text-xs font-bold uppercase tracking-wider">Est. full meal: </span>
                                        <span className="text-xs font-mono font-bold tabular-nums">{total} cal</span>
                                      </div>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); compsWithCal.forEach(c => addMeal(c, food.meal_time?.toLowerCase() || mealTime.toLowerCase(), selectedDate)); }}
                                        className="shrink-0 text-[10px] border border-theme-text-primary/30 px-2.5 py-1.5 font-bold uppercase tracking-wider hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors whitespace-nowrap">
                                        Add all
                                      </button>
                                    </div>
                                  );
                                })()}
                                <div className="mt-2 text-[10px] text-theme-text-tertiary/60">
                                  Add individual items above or use Add all to log the full combo.
                                </div>
                              </div>
                            ) : (
                              /* ── Normal item view ── */
                              <>
                            {noNutrition && (
                              <div className="px-4 sm:px-6 pt-4 pb-2">
                                <div className="border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                                  <div className="text-xs font-bold uppercase tracking-wider text-amber-500/80 mb-1">Nutrition Data Not Available</div>
                                  <p className="text-xs text-theme-text-tertiary">Purdue did not provide nutrition information for this item. Calorie and macro values may be inaccurate or missing.</p>
                                </div>
                              </div>
                            )}
                            <div className="px-4 sm:px-6 py-4">
                              {/* Main macros - 2x2 on mobile, 4-col on sm+ */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                                <div className="border border-theme-text-primary/10 px-3 py-2">
                                  <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Calories</div>
                                  <div className={`text-lg font-bold tabular-nums ${noNutrition ? 'text-amber-500/60' : ''}`}>{noNutrition ? 'N/A' : food.calories}</div>
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

                              {/* Secondary nutrients - clean 3-col on mobile, 6-col on sm+ */}
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

                              {/* Tags + Info row */}
                              <div className="flex items-center flex-wrap gap-1.5 mt-3">
                                {macros.is_vegan && (
                                  <span className="text-[10px] font-bold border border-emerald-400/50 text-emerald-400 px-2 py-0.5 rounded-sm">Vegan</span>
                                )}
                                {macros.is_vegetarian && !macros.is_vegan && (
                                  <span className="text-[10px] font-bold border border-green-500/50 text-green-500 px-2 py-0.5 rounded-sm">Vegetarian</span>
                                )}
                                {macros.allergens && macros.allergens.map(a => (
                                  <span key={a} className="text-[10px] border border-theme-text-tertiary/20 text-theme-text-tertiary px-2 py-0.5 rounded-sm">{a}</span>
                                ))}
                                <button
                                  onClick={(e) => { e.stopPropagation(); setInfoFood(food); }}
                                  className="text-[10px] border border-theme-text-tertiary/20 text-theme-text-tertiary px-2 py-0.5 rounded-sm hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                                  title="View ingredients & details">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                  </svg>
                                  Info
                                </button>
                              </div>

                              {/* Metadata chips */}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-theme-text-tertiary">
                                {food.station && <span>{food.station}</span>}
                                {food.dining_court && <span className="capitalize">{food.dining_court}</span>}
                                {food.meal_time && <span className="capitalize">{food.meal_time}</span>}
                                {(() => { const ss = macros.serving_size || food.serving_size || ''; const skip = !ss || /^(1 serving|serving|unknown)$/i.test(ss.trim()); return !skip ? <span>{ss}</span> : null; })()}
                              </div>

                              {/* Actions row */}
                              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-theme-text-primary/5">
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleFavorite(food.id); }}
                                  className={`p-1.5 sm:p-1 border transition-colors shrink-0 ${fav ? 'border-yellow-500/50 text-yellow-500' : 'border-theme-text-primary/20 text-theme-text-tertiary hover:text-yellow-500'}`}
                                  title={fav ? 'Remove from favorites' : 'Add to favorites'}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                  </svg>
                                </button>
                                <div className="flex items-center gap-1 border border-theme-text-primary/20 px-2 py-1 shrink-0">
                                  <span className="text-[9px] uppercase tracking-wider text-theme-text-tertiary">Srv</span>
                                  <select
                                    value={servingsInput[food.id] || 1}
                                    onChange={e => { e.stopPropagation(); setServingsInput(p => ({ ...p, [food.id]: parseFloat(e.target.value) })); }}
                                    onClick={e => e.stopPropagation()}
                                    className="bg-theme-bg-primary text-xs font-mono text-theme-text-primary w-12 focus:outline-none cursor-pointer">
                                    <option value={0.25} className="bg-theme-bg-primary text-theme-text-primary">0.25</option>
                                    <option value={0.5} className="bg-theme-bg-primary text-theme-text-primary">0.5</option>
                                    <option value={0.75} className="bg-theme-bg-primary text-theme-text-primary">0.75</option>
                                    <option value={1} className="bg-theme-bg-primary text-theme-text-primary">1</option>
                                    <option value={1.5} className="bg-theme-bg-primary text-theme-text-primary">1.5</option>
                                    <option value={2} className="bg-theme-bg-primary text-theme-text-primary">2</option>
                                    <option value={3} className="bg-theme-bg-primary text-theme-text-primary">3</option>
                                  </select>
                                </div>
                                <button
                                  onClick={(e) => handleAddMeal(food, e)}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1 border border-theme-text-primary text-theme-text-primary text-xs uppercase tracking-wider font-bold hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors"
                                  title="Add to today's log">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                  Add
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeMeal(food, selectedDate); }}
                                  disabled={count === 0}
                                  className={`px-2.5 sm:px-3 py-2 sm:py-1 border text-xs uppercase tracking-wider font-bold transition-colors shrink-0 flex items-center gap-1 ${
                                    count > 0
                                      ? 'border-theme-text-primary/50 text-theme-text-secondary hover:bg-theme-text-primary hover:text-theme-bg-primary'
                                      : 'border-theme-text-primary/10 text-theme-text-tertiary/40 cursor-not-allowed'
                                  }`}
                                  title="Remove from log">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                  <span className="hidden sm:inline">Remove</span>
                                </button>
                              </div>
                            </div>
                              </>
                            )}
                          </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
                {hasMore && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center">
                      <button
                        onClick={() => setVisibleCount(c => c + CHUNK_SIZE)}
                        className="px-6 py-2 text-sm uppercase tracking-wider border border-theme-text-primary/30 text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary transition-colors font-mono">
                        Show more ({groupedFoods.length - visibleCount} remaining)
                      </button>
                    </td>
                  </tr>
                )}
                </>
              ) : (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-theme-text-tertiary italic">
                    {(location.type === 'all-foodco' || location.source === 'foodco') ? (
                      <div className="space-y-2">
                        <div className="text-base not-italic font-bold text-theme-text-secondary">Purdue Food Co</div>
                        <div className="text-sm">No menu data available for this location yet.</div>
                        <div className="text-xs mt-3">Visit <a href="https://purduefoodco.com" target="_blank" rel="noopener noreferrer" className="underline text-theme-text-secondary hover:text-theme-text-primary">purduefoodco.com</a> for menus and ordering.</div>
                      </div>
                    ) : 'No foods found for this selection.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>{/* end main food table wrapper */}

          {/* ── Beverages sidebar (desktop) / bottom section (mobile) ── */}
          {beverageFoods.length > 0 && (
            <div className="xl:w-72 shrink-0 mt-6 xl:mt-0">
              <div className="border border-theme-text-primary/10 sticky top-0">
                <div className="px-3 py-2 bg-theme-bg-secondary/50 border-b border-theme-text-primary/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-theme-text-tertiary">Beverages</span>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                  {/* Water tracker at the top */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-theme-text-primary/10 bg-blue-500/[0.04]">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                      </svg>
                      <span className="text-xs font-bold text-theme-text-primary">Water</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => addWater(-1, selectedDate)}
                        disabled={getWater(selectedDate) === 0}
                        className={`p-1 border transition-colors ${getWater(selectedDate) > 0 ? 'border-theme-text-primary/20 text-theme-text-tertiary hover:bg-theme-text-primary hover:text-theme-bg-primary' : 'border-theme-text-primary/10 text-theme-text-tertiary/20 cursor-not-allowed'}`}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      </button>
                      <span className="text-xs font-mono tabular-nums text-blue-400 font-bold min-w-[20px] text-center">{getWater(selectedDate)}</span>
                      <button onClick={() => addWater(1, selectedDate)}
                        className="p-1 border border-theme-text-primary/20 text-theme-text-tertiary hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      </button>
                      <span className="text-[9px] text-theme-text-tertiary ml-0.5">glasses</span>
                    </div>
                  </div>

                  {/* Recent drinks section */}
                  {(() => {
                    const recentInCurrent = beverageFoods.filter(f => recentBeverageIds.includes(f.id));
                    if (recentInCurrent.length === 0) return null;
                    return (
                      <>
                        <div className="px-3 py-1.5 bg-theme-bg-secondary/30 border-b border-theme-text-primary/5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-theme-text-tertiary/60">Recent</span>
                        </div>
                        {recentInCurrent.slice(0, 5).map((food) => (
                          <BeverageRow key={`recent-${food.id}`} food={food} getCount={getCount} selectedDate={selectedDate} handleAddMeal={handleAddMeal} removeMeal={removeMeal} highlight />
                        ))}
                      </>
                    );
                  })()}

                  {/* Grouped beverages: Milk, then Non-Milk */}
                  {(() => {
                    const isWater = (name) => /^water\b/i.test(name.trim());
                    const isMilk = (name) => /milk|chocolate\s*milk|skim|2%|1%|whole milk|buttermilk|oat\s*milk|almond\s*milk|soy\s*milk/i.test(name);
                    const filtered = beverageFoods.filter(f => !isWater(f.name));
                    const milkDrinks = filtered.filter(f => isMilk(f.name));
                    const nonMilkDrinks = filtered.filter(f => !isMilk(f.name));
                    return (
                      <>
                        {milkDrinks.length > 0 && (
                          <>
                            <div className="px-3 py-1.5 bg-theme-bg-secondary/30 border-b border-theme-text-primary/5">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-theme-text-tertiary/60">Milk</span>
                            </div>
                            {milkDrinks.map((food) => (
                              <BeverageRow key={food.id} food={food} getCount={getCount} selectedDate={selectedDate} handleAddMeal={handleAddMeal} removeMeal={removeMeal} />
                            ))}
                          </>
                        )}
                        {nonMilkDrinks.length > 0 && (
                          <>
                            <div className="px-3 py-1.5 bg-theme-bg-secondary/30 border-b border-theme-text-primary/5">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-theme-text-tertiary/60">Other Drinks</span>
                            </div>
                            {nonMilkDrinks.map((food) => (
                              <BeverageRow key={food.id} food={food} getCount={getCount} selectedDate={selectedDate} handleAddMeal={handleAddMeal} removeMeal={removeMeal} />
                            ))}
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          </div>{/* end flex wrapper */}
        </main>

        <footer className="border-t border-theme-text-primary/5 px-4 sm:px-6 md:px-12 lg:px-20 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-theme-text-tertiary tracking-wide text-center sm:text-left">
              Boiler<span className="text-yellow-500/70">Fuel</span> &middot; Purdue Dining Data &middot; {new Date().getFullYear()}
            </p>
            <div className="flex gap-4 text-xs font-mono">
              <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
              <span className="text-theme-text-tertiary/20">&middot;</span>
              <Link href="/changelog" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Changelog</Link>
              <span className="text-theme-text-tertiary/20">&middot;</span>
              <Link href="/admin" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Admin</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* ── Sticky daily summary bar (bottom, results view only) ── */}
      {!isLanding && selectedDateTotals.calories > 0 && (() => {
        const calGoal = goals?.calories || 2000;
        const pct = Math.min((selectedDateTotals.calories / calGoal) * 100, 100);
        const over = selectedDateTotals.calories > calGoal;
        const remaining = calGoal - selectedDateTotals.calories;
        return (
          <div
            className="fixed bottom-0 left-0 right-0 z-40 font-mono"
            style={{
              background: 'rgb(var(--color-bg-primary))',
              borderTop: '1px solid rgba(var(--color-text-primary), 0.1)',
              transition: `transform 0.4s ${EASE}`,
            }}>
            {/* Thin progress bar at top of the summary strip */}
            <div style={{ height: 2, background: 'rgba(var(--color-text-primary), 0.06)' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: over ? 'rgb(239 68 68)' : 'rgb(234 179 8)',
                transition: `width 0.5s ${EASE}`,
              }} />
            </div>
            <div className="flex items-center justify-between px-4 sm:px-6 md:px-12 lg:px-20 py-2 gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-base font-bold tabular-nums ${over ? 'text-red-400' : 'text-theme-text-primary'}`}>
                  {selectedDateTotals.calories}
                </span>
                <span className="text-[10px] text-theme-text-tertiary">/ {calGoal} cal</span>
                {over ? (
                  <span className="text-[9px] text-red-400/80 font-bold uppercase tracking-wide">{selectedDateTotals.calories - calGoal} over</span>
                ) : (
                  <span className="text-[9px] text-theme-text-tertiary/50">{remaining} left</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px] tabular-nums text-theme-text-tertiary">
                <span><span className="font-bold text-theme-text-secondary">{Math.round(selectedDateTotals.protein)}</span>g P</span>
                <span><span className="font-bold text-theme-text-secondary">{Math.round(selectedDateTotals.carbs)}</span>g C</span>
                <span><span className="font-bold text-theme-text-secondary">{Math.round(selectedDateTotals.fat)}</span>g F</span>
                <button
                  onClick={() => router.push('/profile')}
                  className="hidden sm:block text-[9px] uppercase tracking-widest text-theme-text-tertiary/50 hover:text-theme-text-primary transition-colors border border-theme-text-primary/15 px-1.5 py-0.5">
                  View Log
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Macro tooltip (results view only, hidden when expanded) ── */}
      {!isLanding && !expandedId && <MacroTooltip food={hoveredFood} pos={tooltipPos} />}

      {/* ── Meal time picker modal (shown when mealTime is All) ── */}
      {mealPickerFood && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center"
          onClick={() => setMealPickerFood(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-theme-bg-primary border border-theme-text-primary shadow-2xl max-w-xs w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: `fadeInTooltip 0.15s ${EASE} both` }}>
            <div className="px-5 py-4 border-b border-theme-text-primary/20">
              <div className="text-xs uppercase tracking-widest text-theme-text-tertiary mb-1">Adding</div>
              <div className="font-bold text-sm truncate">{mealPickerFood.name}</div>
            </div>
            <div className="px-5 py-3">
              <div className="text-xs uppercase tracking-widest text-theme-text-tertiary mb-3">Select meal</div>
              <div className="flex flex-col gap-2">
                {(mealPickerOptions || ['Breakfast', 'Brunch', 'Lunch', 'Dinner']).map(mt => (
                  <button key={mt}
                    onClick={() => {
                      addMeal(mealPickerFood, mt.toLowerCase(), selectedDate);
                      setMealPickerFood(null);
                    }}
                    className="w-full px-4 py-3 border border-theme-text-primary/30 text-sm font-bold uppercase tracking-wider text-theme-text-primary hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors text-left">
                    {mt}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-theme-text-primary/10">
              <button onClick={() => setMealPickerFood(null)}
                className="w-full text-center text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors py-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Food info / ingredients modal ── */}
      {infoFood && (() => {
        const im = infoFood.macros || {};
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center"
            onClick={() => setInfoFood(null)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-theme-bg-primary border border-theme-text-primary shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: `fadeInTooltip 0.15s ${EASE} both` }}>
              {/* Header */}
              <div className="px-5 py-4 border-b border-theme-text-primary/20 shrink-0">
                <div className="text-xs uppercase tracking-widest text-theme-text-tertiary mb-1">Nutrition Facts</div>
                <div className="font-bold text-base">{infoFood.name}</div>
                {im.serving_size && (
                  <div className="text-xs text-theme-text-tertiary mt-0.5">Serving Size: {im.serving_size}</div>
                )}
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-5 py-4">
                {/* Nutrition table */}
                <div className="border-t-[8px] border-theme-text-primary mb-1">
                  <div className="flex justify-between py-1 border-b border-theme-text-primary/10 font-bold text-sm">
                    <span>Calories</span>
                    <span className="tabular-nums">{infoFood.calories}</span>
                  </div>
                  <div className="text-[10px] text-right text-theme-text-tertiary py-0.5 border-b border-theme-text-primary/5">% Daily Value*</div>
                  {[
                    { label: 'Total Fat', val: im.fats ?? im.fat, unit: 'g' },
                    { label: '  Saturated Fat', val: im.saturated_fat, unit: 'g', indent: true },
                    { label: 'Cholesterol', val: im.cholesterol, unit: 'mg' },
                    { label: 'Sodium', val: im.sodium, unit: 'mg' },
                    { label: 'Total Carbohydrate', val: im.carbs, unit: 'g' },
                    { label: '  Dietary Fiber', val: im.fiber, unit: 'g', indent: true },
                    { label: '  Sugar', val: im.sugar, unit: 'g', indent: true },
                    { label: '  Added Sugar', val: im.added_sugar, unit: 'g', indent: true },
                    { label: 'Protein', val: im.protein, unit: 'g' },
                  ].map(n => (
                    <div key={n.label} className={`flex justify-between py-0.5 border-b border-theme-text-primary/5 text-sm ${n.indent ? 'pl-4 text-theme-text-secondary' : 'font-bold'}`}>
                      <span>{n.label.trim()}</span>
                      <span className="tabular-nums">{n.val != null ? `${Number(n.val).toFixed(1)}${n.unit}` : '—'}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-theme-text-tertiary mt-1 mb-4">
                  * Percent Daily Values are based on a 2,000 calorie diet.
                </div>

                {/* Dietary tags */}
                {(im.is_vegetarian || im.is_vegan || (im.allergens && im.allergens.length > 0)) && (
                  <div className="mb-4">
                    <div className="text-xs uppercase tracking-widest text-theme-text-tertiary mb-2">Dietary Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                      {im.is_vegan && (
                        <span className="text-[11px] font-bold border border-emerald-400/50 text-emerald-400 px-2 py-0.5 rounded-sm">Vegan</span>
                      )}
                      {im.is_vegetarian && (
                        <span className="text-[11px] font-bold border border-green-500/50 text-green-500 px-2 py-0.5 rounded-sm">Vegetarian</span>
                      )}
                      {im.allergens && im.allergens.map(a => (
                        <span key={a} className="text-[11px] border border-amber-500/30 text-amber-500/80 px-2 py-0.5 rounded-sm">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ingredients */}
                {im.ingredients && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-theme-text-tertiary mb-2">Ingredients</div>
                    <p className="text-sm text-theme-text-secondary leading-relaxed">{im.ingredients}</p>
                  </div>
                )}

                {/* Location info */}
                <div className="mt-4 pt-3 border-t border-theme-text-primary/10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-theme-text-tertiary">
                  {infoFood.dining_court && <span>Location: <span className="text-theme-text-secondary capitalize">{infoFood.dining_court}</span></span>}
                  {infoFood.station && <span>Station: <span className="text-theme-text-secondary">{infoFood.station}</span></span>}
                  {infoFood.meal_time && <span>Meal: <span className="text-theme-text-secondary capitalize">{infoFood.meal_time}</span></span>}
                </div>
              </div>

              {/* Close button */}
              <div className="px-5 py-3 border-t border-theme-text-primary/10 shrink-0">
                <button onClick={() => setInfoFood(null)}
                  className="w-full text-center text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors py-1">
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Barcode scanner modal ── */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onClose={() => setShowBarcodeScanner(false)}
          onFoodFound={(food) => {
            setShowBarcodeScanner(false);
            // If a specific meal time is selected, add directly; otherwise show picker
            if (mealTime !== 'All') {
              addMeal(food, mealTime.toLowerCase(), selectedDate);
            } else {
              setMealPickerOptions(null);
              setMealPickerFood(food);
            }
          }}
        />
      )}

    </div>
  );
}

// index has its own layout — skip the shared Layout wrapper
Home.getLayout = (page) => page;
