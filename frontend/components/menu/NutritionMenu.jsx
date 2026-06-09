import { useEffect, useMemo, useRef, useState } from 'react';
import { useMeals } from '../../context/MealContext';
import { C, T, TNUM, Eyebrow } from './labelUI';
import { buildBudget, matchesDiet, stationsFrom, todayKey, fitsCleanly, pctRemaining, macro } from '../../utils/menuMath';
import MenuLedger from './MenuLedger';
import MenuSpread, { Banner, Card, Spread } from './MenuSpread';

// components/menu/NutritionMenu.jsx
// Orchestrator for the Nutrition-Facts menu page. Pulls today's budget from
// useMeals(), fetches the dining-court menu from /api/foods, and renders the
// user's preferred layout (Ledger or Spread). Logging an item calls addMeal()
// so the budget updates live. Dietary chips are wired to the app's dietaryPrefs.








const MEALS = ['Breakfast', 'Lunch', 'Dinner'];
function defaultMeal() {
  const h = new Date().getHours();
  if (h < 11) return 'Breakfast';
  if (h < 16) return 'Lunch';
  return 'Dinner';
}

function useIsNarrow(bp = 980) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [bp]);
  return narrow;
}

// map the app's dietaryPrefs <-> the four chips the layouts expose
function prefsToFilters(prefs) {
  const ex = (prefs?.excludeAllergens || []).map((a) => String(a).toLowerCase());
  return {
    vegan: !!prefs?.vegan,
    vegetarian: !!prefs?.vegetarian,
    glutenFree: ex.includes('gluten'),
    dairyFree: ex.includes('dairy'),
  };
}

