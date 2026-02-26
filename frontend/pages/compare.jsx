import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { DINING_LOCATIONS } from '../utils/diningLocations';

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MEAL_TIMES = ['All', 'Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Late Night'];

const ALL_LOCATIONS = DINING_LOCATIONS.map(l => l.api_name);

// Avg macro helper
function avg(foods, key) {
  if (!foods.length) return 0;
  return Math.round(foods.reduce((s, f) => s + (parseFloat(f.macros?.[key]) || 0), 0) / foods.length * 10) / 10;
}

function avgCal(foods) {
  if (!foods.length) return 0;
  return Math.round(foods.reduce((s, f) => s + (f.calories || 0), 0) / foods.length);
}

export default function ComparePage() {
  const today = localDateStr();
  const [courtA, setCourtA] = useState('Ford');
  const [courtB, setCourtB] = useState('Wiley');
  const [mealTime, setMealTime] = useState('All');
  const [date, setDate] = useState(today);
  const [foodsA, setFoodsA] = useState([]);
  const [foodsB, setFoodsB] = useState([]);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [availableLocations, setAvailableLocations] = useState([]);

  useEffect(() => {
    fetch('/api/dining-courts')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAvailableLocations(data); })
      .catch(() => {});
  }, []);

  const fetchCourt = useCallback(async (court, setFoods, setLoading) => {
    setLoading(true);
    const params = new URLSearchParams({ dining_court: court, date });
    if (mealTime !== 'All') params.set('meal_time', mealTime);
    try {
      const res = await fetch(`/api/foods?${params}`);
      const data = await res.json();
      setFoods(Array.isArray(data) ? data : []);
    } catch {
      setFoods([]);
    }
    setLoading(false);
  }, [date, mealTime]);

  useEffect(() => { fetchCourt(courtA, setFoodsA, setLoadingA); }, [courtA, fetchCourt]);
  useEffect(() => { fetchCourt(courtB, setFoodsB, setLoadingB); }, [courtB, fetchCourt]);

  // Sets for overlap detection
  const namesA = new Set(foodsA.map(f => f.name.toLowerCase()));
  const namesB = new Set(foodsB.map(f => f.name.toLowerCase()));

  const filteredA = foodsA.filter(f => !searchA || f.name.toLowerCase().includes(searchA.toLowerCase()));
  const filteredB = foodsB.filter(f => !searchB || f.name.toLowerCase().includes(searchB.toLowerCase()));

  // Locations that have data (prefer live list, fallback to static)
  const locationList = availableLocations.length > 0 ? availableLocations : ALL_LOCATIONS;

  const StatBar = ({ label, valA, valB, unit = '' }) => {
    const max = Math.max(valA, valB, 1);
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-theme-text-tertiary uppercase tracking-wider">
          <span>{label}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="h-1.5 bg-theme-text-primary/10 overflow-hidden">
              <div className="h-full bg-theme-text-primary/50 transition-all" style={{ width: `${(valA / max) * 100}%` }} />
            </div>
            <span className="text-xs font-mono tabular-nums text-theme-text-secondary">{valA}{unit}</span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 bg-theme-text-primary/10 overflow-hidden">
              <div className="h-full bg-yellow-500/50 transition-all" style={{ width: `${(valB / max) * 100}%` }} />
            </div>
            <span className="text-xs font-mono tabular-nums text-theme-text-secondary">{valB}{unit}</span>
          </div>
        </div>
      </div>
    );
  };

  const FoodRow = ({ food, inOther }) => (
    <div className={`px-3 py-2.5 border-b border-theme-text-primary/5 last:border-0 ${inOther ? 'bg-theme-text-primary/[0.03]' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold truncate leading-tight">{food.name}</p>
          {food.station && <p className="text-[9px] text-theme-text-tertiary/60 mt-0.5 truncate">{food.station}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-mono tabular-nums font-bold">{food.calories} cal</p>
          <p className="text-[9px] text-theme-text-tertiary/70 font-mono">
            P{Math.round(food.macros?.protein || 0)} C{Math.round(food.macros?.carbs || 0)} F{Math.round(food.macros?.fats || food.macros?.fat || 0)}
          </p>
        </div>
      </div>
      {inOther && (
        <span className="inline-block mt-1 text-[8px] uppercase tracking-wider text-theme-text-tertiary/50 border border-theme-text-primary/10 px-1 py-0 leading-tight">
          also at other court
        </span>
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>Compare Dining Courts — BoilerFuel</title>
        <meta name="description" content="Compare menus side by side for any two Purdue dining locations." />
      </Head>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-20 space-y-10">

          {/* Header */}
          <header className="space-y-4">
            <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </Link>
            <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.2em]">Compare</h1>
            <div className="w-12 h-px bg-theme-text-primary/30" />
            <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
              Side-by-side dining court menus
            </p>
          </header>

          {/* Controls */}
          <div className="border border-theme-text-primary/10 p-5 space-y-5">
            <p className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">Filter</p>

            {/* Date + Meal Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-2 text-sm font-mono focus:outline-none focus:border-theme-text-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-1.5">Meal Time</label>
                <div className="flex gap-px border border-theme-text-primary/20 w-full">
                  {MEAL_TIMES.map(mt => (
                    <button key={mt} onClick={() => setMealTime(mt)}
                      className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                        mealTime === mt ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-secondary text-theme-text-tertiary'
                      }`}>
                      {mt === 'Late Night' ? 'Late' : mt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-1.5">
                  <span className="inline-block w-2 h-2 bg-theme-text-primary/50 mr-1.5" />
                  Court A
                </label>
                <select
                  value={courtA}
                  onChange={e => setCourtA(e.target.value)}
                  className="w-full border border-theme-text-primary/20 bg-theme-bg-secondary text-theme-text-primary px-3 py-2 text-sm font-mono focus:outline-none focus:border-theme-text-primary/50 transition-colors"
                >
                  {locationList.map(loc => (
                    <option key={loc} value={loc} disabled={loc === courtB}>{loc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-1.5">
                  <span className="inline-block w-2 h-2 bg-yellow-500/50 mr-1.5" />
                  Court B
                </label>
                <select
                  value={courtB}
                  onChange={e => setCourtB(e.target.value)}
                  className="w-full border border-theme-text-primary/20 bg-theme-bg-secondary text-theme-text-primary px-3 py-2 text-sm font-mono focus:outline-none focus:border-theme-text-primary/50 transition-colors"
                >
                  {locationList.map(loc => (
                    <option key={loc} value={loc} disabled={loc === courtA}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats comparison */}
          {(foodsA.length > 0 || foodsB.length > 0) && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                Nutrition Overview
              </h2>
              <div className="grid grid-cols-2 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10 mb-4">
                {[
                  { label: 'Items', a: foodsA.length, b: foodsB.length, unit: '' },
                  { label: 'Shared items', a: foodsA.filter(f => namesB.has(f.name.toLowerCase())).length, b: foodsB.filter(f => namesA.has(f.name.toLowerCase())).length, unit: '' },
                ].map(s => (
                  <div key={s.label} className="bg-theme-bg-primary px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">{s.label}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-bold tabular-nums">{s.a}</span>
                      <span className="text-theme-text-tertiary text-xs">vs</span>
                      <span className="text-lg font-bold tabular-nums text-yellow-500/80">{s.b}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border border-theme-text-primary/10 p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider text-theme-text-tertiary mb-2">
                  <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 bg-theme-text-primary/50" />{courtA}</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 bg-yellow-500/50" />{courtB}</span>
                </div>
                <StatBar label="Avg Calories" valA={avgCal(foodsA)} valB={avgCal(foodsB)} unit=" cal" />
                <StatBar label="Avg Protein" valA={avg(foodsA, 'protein')} valB={avg(foodsB, 'protein')} unit="g" />
                <StatBar label="Avg Carbs" valA={avg(foodsA, 'carbs')} valB={avg(foodsB, 'carbs')} unit="g" />
                <StatBar label="Avg Fat" valA={avg(foodsA, 'fats')} valB={avg(foodsB, 'fats')} unit="g" />
                <StatBar label="Avg Fiber" valA={avg(foodsA, 'fiber')} valB={avg(foodsB, 'fiber')} unit="g" />
                <StatBar label="Avg Sodium" valA={avg(foodsA, 'sodium')} valB={avg(foodsB, 'sodium')} unit="mg" />
              </div>
            </section>
          )}

          {/* Side by side menus */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              Menu Comparison
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Court A */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-theme-text-primary/10 pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 bg-theme-text-primary/50 shrink-0" />
                    {courtA}
                  </h3>
                  <span className="text-[10px] text-theme-text-tertiary tabular-nums">{foodsA.length} items</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchA}
                    onChange={e => setSearchA(e.target.value)}
                    placeholder="Filter…"
                    className="w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-1.5 text-xs font-mono placeholder:text-theme-text-tertiary/40 focus:outline-none focus:border-theme-text-primary/40 transition-colors pl-7"
                  />
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-text-tertiary">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                {loadingA ? (
                  <div className="border border-theme-text-primary/10 p-6 text-center text-xs text-theme-text-tertiary uppercase tracking-widest">Loading…</div>
                ) : filteredA.length === 0 ? (
                  <div className="border border-theme-text-primary/10 p-6 text-center text-xs text-theme-text-tertiary uppercase tracking-widest">No items</div>
                ) : (
                  <div className="border border-theme-text-primary/10 overflow-hidden max-h-[600px] overflow-y-auto">
                    {filteredA.map((food, i) => (
                      <FoodRow key={i} food={food} inOther={namesB.has(food.name.toLowerCase())} />
                    ))}
                  </div>
                )}
              </div>

              {/* Court B */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-theme-text-primary/10 pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 bg-yellow-500/50 shrink-0" />
                    {courtB}
                  </h3>
                  <span className="text-[10px] text-theme-text-tertiary tabular-nums">{foodsB.length} items</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchB}
                    onChange={e => setSearchB(e.target.value)}
                    placeholder="Filter…"
                    className="w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-1.5 text-xs font-mono placeholder:text-theme-text-tertiary/40 focus:outline-none focus:border-theme-text-primary/40 transition-colors pl-7"
                  />
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-text-tertiary">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                {loadingB ? (
                  <div className="border border-theme-text-primary/10 p-6 text-center text-xs text-theme-text-tertiary uppercase tracking-widest">Loading…</div>
                ) : filteredB.length === 0 ? (
                  <div className="border border-theme-text-primary/10 p-6 text-center text-xs text-theme-text-tertiary uppercase tracking-widest">No items</div>
                ) : (
                  <div className="border border-theme-text-primary/10 overflow-hidden max-h-[600px] overflow-y-auto">
                    {filteredB.map((food, i) => (
                      <FoodRow key={i} food={food} inOther={namesA.has(food.name.toLowerCase())} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Shared foods section */}
            {foodsA.length > 0 && foodsB.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-theme-text-primary/10">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">
                  Shared Items ({foodsA.filter(f => namesB.has(f.name.toLowerCase())).length})
                </h3>
                {foodsA.filter(f => namesB.has(f.name.toLowerCase())).length === 0 ? (
                  <p className="text-xs text-theme-text-tertiary/60">No items in common.</p>
                ) : (
                  <div className="border border-theme-text-primary/10 divide-y divide-theme-text-primary/5">
                    {foodsA
                      .filter(f => namesB.has(f.name.toLowerCase()))
                      .map((food, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 px-4 py-2.5">
                          <span className="text-xs truncate">{food.name}</span>
                          <span className="text-xs font-mono tabular-nums text-theme-text-tertiary shrink-0">{food.calories} cal</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="border-t border-theme-text-primary/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6 text-xs uppercase tracking-widest">
              <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
              <Link href="/stats" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Stats</Link>
              <Link href="/profile" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Profile</Link>
              <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-theme-text-tertiary/40">BoilerFuel &middot; {new Date().getFullYear()}</span>
          </footer>

        </div>
      </div>
    </>
  );
}

ComparePage.getLayout = (page) => page;
