import { useEffect, useState } from 'react';
import { useMeals } from '../context/MealContext';

const ONBOARDED_KEY = 'boilerfuel_onboarded';

const STEPS = [
  {
    title: 'Welcome to BoilerFuel',
    subtitle: 'Nutrition tracker built for Purdue',
  },
  {
    title: 'Set your daily goal',
    subtitle: 'How many calories do you want to eat per day?',
  },
  {
    title: "You're all set",
    subtitle: 'Start tracking your meals at Purdue dining halls.',
  },
];

const CALORIE_PRESETS = [1500, 1800, 2000, 2500];

export default function Onboarding() {
  const { mealsByDate, setGoals } = useMeals();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [calorieInput, setCalorieInput] = useState('2000');

  useEffect(() => {
    // Don't show if already onboarded
    if (localStorage.getItem(ONBOARDED_KEY)) return;
    // Don't show if user already has meal data (returning user who cleared storage)
    if (Object.keys(mealsByDate).length > 0) {
      localStorage.setItem(ONBOARDED_KEY, '1');
      return;
    }
    setVisible(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFinish(calories) {
    const cal = Math.max(1000, Math.min(5000, parseInt(calories) || 2000));
    // Standard macro split from calories
    setGoals({
      calories: cal,
      protein: Math.round((cal * 0.30) / 4),
      carbs: Math.round((cal * 0.45) / 4),
      fat: Math.round((cal * 0.25) / 9),
    });
    localStorage.setItem(ONBOARDED_KEY, '1');
    setVisible(false);
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDED_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to BoilerFuel"
    >
      <div className="w-full max-w-sm bg-theme-bg-primary border border-theme-text-primary/20">
        {/* Amber top strip */}
        <div className="h-1 bg-gradient-to-r from-yellow-400 to-yellow-500" />

        {/* Step indicators */}
        <div className="flex gap-1.5 px-6 pt-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 transition-colors duration-300 ${
                i <= step ? 'bg-yellow-400' : 'bg-theme-text-primary/10'
              }`}
            />
          ))}
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-yellow-500/80">
                    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1.001a3.75 3.75 0 011.89-3.334 3.75 3.75 0 013.29 3.505z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-theme-text-primary">{STEPS[0].title}</h2>
                  <p className="text-xs text-theme-text-tertiary mt-0.5 uppercase tracking-widest">{STEPS[0].subtitle}</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-theme-text-secondary">
                {[
                  ['🍽️', 'Search real menus from Purdue dining halls & retail'],
                  ['📊', 'Track calories, protein, carbs, fat & more'],
                  ['📱', 'All data stays on your device — no account needed'],
                  ['🔄', 'Optional Google Fit sync & cross-device pairing'],
                ].map(([icon, text]) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="text-base leading-tight shrink-0">{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setStep(1)}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-900 font-bold text-sm uppercase tracking-wider transition-colors"
              >
                Get Started
              </button>
            </>
          )}

          {/* Step 1: Set calorie goal */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-theme-text-primary">{STEPS[1].title}</h2>
                <p className="text-xs text-theme-text-tertiary mt-1 uppercase tracking-widest">{STEPS[1].subtitle}</p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {CALORIE_PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => setCalorieInput(String(p))}
                      className={`px-3 py-1.5 text-xs font-bold border transition-colors ${
                        calorieInput === String(p)
                          ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                          : 'border-theme-text-primary/20 text-theme-text-tertiary hover:border-theme-text-primary/50'
                      }`}
                    >
                      {p.toLocaleString()} cal
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    max="5000"
                    step="50"
                    value={calorieInput}
                    onChange={e => setCalorieInput(e.target.value)}
                    className="w-full border border-theme-text-primary/30 bg-theme-bg-secondary text-theme-text-primary px-4 py-3 font-mono text-lg text-center focus:border-yellow-400 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-theme-text-tertiary">kcal/day</span>
                </div>

                <p className="text-xs text-theme-text-tertiary">
                  You can always change this later in Profile → Settings.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2.5 border border-theme-text-primary/20 text-theme-text-tertiary text-xs font-bold uppercase tracking-wider hover:text-theme-text-primary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    handleFinish(calorieInput);
                    setStep(2);
                  }}
                  className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold text-sm uppercase tracking-wider transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Step 2: Done */}
          {step === 2 && (
            <>
              <div className="text-center py-2">
                <div className="text-4xl mb-3">🎉</div>
                <h2 className="text-xl font-bold text-theme-text-primary">{STEPS[2].title}</h2>
                <p className="text-sm text-theme-text-tertiary mt-2">{STEPS[2].subtitle}</p>
              </div>

              <ul className="space-y-2 text-xs text-theme-text-secondary border border-theme-text-primary/10 p-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-400/70 shrink-0" />
                  Search foods in the main menu by dining hall
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-400/70 shrink-0" />
                  Tap + to log a food item to today&apos;s log
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-400/70 shrink-0" />
                  Visit Profile to adjust goals & export data
                </li>
              </ul>

              <button
                onClick={() => setVisible(false)}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold text-sm uppercase tracking-wider transition-colors"
              >
                Start Tracking
              </button>
            </>
          )}
        </div>

        {step < 2 && (
          <div className="px-6 pb-5 text-center">
            <button
              onClick={handleSkip}
              className="text-xs text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
            >
              Skip setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
