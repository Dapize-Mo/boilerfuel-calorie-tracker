// components/MenuLayoutSetting.jsx
// Drop-in Profile → Settings control for choosing the default Nutrition-Facts
// menu layout. Shares state with the /menu header toggle via useMenuLayout().

import { useMenuLayout } from '../utils/menuLayout';

const OPTIONS = [
  { value: 'ledger', title: 'Ledger', desc: 'Stations rail + a running list of label rows, with a sticky budget and full label on the right. Best for scanning a whole hall.' },
  { value: 'spread', title: 'Spread', desc: 'A grid of compact label cards with one large Nutrition Facts label for the item you pick. Best for comparing a few dishes.' },
];

export default function MenuLayoutSetting() {
  const [layout, setLayout] = useMenuLayout();

  return (
    <section className="border border-theme-card-border bg-theme-card-bg p-5 sm:p-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="font-black uppercase tracking-tight text-theme-text-primary">Menu layout</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-theme-text-tertiary">
          Nutrition Facts
        </span>
      </div>
      <p className="mb-4 text-sm text-theme-text-secondary">
        How the dining-court menu is laid out on desktop. Each percentage is shown
        against what you have left to eat today, alongside your daily goal.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const active = layout === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLayout(opt.value)}
              aria-pressed={active}
              className={`text-left border p-4 transition-colors min-h-[44px] ${
                active
                  ? 'border-theme-accent bg-theme-accent/10'
                  : 'border-theme-border-secondary bg-theme-bg-secondary hover:bg-theme-bg-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold uppercase tracking-tight text-theme-text-primary">{opt.title}</span>
                <span
                  className={`h-4 w-4 border-2 ${
                    active ? 'border-theme-accent bg-theme-accent' : 'border-theme-border-secondary'
                  }`}
                />
              </div>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-theme-text-tertiary">{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
