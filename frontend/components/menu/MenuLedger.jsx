import { useRef } from 'react';
import { C, T, TNUM, Rule, Eyebrow, FitMark, DietTag, MacroMeter, dietTagsFor } from './labelUI';
import { macro, pctRemaining, pctGoal, fitsCleanly, overflows, projectAfter } from '../../utils/menuMath';

// components/menu/MenuLedger.jsx — "The Ledger" layout (Direction A).
// Three columns: stations rail + dietary filters · scrollable menu where every
// row is a wide mini nutrition label · sticky Remaining-Today budget + the full
// FDA label for the focused item with an "after you eat this" projection.





const DIET_FILTERS = [
  ['vegan', 'Vegan'], ['vegetarian', 'Veg'], ['glutenFree', 'GF'], ['dairyFree', 'Dairy-free'],
];

function chipStyle(on) {
  return {
    ...T.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase',
    padding: '6px 9px', border: `1px solid ${on ? C.accent : C.hair}`, cursor: 'pointer',
    color: on ? C.accentInk : C.muted, background: on ? C.accent : 'transparent', whiteSpace: 'nowrap',
  };
}

function Rail({ stations, active, onPick, filters, onToggleFilter }) {
  return (
    <div style={{ width: 244, flex: '0 0 244px', borderRight: `1px solid ${C.hair}`, background: C.panel, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 18px 10px' }}><Eyebrow>Stations</Eyebrow></div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {stations.map((s) => {
          const on = s.name === active;
          return (
            <div key={s.name} onClick={() => onPick(s.name)} style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: on ? C.ink : 'transparent', color: on ? C.paper : C.ink, borderBottom: `1px solid ${C.hair2}` }}>
              <span style={{ ...T.heavy, fontSize: 14 }}>{s.name}</span>
              <span style={{ ...T.mono, ...TNUM, fontSize: 11, color: on ? C.paper : C.faint, opacity: on ? 0.7 : 1 }}>{s.items.length}</span>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.hair}` }}>
        <Eyebrow style={{ marginBottom: 9 }}>Dietary</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {DIET_FILTERS.map(([k, lbl]) => (
            <button key={k} style={chipStyle(filters[k])} onClick={() => onToggleFilter(k)}>{lbl}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 14 }}>
          <FitMark />
          <span style={{ ...T.mono, fontSize: 10, color: C.muted, lineHeight: 1.4 }}>Fits in what you<br />have left tonight</span>
        </div>
      </div>
    </div>
  );
}

function FoodRow({ item, budget, active, dim, onPick }) {
  const fits = fitsCleanly(item, budget);
  const cells = [
    ['Protein', macro(item, 'protein'), budget.p],
    ['Carbs', macro(item, 'carbs'), budget.c],
    ['Fat', macro(item, 'fat'), budget.f],
  ];
  return (
    <div onClick={() => onPick(item)} style={{ position: 'relative', padding: '14px 22px 14px 26px', borderBottom: `1px solid ${C.hair2}`, cursor: 'pointer', opacity: dim ? 0.32 : 1, background: active ? C.paper2 : 'transparent' }}>
      {fits && <div style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 6, background: C.accent }} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ ...T.heavy, fontSize: 18, color: C.ink }}>{item.name}</span>
            {item.serving && <span style={{ ...T.mono, fontSize: 10, color: C.faint, letterSpacing: '0.08em' }}>{item.serving}</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
            {dietTagsFor(item).map((t) => <DietTag key={t} label={t} />)}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 58px)' }}>
          {cells.map(([k, v, m]) => {
            const rem = pctRemaining(v, m), over = rem > 100;
            return (
              <div key={k} style={{ textAlign: 'center', borderLeft: `1px solid ${C.hair2}`, padding: '0 2px' }}>
                <div style={{ ...T.mono, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.faint }}>{k}</div>
                <div style={{ ...T.heavy, ...TNUM, fontSize: 15, color: C.ink, marginTop: 2 }}>{v}g</div>
                <div style={{ ...T.mono, ...TNUM, fontSize: 9.5, marginTop: 1, color: over ? C.over : C.faint }}>{rem > 900 ? '—' : rem + '%'}</div>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: 'right', width: 78 }}>
          <div style={{ ...T.display, ...TNUM, fontSize: 30, color: C.ink, lineHeight: 1 }}>{item.calories}</div>
          <div style={{ ...T.mono, fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.faint, marginTop: 3 }}>cal · {pctRemaining(item.calories, budget.cal)}%</div>
        </div>
      </div>
    </div>
  );
}

function StationBlock({ station, budget, selId, onPick, matches }) {
  const visible = station.items.filter(matches);
  return (
    <div data-station={station.name}>
      <div style={{ position: 'sticky', top: 0, zIndex: 1, background: C.paper, padding: '16px 22px 8px', borderBottom: `6px solid ${C.ink}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ ...T.display, fontSize: 24, color: C.ink, textTransform: 'uppercase' }}>{station.name}</span>
        <span style={{ ...T.mono, fontSize: 10, color: C.muted, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{visible.length} items</span>
      </div>
      {station.items.map((it) => (
        <FoodRow key={it.id} item={it} budget={budget} active={it.id === selId} dim={!matches(it)} onPick={onPick} />
      ))}
    </div>
  );
}

