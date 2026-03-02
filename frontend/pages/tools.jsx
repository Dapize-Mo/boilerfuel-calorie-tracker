import { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMeals } from '../context/MealContext';
import { useSmartBack } from '../utils/useSmartBack';

const ACTIVITY_LEVELS = [
  { value: 1.2,   label: 'Sedentary',        desc: 'Little or no exercise' },
  { value: 1.375, label: 'Lightly Active',   desc: '1–3 days/week' },
  { value: 1.55,  label: 'Moderately Active',desc: '3–5 days/week' },
  { value: 1.725, label: 'Very Active',       desc: '6–7 days/week' },
  { value: 1.9,   label: 'Extra Active',      desc: 'Hard daily exercise or physical job' },
];

const GOALS = [
  { value: -500, label: 'Lose Weight',        desc: '~0.5 kg / 1 lb per week' },
  { value: -250, label: 'Lose Weight Slowly', desc: '~0.25 kg / 0.5 lb per week' },
  { value: 0,    label: 'Maintain',           desc: 'Keep current weight' },
  { value: 250,  label: 'Gain Slowly',        desc: '~0.25 kg / 0.5 lb per week' },
  { value: 500,  label: 'Gain Weight',        desc: '~0.5 kg / 1 lb per week' },
];

function calcBMR({ sex, weightKg, heightCm, age }) {
  if (!weightKg || !heightCm || !age) return null;
  // Mifflin–St Jeor equation
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return weightKg / (h * h);
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
  if (bmi < 25)   return { label: 'Normal',       color: 'text-green-500' };
  if (bmi < 30)   return { label: 'Overweight',   color: 'text-yellow-500' };
  return               { label: 'Obese',          color: 'text-red-500' };
}

function macroSplit(calories, split = 'balanced') {
  const splits = {
    balanced:    { protein: 0.30, carbs: 0.40, fat: 0.30 },
    highprotein: { protein: 0.40, carbs: 0.35, fat: 0.25 },
    lowcarb:     { protein: 0.35, carbs: 0.20, fat: 0.45 },
    keto:        { protein: 0.25, carbs: 0.05, fat: 0.70 },
  };
  const s = splits[split] || splits.balanced;
  return {
    protein: Math.round((calories * s.protein) / 4),
    carbs:   Math.round((calories * s.carbs)   / 4),
    fat:     Math.round((calories * s.fat)     / 9),
  };
}

const inputCls = 'w-full border border-theme-text-primary/20 bg-transparent text-theme-text-primary px-3 py-2 text-sm font-mono placeholder:text-theme-text-tertiary/40 focus:outline-none focus:border-theme-text-primary/50 transition-colors';
const labelCls = 'block text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-1.5';

