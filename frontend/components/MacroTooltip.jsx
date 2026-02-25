const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function MacroTooltip({ food, pos }) {
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
        <span className="text-right text-theme-text-primary">{macros.protein ?? '\u2014'}g</span>
        <span className="text-theme-text-tertiary">Carbs</span>
        <span className="text-right text-theme-text-primary">{macros.carbs ?? '\u2014'}g</span>
        <span className="text-theme-text-tertiary">Fat</span>
        <span className="text-right text-theme-text-primary">{macros.fats ?? macros.fat ?? '\u2014'}g</span>
      </div>
      {food.station && (
        <div className="mt-2 pt-2 border-t border-theme-text-primary/10 text-theme-text-tertiary">
          Station: {food.station}
        </div>
      )}
    </div>
  );
}