function Segmented({ value, options, onChange }) {
  return (
    <div style={{ display: 'inline-flex', border: `1px solid ${C.hair}` }}>
      {options.map(([val, label], i) => {
        const on = value === val;
        return (
          <button key={val} onClick={() => onChange(val)} style={{ ...T.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 14px', cursor: 'pointer', border: 'none', borderLeft: i ? `1px solid ${C.hair}` : 'none', background: on ? C.accent : 'transparent', color: on ? C.accentInk : C.muted }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

function selectStyle() {
  return { ...T.bold, fontSize: 13, padding: '8px 12px', background: C.paper, color: C.ink, border: `1px solid ${C.hair}`, cursor: 'pointer' };
}

export default function NutritionMenu({ layout = 'ledger', onLayoutChange }) {
  const { goals, totals, addMeal, getCount, dietaryPrefs, setDietaryPrefs } = useMeals();
  const narrow = useIsNarrow();

  const [courts, setCourts] = useState(['Wiley', 'Earhart', 'Ford', 'Hillenbrand', 'Windsor']);
  const [court, setCourt] = useState('Wiley');
  const [meal, setMeal] = useState(defaultMeal());
  const [grouped, setGrouped] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [activeStation, setActiveStation] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const date = useMemo(() => todayKey(), []);
  const reqId = useRef(0);

  const budget = useMemo(() => buildBudget(goals, totals), [goals, totals]);

  // dining-court list
  useEffect(() => {
    let alive = true;
    fetch('/api/dining-courts')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        const list = Array.isArray(data) ? data : data.courts || data.dining_courts;
        if (Array.isArray(list) && list.length) {
          const names = list.map((c) => (typeof c === 'string' ? c : c.name || c.dining_court)).filter(Boolean);
          if (names.length) {
            setCourts(names);
            setCourt((cur) => (names.includes(cur) ? cur : names[0]));
          }
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // menu for the selected court + date
  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    fetch(`/api/foods?group=true&date=${date}&dining_court=${encodeURIComponent(court)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Menu unavailable'))))
      .then((data) => {
        if (id !== reqId.current) return;
        setGrouped(data.grouped || null);
        setLoading(false);
      })
      .catch((e) => {
        if (id !== reqId.current) return;
        setError(e.message || 'Failed to load menu');
        setLoading(false);
      });
  }, [court, date]);

  const stations = useMemo(() => stationsFrom(grouped, court, meal), [grouped, court, meal]);

  // keep selection / active station valid as the menu changes
  useEffect(() => {
    if (!stations.length) { setSelected(null); setActiveStation(null); return; }
    setActiveStation((cur) => (stations.some((s) => s.name === cur) ? cur : stations[0].name));
    setSelected((cur) => {
      const all = stations.flatMap((s) => s.items);
      if (cur && all.some((f) => f.id === cur.id)) return cur;
      return all[0] || null;
    });
    setActiveTab('All');
  }, [stations]);

  const filters = useMemo(() => prefsToFilters(dietaryPrefs), [dietaryPrefs]);
  const matches = useMemo(() => (food) => matchesDiet(food, dietaryPrefs), [dietaryPrefs]);

  const toggleFilter = (key) => {
    if (key === 'vegan') setDietaryPrefs({ vegan: !dietaryPrefs?.vegan });
    else if (key === 'vegetarian') setDietaryPrefs({ vegetarian: !dietaryPrefs?.vegetarian });
    else {
      const allergen = key === 'glutenFree' ? 'gluten' : 'dairy';
      const cur = (dietaryPrefs?.excludeAllergens || []).map((a) => String(a).toLowerCase());
      const next = cur.includes(allergen) ? cur.filter((a) => a !== allergen) : [...cur, allergen];
      setDietaryPrefs({ excludeAllergens: next });
    }
  };

  const onLog = (food) => addMeal(food, meal, undefined, 1);
  const headerNote = `BoilerFuel · ${court} · ${meal}`;

  // ── Header (shared across layouts) ──────────────────────────────────────
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '0 0 14px' }}>
      <div>
        <Eyebrow>Menu · {date}</Eyebrow>
        <div style={{ ...T.display, fontSize: 26, color: C.ink, marginTop: 2 }}>Nutrition Facts</div>
      </div>
      <div style={{ flex: 1 }} />
      <select aria-label="Dining court" value={court} onChange={(e) => setCourt(e.target.value)} style={selectStyle()}>
        {courts.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select aria-label="Meal period" value={meal} onChange={(e) => setMeal(e.target.value)} style={selectStyle()}>
        {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      {!narrow && (
        <Segmented value={layout} options={[['ledger', 'Ledger'], ['spread', 'Spread']]} onChange={(v) => onLayoutChange && onLayoutChange(v)} />
      )}
    </div>
  );

  // ── Workspace ───────────────────────────────────────────────────────────
  let workspace;
  if (loading) {
    workspace = <CenterNote>Loading {court} {meal.toLowerCase()} menu…</CenterNote>;
  } else if (error) {
    workspace = <CenterNote>{error}. Check back when {court} posts today’s menu.</CenterNote>;
  } else if (!stations.length) {
    workspace = <CenterNote>No {meal.toLowerCase()} items posted for {court} today.</CenterNote>;
  } else if (narrow) {
    workspace = (
      <Stacked
        stations={stations} budget={budget} selected={selected} onSelect={setSelected}
        onLog={onLog} getCount={getCount} filters={filters} onToggleFilter={toggleFilter}
        matches={matches} activeTab={activeTab} onPickTab={setActiveTab} courtName={court}
      />
    );
  } else if (layout === 'spread') {
    workspace = (
      <Framed>
        <MenuSpread
          stations={stations} budget={budget} selected={selected} onSelect={setSelected}
          onLog={onLog} getCount={getCount} filters={filters} onToggleFilter={toggleFilter}
          matches={matches} activeTab={activeTab} onPickTab={setActiveTab} courtName={court}
        />
      </Framed>
    );
  } else {
    workspace = (
      <Framed>
        <MenuLedger
          stations={stations} budget={budget} selected={selected} onSelect={setSelected}
          onLog={onLog} getCount={getCount} filters={filters} onToggleFilter={toggleFilter}
          matches={matches} activeStation={activeStation} onPickStation={setActiveStation} headerNote={headerNote}
        />
      </Framed>
    );
  }

  return (
    <div>
      {header}
      {workspace}
    </div>
  );
}

// fixed-height framed workspace with the FDA-label internal scroll feel
function Framed({ children }) {
  return (
    <div style={{ border: `1px solid ${C.hair}`, background: C.paper, height: 'min(78vh, 820px)', minHeight: 540, overflow: 'hidden' }}>
      {children}
    </div>
  );
}

function CenterNote({ children }) {
  return (
    <div style={{ border: `1px solid ${C.hair}`, background: C.paper, minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
      <span style={{ ...T.mono, fontSize: 13, color: C.muted, letterSpacing: '0.04em' }}>{children}</span>
    </div>
  );
}

// ── Narrow-screen fallback: budget banner + responsive card grid + the full
// label inline below the selected card (no fixed side rail). ────────────────
function Stacked({ stations, budget, selected, onSelect, onLog, getCount, filters, onToggleFilter, matches, activeTab, onPickTab, courtName }) {
  const tabs = ['All', ...stations.map((s) => s.name)];
  const items = stations.flatMap((s) => s.items).filter((it) => activeTab === 'All' || it.station === activeTab);
  return (
    <div style={{ border: `1px solid ${C.hair}`, background: C.paper }}>
      <Banner budget={budget} filters={filters} onToggleFilter={onToggleFilter} />
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', borderBottom: `1px solid ${C.hair}` }}>
        {tabs.map((t) => {
          const on = activeTab === t;
          return (
            <button key={t} onClick={() => onPickTab(t)} style={{ ...T.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', padding: '6px 9px', border: `1px solid ${on ? C.accent : C.hair}`, color: on ? C.accentInk : C.muted, background: on ? C.accent : 'transparent', whiteSpace: 'nowrap', cursor: 'pointer' }}>{t}</button>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, padding: 16 }}>
        {items.map((it) => (
          <Card key={it.id} item={it} budget={budget} active={it.id === selected?.id} dim={!matches(it)} onPick={onSelect} />
        ))}
      </div>
      {selected && (
        <div style={{ borderTop: `6px solid ${C.ink}` }}>
          <Spread item={selected} budget={budget} onLog={onLog} loggedCount={getCount ? getCount(selected.id) : 0} />
        </div>
      )}
    </div>
  );
}
