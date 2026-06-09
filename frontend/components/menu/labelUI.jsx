import { memo } from 'react';

// components/menu/labelUI.jsx
// Shared visual primitives for the Nutrition-Facts menu (both layouts).
// The FDA-label look (heavy Inter caps, tabular mono numbers, hairline rules,
// one-yellow accent) is preserved, but every colour is driven by the app's
// theme CSS variables so it follows the light/dark toggle automatically.



// ── Colour tokens → app theme CSS vars ───────────────────────────────────
export const C = {
  page: 'rgb(var(--color-bg-primary))',
  panel: 'rgb(var(--color-bg-secondary))',
  paper: 'rgb(var(--color-card-bg))',
  paper2: 'rgb(var(--color-bg-tertiary))',
  hover: 'rgb(var(--color-bg-hover))',
  ink: 'rgb(var(--color-text-primary))',
  muted: 'rgb(var(--color-text-secondary))',
  faint: 'rgb(var(--color-text-tertiary))',
  hair: 'rgb(var(--color-border-primary))',
  hair2: 'rgb(var(--color-border-light))',
  track: 'rgb(var(--color-border-secondary))',
  accent: 'rgb(var(--color-accent-primary))',
  accentInk: '#09090b', // near-black — legible on yellow in both themes
  over: 'rgb(var(--color-error))',
  ok: 'rgb(var(--color-success))',
};

// ── Type ──────────────────────────────────────────────────────────────────
const SANS = '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
const MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace';
export const T = {
  display: { fontFamily: SANS, fontWeight: 900, letterSpacing: '-0.04em' },
  heavy: { fontFamily: SANS, fontWeight: 800, letterSpacing: '-0.01em' },
  bold: { fontFamily: SANS, fontWeight: 700 },
  body: { fontFamily: SANS, fontWeight: 500 },
  mono: { fontFamily: MONO },
};
export const TNUM = { fontVariantNumeric: 'tabular-nums' };

// ── Primitives ──────────────────────────────────────────────────────────
export const Rule = memo(function Rule({ w = 1, my = 0, color = C.ink }) {
  return <div style={{ height: w, background: color, margin: `${my}px 0` }} />;
});

export const Eyebrow = memo(function Eyebrow({ children, style }) {
  return (
    <div style={{ ...T.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.faint, ...style }}>
      {children}
    </div>
  );
});

// little yellow square = "fits cleanly in what you have left"
export const FitMark = memo(function FitMark({ size = 9, style }) {
  return <span style={{ display: 'inline-block', width: size, height: size, background: C.accent, ...style }} />;
});

export const DietTag = memo(function DietTag({ label }) {
  return (
    <span style={{ ...T.mono, fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.muted, border: `1px solid ${C.hair}`, padding: '2px 5px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
});

// thin progress meter (eaten vs goal) with the remaining amount called out
export const MacroMeter = memo(function MacroMeter({ label, m, unit = 'g' }) {
  const pe = Math.min(100, Math.round((m.eaten / Math.max(1, m.goal)) * 100));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ ...T.heavy, fontSize: 13, color: C.ink }}>
          {label}{' '}
          <span style={{ ...T.mono, ...TNUM, fontWeight: 500, fontSize: 11.5, color: C.muted }}>{m.left}{unit} left</span>
        </span>
        <span style={{ ...T.mono, ...TNUM, fontSize: 11, color: C.faint }}>{m.eaten}/{m.goal}{unit}</span>
      </div>
      <div style={{ height: 6, background: C.track, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, width: pe + '%', background: C.ink }} />
      </div>
    </div>
  );
});

// diet/allergen tags for a food, derived from optional metadata
export function dietTagsFor(food) {
  const tags = [].concat(food.dietary || [], food.tags || []).map((t) => String(t).toLowerCase());
  const out = [];
  if (tags.includes('vegan')) out.push('Vegan');
  else if (tags.includes('vegetarian')) out.push('Veg');
  (food.allergens || []).forEach((a) => out.push(String(a)));
  return out;
}