export default function ToolsPage() {
  const goBack = useSmartBack();
  const { setGoals } = useMeals();

  const [unit, setUnit] = useState('imperial'); // 'imperial' | 'metric'
  const [sex, setSex] = useState('male');
  const [age, setAge] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activity, setActivity] = useState(1.55);
  const [goalDelta, setGoalDelta] = useState(0);
  const [macroSplitKey, setMacroSplitKey] = useState('balanced');
  const [applied, setApplied] = useState(false);

  const derived = useMemo(() => {
    const wKg = unit === 'imperial'
      ? (parseFloat(weightLbs) || 0) * 0.453592
      : parseFloat(weightKg) || 0;
    const hCm = unit === 'imperial'
      ? ((parseFloat(heightFt) || 0) * 30.48 + (parseFloat(heightIn) || 0) * 2.54)
      : parseFloat(heightCm) || 0;
    const a = parseInt(age) || 0;

    if (!wKg || !hCm || !a) return null;

    const bmr = calcBMR({ sex, weightKg: wKg, heightCm: hCm, age: a });
    const tdee = Math.round(bmr * activity);
    const targetCal = Math.max(1200, tdee + goalDelta);
    const bmi = calcBMI(wKg, hCm);
    const macros = macroSplit(targetCal, macroSplitKey);

    return { bmr: Math.round(bmr), tdee, targetCal, bmi, macros, wKg, hCm };
  }, [unit, sex, age, heightFt, heightIn, heightCm, weightLbs, weightKg, activity, goalDelta, macroSplitKey]);

  function applyToProfile() {
    if (!derived) return;
    setGoals({
      calories: derived.targetCal,
      protein: derived.macros.protein,
      carbs: derived.macros.carbs,
      fat: derived.macros.fat,
    });
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  }

  const bmi = derived?.bmi;
  const bmiCat = bmi ? bmiCategory(bmi) : null;

  return (
    <>
      <Head>
        <title>Tools — BoilerFuel</title>
        <meta name="description" content="TDEE and BMI calculator. Get personalized calorie and macro recommendations based on your body and goals." />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 sm:py-20 space-y-10">

          {/* Header */}
          <header className="space-y-4">
            <button onClick={goBack} className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </button>
            <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.2em]">Tools</h1>
            <div className="w-12 h-px bg-theme-text-primary/30" />
            <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
              TDEE &amp; BMI Calculator
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ── Inputs ── */}
            <section className="border border-theme-text-primary/10 p-6 space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                Your Stats
              </h2>

              {/* Unit toggle */}
              <div className="flex gap-px">
                {['imperial', 'metric'].map(u => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors ${unit === u ? 'bg-theme-text-primary text-theme-bg-primary' : 'border border-theme-text-primary/20 text-theme-text-tertiary hover:text-theme-text-primary'}`}
                  >
                    {u}
                  </button>
                ))}
              </div>

              {/* Sex */}
              <div>
                <label className={labelCls}>Biological Sex</label>
                <div className="flex gap-px">
                  {['male', 'female'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSex(s)}
                      className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors ${sex === s ? 'bg-theme-text-primary text-theme-bg-primary' : 'border border-theme-text-primary/20 text-theme-text-tertiary hover:text-theme-text-primary'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div>
                <label className={labelCls}>Age (years)</label>
                <input
                  type="number" min="10" max="120"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className={inputCls}
                  placeholder="20"
                />
              </div>

              {/* Height */}
              {unit === 'imperial' ? (
                <div>
                  <label className={labelCls}>Height</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number" min="3" max="8"
                        value={heightFt}
                        onChange={e => setHeightFt(e.target.value)}
                        className={inputCls}
                        placeholder="5"
                      />
                      <span className="text-[10px] text-theme-text-tertiary/50 mt-1 block">ft</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number" min="0" max="11"
                        value={heightIn}
                        onChange={e => setHeightIn(e.target.value)}
                        className={inputCls}
                        placeholder="10"
                      />
                      <span className="text-[10px] text-theme-text-tertiary/50 mt-1 block">in</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className={labelCls}>Height (cm)</label>
                  <input
                    type="number" min="100" max="250"
                    value={heightCm}
                    onChange={e => setHeightCm(e.target.value)}
                    className={inputCls}
                    placeholder="178"
                  />
                </div>
              )}

              {/* Weight */}
              <div>
                <label className={labelCls}>Weight ({unit === 'imperial' ? 'lbs' : 'kg'})</label>
                <input
                  type="number" min="30"
                  value={unit === 'imperial' ? weightLbs : weightKg}
                  onChange={e => unit === 'imperial' ? setWeightLbs(e.target.value) : setWeightKg(e.target.value)}
                  className={inputCls}
                  placeholder={unit === 'imperial' ? '165' : '75'}
                />
              </div>

              {/* Activity level */}
              <div>
                <label className={labelCls}>Activity Level</label>
                <div className="space-y-1">
                  {ACTIVITY_LEVELS.map(lvl => (
                    <button
                      key={lvl.value}
                      onClick={() => setActivity(lvl.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${activity === lvl.value ? 'bg-theme-text-primary text-theme-bg-primary' : 'border border-theme-text-primary/10 hover:border-theme-text-primary/30'}`}
                    >
                      <span className="text-xs uppercase tracking-wider">{lvl.label}</span>
                      <span className={`text-[10px] tracking-wide ${activity === lvl.value ? 'text-theme-bg-primary/70' : 'text-theme-text-tertiary'}`}>{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className={labelCls}>Goal</label>
                <div className="space-y-1">
                  {GOALS.map(g => (
                    <button
                      key={g.value}
                      onClick={() => setGoalDelta(g.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${goalDelta === g.value ? 'bg-theme-text-primary text-theme-bg-primary' : 'border border-theme-text-primary/10 hover:border-theme-text-primary/30'}`}
                    >
                      <span className="text-xs uppercase tracking-wider">{g.label}</span>
                      <span className={`text-[10px] tracking-wide ${goalDelta === g.value ? 'text-theme-bg-primary/70' : 'text-theme-text-tertiary'}`}>{g.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Macro split */}
              <div>
                <label className={labelCls}>Macro Split</label>
                <div className="grid grid-cols-2 gap-px">
                  {[
                    { key: 'balanced',    label: 'Balanced',     sub: '30/40/30' },
                    { key: 'highprotein', label: 'High Protein', sub: '40/35/25' },
                    { key: 'lowcarb',     label: 'Low Carb',     sub: '35/20/45' },
                    { key: 'keto',        label: 'Keto',         sub: '25/5/70' },
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => setMacroSplitKey(m.key)}
                      className={`py-2.5 text-center transition-colors ${macroSplitKey === m.key ? 'bg-theme-text-primary text-theme-bg-primary' : 'border border-theme-text-primary/10 hover:border-theme-text-primary/30'}`}
                    >
                      <div className="text-xs uppercase tracking-wider">{m.label}</div>
                      <div className={`text-[10px] mt-0.5 ${macroSplitKey === m.key ? 'text-theme-bg-primary/60' : 'text-theme-text-tertiary'}`}>{m.sub} P/C/F %</div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Results ── */}
            <section className="space-y-6">
              {!derived ? (
                <div className="border border-theme-text-primary/10 p-6">
                  <p className="text-xs uppercase tracking-widest text-theme-text-tertiary">Fill in your stats to see results</p>
                </div>
              ) : (
                <>
                  {/* BMI */}
                  <div className="border border-theme-text-primary/10 p-6 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">BMI</h3>
                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-bold tabular-nums">{bmi.toFixed(1)}</span>
                      {bmiCat && <span className={`text-sm uppercase tracking-widest mb-1.5 ${bmiCat.color}`}>{bmiCat.label}</span>}
                    </div>
                    {/* BMI scale bar */}
                    <div className="space-y-1">
                      <div className="relative h-2 bg-theme-text-primary/10 overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-[40%] bg-blue-400/40" />
                        <div className="absolute inset-y-0 left-[40%] w-[27%] bg-green-400/40" />
                        <div className="absolute inset-y-0 left-[67%] w-[13%] bg-yellow-400/40" />
                        <div className="absolute inset-y-0 left-[80%] right-0 bg-red-400/40" />
                        {/* Indicator */}
                        <div
                          className="absolute inset-y-0 w-0.5 bg-theme-text-primary"
                          style={{ left: `${Math.min(98, Math.max(1, ((bmi - 10) / 30) * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-theme-text-tertiary/60 uppercase tracking-wider">
                        <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-[10px] text-theme-text-tertiary">
                      <span><span className="text-blue-400">■</span> Underweight &lt;18.5</span>
                      <span><span className="text-green-400">■</span> Normal 18.5–25</span>
                      <span><span className="text-yellow-400">■</span> Overweight 25–30</span>
                      <span><span className="text-red-400">■</span> Obese &gt;30</span>
                    </div>
                  </div>

                  {/* Calories */}
                  <div className="border border-theme-text-primary/10 p-6 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">Daily Calories</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold tabular-nums">{derived.bmr}</div>
                        <div className="text-[10px] uppercase tracking-wider text-theme-text-tertiary">BMR</div>
                        <div className="text-[9px] text-theme-text-tertiary/50">At rest</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold tabular-nums">{derived.tdee}</div>
                        <div className="text-[10px] uppercase tracking-wider text-theme-text-tertiary">TDEE</div>
                        <div className="text-[9px] text-theme-text-tertiary/50">Maintenance</div>
                      </div>
                      <div className="space-y-1 border border-theme-text-primary/20 py-2">
                        <div className="text-2xl font-bold tabular-nums">{derived.targetCal}</div>
                        <div className="text-[10px] uppercase tracking-wider text-theme-text-tertiary">Target</div>
                        <div className="text-[9px] text-theme-text-tertiary/50">Your goal</div>
                      </div>
                    </div>
                    {goalDelta !== 0 && (
                      <p className="text-[10px] text-theme-text-tertiary/60 border-t border-theme-text-primary/10 pt-3">
                        {goalDelta < 0 ? `${Math.abs(goalDelta)} kcal deficit from TDEE` : `${goalDelta} kcal surplus above TDEE`}
                      </p>
                    )}
                  </div>

                  {/* Macros */}
                  <div className="border border-theme-text-primary/10 p-6 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">Recommended Macros</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Protein', value: derived.macros.protein, unit: 'g', cal: derived.macros.protein * 4 },
                        { label: 'Carbs',   value: derived.macros.carbs,   unit: 'g', cal: derived.macros.carbs * 4   },
                        { label: 'Fat',     value: derived.macros.fat,     unit: 'g', cal: derived.macros.fat * 9     },
                      ].map(m => {
                        const pct = Math.round((m.cal / derived.targetCal) * 100);
                        return (
                          <div key={m.label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-theme-text-secondary uppercase tracking-wider">{m.label}</span>
                              <span className="font-mono tabular-nums text-theme-text-tertiary">
                                {m.value}{m.unit} <span className="opacity-50">({pct}%)</span>
                              </span>
                            </div>
                            <div className="h-1.5 bg-theme-text-primary/10 overflow-hidden">
                              <div className="h-full bg-theme-text-primary/50 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Apply to profile */}
                  <button
                    onClick={applyToProfile}
                    className="w-full py-3 bg-theme-text-primary text-theme-bg-primary text-xs font-bold uppercase tracking-widest hover:bg-theme-text-secondary transition-colors"
                  >
                    {applied ? 'Applied to Profile ✓' : 'Apply Goals to Profile'}
                  </button>
                  {applied && (
                    <p className="text-[10px] text-theme-text-tertiary text-center">
                      Your calorie and macro goals have been updated.{' '}
                      <Link href="/profile" className="underline hover:text-theme-text-primary">View Profile</Link>
                    </p>
                  )}

                  {/* Disclaimer */}
                  <p className="text-[10px] text-theme-text-tertiary/50 leading-relaxed">
                    Estimates are based on the Mifflin–St Jeor equation. For personalized advice consult a registered dietitian.
                  </p>
                </>
              )}
            </section>
          </div>

          {/* Footer */}
          <footer className="border-t border-theme-text-primary/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-widest">
              <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
              <Link href="/stats" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Stats</Link>
              <Link href="/compare" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Compare</Link>
              <Link href="/profile" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Profile</Link>
              <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-theme-text-tertiary/40">BoilerFuel · {new Date().getFullYear()}</span>
          </footer>

        </div>
      </div>
    </>
  );
}

ToolsPage.getLayout = (page) => page;