function BudgetHero({ budget }) {
  const pctEaten = Math.round((budget.cal.eaten / Math.max(1, budget.cal.goal)) * 100);
  return (
    <div style={{ padding: '18px 20px 16px', background: C.paper, borderBottom: `1px solid ${C.hair}` }}>
      <Rule w={8} />
      <Eyebrow style={{ marginTop: 9 }}>Remaining today</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 }}>
        <div style={{ ...T.display, ...TNUM, fontSize: 68, lineHeight: 0.85, color: C.ink }}>{budget.cal.left}</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ ...T.heavy, fontSize: 21, color: C.ink }}>Calories</div>
          <div style={{ ...T.mono, ...TNUM, fontSize: 10.5, color: C.muted, marginTop: 4 }}>of {budget.cal.goal} · {pctEaten}% eaten</div>
        </div>
      </div>
      <Rule w={3} my={12} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MacroMeter label="Protein" m={budget.p} />
        <MacroMeter label="Carbs" m={budget.c} />
        <MacroMeter label="Fat" m={budget.f} />
      </div>
    </div>
  );
}

function FocusLabel({ item, budget, onLog, loggedCount }) {
  const rows = [
    ['Total Calories', item.calories, '', budget.cal],
    ['Protein', macro(item, 'protein'), 'g', budget.p],
    ['Carbohydrates', macro(item, 'carbs'), 'g', budget.c],
    ['Fat', macro(item, 'fat'), 'g', budget.f],
  ];
  const after = projectAfter(item, budget);
  const over = overflows(item, budget);
  return (
    <div style={{ background: C.paper }}>
      <div style={{ padding: '16px 20px 6px' }}>
        <Eyebrow>Item · per serving</Eyebrow>
        <div style={{ ...T.display, fontSize: 22, color: C.ink, marginTop: 6, lineHeight: 1.05 }}>{item.name}</div>
        <div style={{ ...T.body, fontSize: 12.5, color: C.muted, marginTop: 3 }}>{[item.serving, item.dining_court, item.station].filter(Boolean).join(' · ')}</div>
      </div>
      <div style={{ padding: '0 20px' }}>
        <Rule w={6} my={8} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ ...T.display, fontSize: 22, color: C.ink }}>Calories</span>
          <span style={{ ...T.display, ...TNUM, fontSize: 46, color: C.ink, lineHeight: 0.9 }}>{item.calories}</span>
        </div>
        <Rule w={3} my={8} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 14px', ...T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.faint, paddingBottom: 5 }}>
          <span /><span style={{ textAlign: 'right' }}>% left</span><span style={{ textAlign: 'right' }}>% goal</span>
        </div>
        <Rule w={1} color={C.hair} />
        {rows.map(([k, v, u, m]) => {
          const rem = pctRemaining(v, m), isOver = rem > 100;
          return (
            <div key={k}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 14px', alignItems: 'baseline', padding: '9px 0' }}>
                <span><span style={{ ...T.heavy, fontSize: 15, color: C.ink }}>{k}</span>{' '}<span style={{ ...T.mono, ...TNUM, fontSize: 12, color: C.muted }}>{v}{u}</span></span>
                <span style={{ ...T.display, ...TNUM, fontSize: 17, textAlign: 'right', color: isOver ? C.over : C.ink }}>{rem > 900 ? '—' : rem + '%'}</span>
                <span style={{ ...T.mono, ...TNUM, fontSize: 12, textAlign: 'right', color: C.faint }}>{pctGoal(v, m)}%</span>
              </div>
              <Rule w={1} color={C.hair2} />
            </div>
          );
        })}
      </div>
      <div style={{ margin: '12px 0 0', background: C.ink, color: C.paper, padding: '13px 20px' }}>
        <div style={{ ...T.mono, fontSize: 9.5, letterSpacing: '0.20em', textTransform: 'uppercase', opacity: 0.65 }}>After you eat this</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 8 }}>
          {[['kcal', after.cal], ['P', after.p + 'g'], ['C', after.c + 'g'], ['F', after.f + 'g']].map(([k, v]) => {
            const neg = parseFloat(v) < 0;
            return (
              <div key={k}>
                <div style={{ ...T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.55 }}>{k} left</div>
                <div style={{ ...T.display, ...TNUM, fontSize: 20, marginTop: 2, color: neg ? C.accent : C.paper }}>{v}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding: '14px 20px 8px' }}>
        <button onClick={() => onLog(item)} style={{ width: '100%', border: 'none', background: C.accent, color: C.accentInk, padding: '15px 18px', cursor: 'pointer', ...T.display, letterSpacing: '0.10em', textTransform: 'uppercase', fontSize: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{loggedCount > 0 ? `Log another · ${loggedCount} today` : 'Log this serving'}</span>
          <span style={{ ...T.mono, fontSize: 13 }}>+{item.calories} kcal</span>
        </button>
        <div style={{ ...T.mono, fontSize: 9.5, color: C.faint, marginTop: 11, lineHeight: 1.5 }}>
          {over.length === 0 ? '\u2713 Fits inside everything you have left tonight.' : `\u26a0 Over your remaining ${over.join(' \u00b7 ')} for today.`}{' '}
          Percent-left is vs your {budget.cal.left} kcal remaining — not a generic 2,000-cal diet.
        </div>
      </div>
    </div>
  );
}

export default function MenuLedger({ stations, budget, selected, onSelect, onLog, getCount, filters, onToggleFilter, matches, activeStation, onPickStation, headerNote }) {
  const scrollRef = useRef(null);
  const pick = (name) => {
    onPickStation(name);
    const el = scrollRef.current?.querySelector(`[data-station="${name}"]`);
    if (el && scrollRef.current) scrollRef.current.scrollTo({ top: el.offsetTop - 4, behavior: 'smooth' });
  };
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, background: C.paper }}>
      <Rail stations={stations} active={activeStation} onPick={pick} filters={filters} onToggleFilter={onToggleFilter} />
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', background: C.paper }}>
        <div style={{ padding: '20px 22px 10px' }}>
          <Eyebrow>{headerNote}</Eyebrow>
          <div style={{ ...T.display, fontSize: 46, lineHeight: 0.92, color: C.ink, marginTop: 6 }}>Nutrition Facts</div>
          <div style={{ ...T.body, fontSize: 13.5, color: C.muted, marginTop: 8, maxWidth: 520 }}>
            Every percent below is measured against{' '}
            <b style={{ color: C.ink }}>what you have left to eat today</b> — {budget.cal.left} kcal, {budget.p.left}g protein, {budget.c.left}g carbs, {budget.f.left}g fat.
          </div>
        </div>
        <Rule w={1} color={C.hair} />
        {stations.map((s) => (
          <StationBlock key={s.name} station={s} budget={budget} selId={selected?.id} onPick={onSelect} matches={matches} />
        ))}
        <div style={{ height: 40 }} />
      </div>
      <div style={{ width: 364, flex: '0 0 364px', borderLeft: `1px solid ${C.hair}`, background: C.paper, display: 'flex', flexDirection: 'column' }}>
        <BudgetHero budget={budget} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {selected && <FocusLabel item={selected} budget={budget} onLog={onLog} loggedCount={getCount ? getCount(selected.id) : 0} />}
        </div>
      </div>
    </div>
  );
}
