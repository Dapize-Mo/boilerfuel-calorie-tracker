import { C, T, TNUM, Rule, Eyebrow, FitMark, DietTag, dietTagsFor } from './labelUI';
import { macro, pctRemaining, pctGoal, fitsCleanly, overflows, projectAfter } from '../../utils/menuMath';

// components/menu/MenuSpread.jsx — "The Spread" layout (Direction C).
// A horizontal Remaining-Today banner + dietary filters up top, a station-tabbed
// grid of label CARDS on the left, and one large FDA nutrition-label "spread"
// for the focused item (with an "after you eat this" projection) on the right.




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

function Meter({ label, m }) {
  const pe = Math.min(100, Math.round((m.eaten / Math.max(1, m.goal)) * 100));
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ ...T.heavy, fontSize: 13, color: C.ink }}>{label}</span>
        <span style={{ ...T.mono, ...TNUM, fontSize: 11, color: C.muted }}><b style={{ color: C.ink }}>{m.left}g</b> left</span>
      </div>
      <div style={{ height: 6, background: C.track, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, width: pe + '%', background: C.ink }} />
      </div>
    </div>
  );
}

export function Banner({ budget, filters, onToggleFilter }) {
  const pctEaten = Math.round((budget.cal.eaten / Math.max(1, budget.cal.goal)) * 100);
  return (
    <div style={{ flex: '0 0 auto', background: C.panel, borderBottom: `1px solid ${C.hair}`, padding: '16px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 30, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto' }}>
          <Eyebrow>Remaining today</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 2 }}>
            <span style={{ ...T.display, ...TNUM, fontSize: 52, lineHeight: 0.8, color: C.ink }}>{budget.cal.left}</span>
            <span style={{ ...T.heavy, fontSize: 15, color: C.muted, marginBottom: 4 }}>kcal · {pctEaten}% eaten</span>
          </div>
        </div>
        <div style={{ width: 1, height: 46, background: C.hair }} />
        <div style={{ flex: 1, display: 'flex', gap: 26, minWidth: 280 }}>
          <Meter label="Protein" m={budget.p} />
          <Meter label="Carbs" m={budget.c} />
          <Meter label="Fat" m={budget.f} />
        </div>
        <div style={{ width: 1, height: 46, background: C.hair }} />
        <div style={{ flex: '0 0 auto' }}>
          <Eyebrow style={{ marginBottom: 8 }}>Dietary</Eyebrow>
          <div style={{ display: 'flex', gap: 6 }}>
            {DIET_FILTERS.map(([k, lbl]) => (
              <button key={k} style={chipStyle(filters[k])} onClick={() => onToggleFilter(k)}>{lbl}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Card({ item, budget, active, dim, onPick }) {
  const fits = fitsCleanly(item, budget);
  const remCal = pctRemaining(item.calories, budget.cal);
  const cells = [['P', macro(item, 'protein'), budget.p], ['C', macro(item, 'carbs'), budget.c], ['F', macro(item, 'fat'), budget.f]];
  return (
    <div onClick={() => onPick(item)} style={{ border: active ? `2px solid ${C.accent}` : `1px solid ${C.hair}`, padding: active ? '13px 15px' : '14px 16px', position: 'relative', opacity: dim ? 0.32 : 1, background: C.paper, cursor: 'pointer' }}>
      {fits && <FitMark size={10} style={{ position: 'absolute', top: 12, right: 12 }} />}
      <div style={{ ...T.heavy, fontSize: 15, color: C.ink, lineHeight: 1.2, minHeight: 36, paddingRight: 16 }}>{item.name}</div>
      {item.serving && <div style={{ ...T.mono, fontSize: 9, color: C.faint, letterSpacing: '0.08em', marginTop: 2 }}>{item.serving}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
        <div>
          <div style={{ ...T.display, ...TNUM, fontSize: 30, lineHeight: 0.85, color: C.ink }}>{item.calories}</div>
          <div style={{ ...T.mono, fontSize: 8.5, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.faint, marginTop: 2 }}>calories</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ ...T.display, ...TNUM, fontSize: 18, color: remCal > 100 ? C.over : C.ink, lineHeight: 1 }}>{remCal > 900 ? '—' : remCal + '%'}</div>
          <div style={{ ...T.mono, fontSize: 8.5, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.faint, marginTop: 2 }}>of left</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginTop: 11, borderTop: `1px solid ${C.hair}` }}>
        {cells.map(([k, v, m], i) => {
          const over = pctRemaining(v, m) > 100;
          return (
            <div key={k} style={{ textAlign: 'center', padding: '7px 0 0', borderLeft: i ? `1px solid ${C.hair2}` : 'none' }}>
              <div style={{ ...T.mono, fontSize: 8.5, letterSpacing: '0.10em', color: C.faint }}>{k}</div>
              <div style={{ ...T.heavy, ...TNUM, fontSize: 13, color: over ? C.over : C.ink, marginTop: 1 }}>{v}g</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Spread({ item, budget, onLog, loggedCount }) {
  const rows = [
    ['Total Calories', item.calories, '', budget.cal],
    ['Protein', macro(item, 'protein'), 'g', budget.p],
    ['Total Carbohydrate', macro(item, 'carbs'), 'g', budget.c],
    ['Total Fat', macro(item, 'fat'), 'g', budget.f],
  ];
  const after = projectAfter(item, budget);
  const over = overflows(item, budget);
  return (
    <div style={{ background: C.paper }}>
      <div style={{ padding: '22px 26px 0' }}>
        <div style={{ ...T.display, fontSize: 44, lineHeight: 0.92, color: C.ink }}>Nutrition Facts</div>
        <Rule w={1} my={10} color={C.ink} />
        {item.serving && <div style={{ ...T.heavy, fontSize: 15, color: C.ink }}>1 serving · {item.serving}</div>}
        <div style={{ ...T.body, fontSize: 13, color: C.muted, marginTop: 2 }}>{[item.name, item.dining_court, item.station].filter(Boolean).join(' · ')}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
          {dietTagsFor(item).map((t) => <DietTag key={t} label={t} />)}
        </div>
        <Rule w={10} my={10} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ ...T.display, fontSize: 26, color: C.ink }}>Calories</span>
          <span style={{ ...T.display, ...TNUM, fontSize: 60, lineHeight: 0.85, color: C.ink }}>{item.calories}</span>
        </div>
        <Rule w={4} my={9} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 18px', ...T.mono, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.faint, paddingBottom: 6 }}>
          <span /><span style={{ textAlign: 'right' }}>% left</span><span style={{ textAlign: 'right' }}>% goal</span>
        </div>
        {rows.map(([k, v, u, m]) => {
          const rem = pctRemaining(v, m), isOver = rem > 100;
          return (
            <div key={k}>
              <Rule w={1} color={C.hair} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 18px', alignItems: 'baseline', padding: '10px 0' }}>
                <span><span style={{ ...T.heavy, fontSize: 16, color: C.ink }}>{k}</span>{' '}<span style={{ ...T.mono, ...TNUM, fontSize: 12.5, color: C.muted }}>{v}{u}</span></span>
                <span style={{ ...T.display, ...TNUM, fontSize: 18, textAlign: 'right', color: isOver ? C.over : C.ink }}>{rem > 900 ? '—' : rem + '%'}</span>
                <span style={{ ...T.mono, ...TNUM, fontSize: 12.5, textAlign: 'right', color: C.faint }}>{pctGoal(v, m)}%</span>
              </div>
            </div>
          );
        })}
        <Rule w={6} />
      </div>
      <div style={{ margin: '14px 26px 0', background: C.ink, color: C.paper, padding: '15px 18px' }}>
        <div style={{ ...T.mono, fontSize: 9.5, letterSpacing: '0.20em', textTransform: 'uppercase', opacity: 0.65 }}>After you eat this</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 9 }}>
          {[['kcal', after.cal], ['P', after.p + 'g'], ['C', after.c + 'g'], ['F', after.f + 'g']].map(([k, v]) => {
            const neg = parseFloat(v) < 0;
            return (
              <div key={k}>
                <div style={{ ...T.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.55 }}>{k} left</div>
                <div style={{ ...T.display, ...TNUM, fontSize: 22, marginTop: 2, color: neg ? C.accent : C.paper }}>{v}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding: '14px 26px 24px' }}>
        <button onClick={() => onLog(item)} style={{ width: '100%', border: 'none', background: C.accent, color: C.accentInk, padding: '15px 18px', cursor: 'pointer', ...T.display, letterSpacing: '0.10em', textTransform: 'uppercase', fontSize: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{loggedCount > 0 ? `Log another · ${loggedCount} today` : 'Log this serving'}</span>
          <span style={{ ...T.mono, fontSize: 13 }}>+{item.calories} kcal</span>
        </button>
        <div style={{ ...T.mono, fontSize: 9.5, color: C.faint, marginTop: 11, lineHeight: 1.5 }}>
          {over.length === 0 ? '\u2713 Fits inside everything you have left tonight.' : `\u26a0 Over your remaining ${over.join(' \u00b7 ')} for today.`}{' '}
          Percent-left is vs your {budget.cal.left} kcal remaining, not a generic 2,000-cal diet.
        </div>
      </div>
    </div>
  );
}

export default function MenuSpread({ stations, budget, selected, onSelect, onLog, getCount, filters, onToggleFilter, matches, activeTab, onPickTab, courtName }) {
  const tabs = ['All', ...stations.map((s) => s.name)];
  const items = stations.flatMap((s) => s.items).filter((it) => activeTab === 'All' || it.station === activeTab);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Banner budget={budget} filters={filters} onToggleFilter={onToggleFilter} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: C.page }}>
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderBottom: `1px solid ${C.hair}`, background: C.panel, flexWrap: 'wrap' }}>
            {courtName && <span style={{ ...T.display, fontSize: 18, color: C.ink, marginRight: 6, textTransform: 'uppercase' }}>{courtName}</span>}
            {tabs.map((t) => (
              <button key={t} style={chipStyle(activeTab === t)} onClick={() => onPickTab(t)}>{t}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {items.map((it) => (
                <Card key={it.id} item={it} budget={budget} active={it.id === selected?.id} dim={!matches(it)} onPick={onSelect} />
              ))}
            </div>
            <div style={{ height: 24 }} />
          </div>
        </div>
        <div style={{ width: 408, flex: '0 0 408px', borderLeft: `1px solid ${C.hair}`, background: C.paper, overflowY: 'auto' }}>
          {selected && <Spread item={selected} budget={budget} onLog={onLog} loggedCount={getCount ? getCount(selected.id) : 0} />}
        </div>
      </div>
    </div>
  );
}
