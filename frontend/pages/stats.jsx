import { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { useMeals } from '../context/MealContext';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDate(dateKey, delta) {
  const d = new Date(dateKey + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(key) {
  const d = new Date(key + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function formatShort(key) {
  const d = new Date(key + 'T00:00:00');
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return { day: days[d.getDay()], date: d.getDate() };
}

// ── Simple SVG Pie Chart ──
function PieChart({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="text-xs text-theme-text-tertiary uppercase tracking-widest">No data</div>
    </div>
  );

  const cx = size / 2, cy = size / 2, r = size / 2 - 8;
  let angle = -90;
  const slices = data.filter(d => d.value > 0).map(d => {
    const pct = d.value / total;
    const startAngle = angle;
    angle += pct * 360;
    const endAngle = angle;
    const largeArc = pct > 0.5 ? 1 : 0;
    const rad = Math.PI / 180;
    const x1 = cx + r * Math.cos(startAngle * rad);
    const y1 = cy + r * Math.sin(startAngle * rad);
    const x2 = cx + r * Math.cos(endAngle * rad);
    const y2 = cy + r * Math.sin(endAngle * rad);
    return { ...d, pct, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z` };
  });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="rgb(var(--color-bg-primary))" strokeWidth="2" />
        ))}
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-theme-text-secondary">{d.label}</span>
            <span className="font-mono tabular-nums text-theme-text-tertiary">{Math.round(d.value)}g</span>
            <span className="text-theme-text-tertiary/60">({total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar Chart (for daily overview) ──
function BarChart({ data, max, height = 120, label = '' }) {
  const actualMax = max || Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {label && <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-2">{label}</div>}
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => {
          const pct = Math.min((d.value / actualMax) * 100, 100);
          const isToday = d.date === getTodayKey();
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.label}: ${Math.round(d.value)}`}>
              <div className="text-[9px] font-mono tabular-nums text-theme-text-tertiary/60" style={{ opacity: d.value > 0 ? 1 : 0 }}>
                {Math.round(d.value)}
              </div>
              <div className="w-full relative" style={{ height: height - 30 }}>
                <div
                  className={`absolute bottom-0 w-full transition-all duration-300 ${isToday ? 'bg-theme-text-primary' : 'bg-theme-text-primary/40'}`}
                  style={{ height: `${pct}%`, minHeight: d.value > 0 ? 2 : 0 }}
                />
              </div>
              <div className={`text-[9px] ${isToday ? 'font-bold text-theme-text-primary' : 'text-theme-text-tertiary'}`}>{d.dayLabel}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Line Chart ──
function LineChart({ data, max, height = 120, label = '', color = 'rgb(var(--color-text-primary))', goalLine }) {
  const actualMax = max || Math.max(...data.map(d => d.value), 1);
  const padding = { top: 20, right: 8, bottom: 24, left: 8 };
  const chartW = 100; // percentage-based
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: data.length > 1 ? (i / (data.length - 1)) * 100 : 50,
    y: padding.top + chartH - (Math.min(d.value / actualMax, 1) * chartH),
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1]?.x ?? 0} ${padding.top + chartH} L ${points[0]?.x ?? 0} ${padding.top + chartH} Z`;

  const goalY = goalLine ? padding.top + chartH - (Math.min(goalLine / actualMax, 1) * chartH) : null;

  return (
    <div>
      {label && <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-2">{label}</div>}
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="overflow-visible">
        {/* Fill area */}
        <path d={areaD} fill={color} opacity="0.08" />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="0.8" opacity="0.8" />
        {/* Goal line */}
        {goalY != null && (
          <line x1="0" y1={goalY} x2="100" y2={goalY} stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 2" className="text-theme-text-tertiary" />
        )}
        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={data.length <= 14 ? 1.2 : 0.6} fill={p.date === getTodayKey() ? color : 'currentColor'} className={p.date === getTodayKey() ? '' : 'text-theme-text-primary/40'} />
        ))}
      </svg>
      {/* X-axis labels */}
      <div className="flex justify-between mt-1">
        {data.length <= 14 ? data.map((d, i) => (
          <div key={i} className={`text-[9px] flex-1 text-center ${d.date === getTodayKey() ? 'font-bold text-theme-text-primary' : 'text-theme-text-tertiary'}`}>
            {d.dayLabel}
          </div>
        )) : (
          <>
            <span className="text-[9px] text-theme-text-tertiary">{data[0]?.dayLabel}</span>
            <span className="text-[9px] text-theme-text-tertiary">{data[Math.floor(data.length / 2)]?.dayLabel}</span>
            <span className="text-[9px] text-theme-text-tertiary">{data[data.length - 1]?.dayLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Stacked Bar Chart (for meal-time breakdown) ──
function StackedBarChart({ data, height = 120 }) {
  const mealKeys = ['breakfast', 'brunch', 'lunch', 'dinner', 'other'];
  const colors = { breakfast: '#3b82f6', brunch: '#8b5cf6', lunch: '#f59e0b', dinner: '#f97316', other: 'rgba(128,128,128,0.25)' };
  const maxVal = Math.max(...data.map(d => mealKeys.reduce((s, k) => s + (d[k] || 0), 0)), 1);
  const usedKeys = mealKeys.filter(k => data.some(d => (d[k] || 0) > 0));
  const barH = height - 30;
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: barH }}>
        {data.map((d, i) => {
          const total = mealKeys.reduce((s, k) => s + (d[k] || 0), 0);
          const filled = Math.round((total / maxVal) * barH);
          const isToday = d.date === getTodayKey();
          return (
            <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: '100%' }} title={`${d.dayLabel}: ${Math.round(total)} cal`}>
              <div className={`w-full flex flex-col-reverse overflow-hidden ${isToday ? 'ring-1 ring-theme-text-primary/30' : ''}`} style={{ height: filled }}>
                {mealKeys.filter(k => (d[k] || 0) > 0).map(k => (
                  <div key={k} style={{ height: `${((d[k] || 0) / total) * 100}%`, minHeight: 2, backgroundColor: colors[k] }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5">
        {data.map((d, i) => (
          <div key={i} className={`text-[9px] flex-1 text-center ${d.date === getTodayKey() ? 'font-bold text-theme-text-primary' : 'text-theme-text-tertiary'}`}>{d.dayLabel}</div>
        ))}
      </div>
      {usedKeys.length > 1 && (
        <div className="flex flex-wrap gap-3 mt-2">
          {usedKeys.map(k => (
            <div key={k} className="flex items-center gap-1.5 text-[9px] text-theme-text-tertiary capitalize">
              <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: colors[k] }} />
              {k}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Multi-Line Chart (for macro trends) ──
function MultiLineChart({ datasets, data, max, height = 120 }) {
  const actualMax = max || Math.max(...datasets.flatMap(ds => data.map(d => d[ds.key] || 0)), 1);
  const padding = { top: 12, bottom: 24 };
  const chartH = height - padding.top - padding.bottom;

  return (
    <div>
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="overflow-visible">
        {datasets.map(ds => {
          const points = data.map((d, i) => ({
            x: data.length > 1 ? (i / (data.length - 1)) * 100 : 50,
            y: padding.top + chartH - (Math.min((d[ds.key] || 0) / actualMax, 1) * chartH),
          }));
          const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          return <path key={ds.key} d={pathD} fill="none" stroke={ds.color} strokeWidth="0.7" opacity="0.85" />;
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.length <= 14 ? data.map((d, i) => (
          <div key={i} className="text-[9px] flex-1 text-center text-theme-text-tertiary">{d.dayLabel}</div>
        )) : (
          <>
            <span className="text-[9px] text-theme-text-tertiary">{data[0]?.dayLabel}</span>
            <span className="text-[9px] text-theme-text-tertiary">{data[data.length - 1]?.dayLabel}</span>
          </>
        )}
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-2">
        {datasets.map(ds => (
          <div key={ds.key} className="flex items-center gap-1.5 text-[10px]">
            <div className="w-3 h-0.5" style={{ backgroundColor: ds.color }} />
            <span className="text-theme-text-tertiary">{ds.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Progress Ring ──
function ProgressRing({ value, goal, label, unit = '', size = 80, color = 'rgb(var(--color-text-primary))' }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = value > goal;
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-theme-text-primary/10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={over ? '#ef4444' : color} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="butt"
          className="transition-all duration-500" />
      </svg>
      <div className="text-center -mt-1">
        <div className={`text-sm font-bold tabular-nums ${over ? 'text-red-500' : ''}`}>{Math.round(value)}<span className="text-[10px] text-theme-text-tertiary ml-0.5">{unit}</span></div>
        <div className="text-[9px] uppercase tracking-widest text-theme-text-tertiary">{label}</div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { theme } = useTheme();
  const { goals, mealsByDate, waterByDate, weightByDate, getDateRange } = useMeals();
  const [period, setPeriod] = useState('week'); // week | month
  const [chartType, setChartType] = useState('bar'); // bar | line
  const today = getTodayKey();

  // Compute date ranges
  const weekStart = shiftDate(today, -6);
  const monthStart = shiftDate(today, -29);
  const rangeStart = period === 'week' ? weekStart : monthStart;

  const rangeData = useMemo(() => getDateRange(rangeStart, today), [getDateRange, rangeStart, today]);

  const daysWithData = rangeData.filter(d => d.meals.length > 0);
  const totalDays = rangeData.length;
  const activeDays = daysWithData.length;

  // Averages
  const avgCalories = activeDays > 0 ? daysWithData.reduce((s, d) => s + d.totals.calories, 0) / activeDays : 0;
  const avgProtein = activeDays > 0 ? daysWithData.reduce((s, d) => s + d.totals.protein, 0) / activeDays : 0;
  const avgCarbs = activeDays > 0 ? daysWithData.reduce((s, d) => s + d.totals.carbs, 0) / activeDays : 0;
  const avgFat = activeDays > 0 ? daysWithData.reduce((s, d) => s + d.totals.fat, 0) / activeDays : 0;
  const avgWater = activeDays > 0 ? rangeData.reduce((s, d) => s + d.water, 0) / activeDays : 0;

  // Totals for the period
  const periodTotals = rangeData.reduce((acc, d) => ({
    calories: acc.calories + d.totals.calories,
    protein: acc.protein + d.totals.protein,
    carbs: acc.carbs + d.totals.carbs,
    fat: acc.fat + d.totals.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Today's data
  const todayData = rangeData.find(d => d.date === today) || { totals: { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, cholesterol: 0, saturated_fat: 0, added_sugar: 0 }, water: 0, weight: null };

  // Macro pie chart data (today)
  const macroColors = { protein: '#3b82f6', carbs: '#f59e0b', fat: '#ef4444' };
  const pieMacros = [
    { label: 'Protein', value: todayData.totals.protein, color: macroColors.protein },
    { label: 'Carbs', value: todayData.totals.carbs, color: macroColors.carbs },
    { label: 'Fat', value: todayData.totals.fat, color: macroColors.fat },
  ];

  // Calorie distribution pie (by macro calories)
  const calFromProtein = todayData.totals.protein * 4;
  const calFromCarbs = todayData.totals.carbs * 4;
  const calFromFat = todayData.totals.fat * 9;
  const calPie = [
    { label: 'Protein', value: calFromProtein, color: macroColors.protein },
    { label: 'Carbs', value: calFromCarbs, color: macroColors.carbs },
    { label: 'Fat', value: calFromFat, color: macroColors.fat },
  ];

  // Chart data (calories per day)
  const chartSlice = period === 'week' ? rangeData : rangeData.slice(-14);
  const barData = chartSlice.map(d => {
    const info = formatShort(d.date);
    return { value: d.totals.calories, dayLabel: info.day, label: formatDate(d.date), date: d.date };
  });

  // Macro trend data (for multi-line chart)
  const macroTrendData = chartSlice.map(d => {
    const info = formatShort(d.date);
    return { dayLabel: info.day, date: d.date, protein: d.totals.protein, carbs: d.totals.carbs, fat: d.totals.fat };
  });

  // Most eaten foods
  const foodFrequency = useMemo(() => {
    const freq = {};
    for (const d of rangeData) {
      for (const m of d.meals) {
        const key = m.name;
        if (!freq[key]) freq[key] = { name: key, count: 0, totalCal: 0 };
        freq[key].count++;
        freq[key].totalCal += m.calories || 0;
      }
    }
    return Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [rangeData]);

  // Weight trend
  const weightEntries = useMemo(() => {
    return rangeData.filter(d => d.weight != null).map(d => ({ date: d.date, weight: d.weight }));
  }, [rangeData]);

  // Streak
  const streak = useMemo(() => {
    let count = 0;
    let d = today;
    while (true) {
      const dayMeals = mealsByDate[d];
      if (!dayMeals || dayMeals.length === 0) break;
      count++;
      d = shiftDate(d, -1);
    }
    return count;
  }, [mealsByDate, today]);

  // Best/worst day
  const bestDay = daysWithData.length > 0 ? daysWithData.reduce((best, d) => d.totals.calories > best.totals.calories ? d : best) : null;
  const lowestDay = daysWithData.length > 0 ? daysWithData.reduce((low, d) => d.totals.calories < low.totals.calories ? d : low) : null;

  // Calories by meal time per day
  const mealTimeBreakdown = useMemo(() => {
    return chartSlice.map(d => {
      const info = formatShort(d.date);
      const b = { breakfast: 0, brunch: 0, lunch: 0, dinner: 0, other: 0 };
      for (const m of d.meals) {
        const mt = (m.meal_time || '').toLowerCase();
        if (mt.includes('breakfast')) b.breakfast += m.calories || 0;
        else if (mt.includes('brunch')) b.brunch += m.calories || 0;
        else if (mt.includes('lunch')) b.lunch += m.calories || 0;
        else if (mt.includes('dinner')) b.dinner += m.calories || 0;
        else b.other += m.calories || 0;
      }
      return { ...b, dayLabel: info.day, date: d.date };
    });
  }, [chartSlice]);

  // Goal hit rate — how many active days each goal was met
  const goalHitRate = useMemo(() => {
    if (activeDays === 0) return [];
    return [
      { label: 'Calories', color: '#f59e0b', daysHit: daysWithData.filter(d => d.totals.calories >= goals.calories * 0.85 && d.totals.calories <= goals.calories * 1.15).length },
      { label: 'Protein',  color: '#3b82f6', daysHit: daysWithData.filter(d => d.totals.protein  >= goals.protein  * 0.9).length },
      { label: 'Carbs',    color: '#f59e0b', daysHit: daysWithData.filter(d => d.totals.carbs    <= goals.carbs    * 1.1).length },
      { label: 'Fat',      color: '#ef4444', daysHit: daysWithData.filter(d => d.totals.fat      <= goals.fat      * 1.1).length },
    ];
  }, [daysWithData, goals, activeDays]);

  return (
    <>
      <Head>
        <title>Stats - BoilerFuel</title>
        <meta name="description" content="BoilerFuel nutrition analytics and insights" />
      </Head>

      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-24 space-y-12">

          {/* Header */}
          <header className="space-y-4">
            <Link href="/" className="text-xs uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
              &larr; Back
            </Link>
            <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-[0.2em]">Stats</h1>
            <div className="w-12 h-px bg-theme-text-primary/30" />
            <p className="text-sm uppercase tracking-widest text-theme-text-tertiary">
              Analytics &amp; Insights
            </p>
          </header>

          {/* Period toggle */}
          <div className="flex gap-px border border-theme-text-primary/20">
            {['week', 'month'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  period === p ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-secondary'
                }`}>
                {p === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10">
            <div className="bg-theme-bg-primary px-4 py-4 text-center">
              <div className="text-2xl font-bold tabular-nums">{streak}</div>
              <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mt-1">Day Streak</div>
            </div>
            <div className="bg-theme-bg-primary px-4 py-4 text-center">
              <div className="text-2xl font-bold tabular-nums">{activeDays}<span className="text-sm text-theme-text-tertiary">/{totalDays}</span></div>
              <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mt-1">Active Days</div>
            </div>
            <div className="bg-theme-bg-primary px-4 py-4 text-center">
              <div className="text-2xl font-bold tabular-nums">{Math.round(avgCalories)}</div>
              <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mt-1">Avg Cal/Day</div>
            </div>
            <div className="bg-theme-bg-primary px-4 py-4 text-center">
              <div className="text-2xl font-bold tabular-nums">{Math.round(avgWater)}</div>
              <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mt-1">Avg Water/Day</div>
            </div>
          </div>

          {/* ═══ TODAY'S SNAPSHOT ═══ */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              Today&rsquo;s Overview
            </h2>

            <div className="flex flex-wrap justify-center gap-4 py-4">
              <ProgressRing value={todayData.totals.calories} goal={goals.calories} label="Calories" unit="kcal" size={90} />
              <ProgressRing value={todayData.totals.protein} goal={goals.protein} label="Protein" unit="g" size={90} color={macroColors.protein} />
              <ProgressRing value={todayData.totals.carbs} goal={goals.carbs} label="Carbs" unit="g" size={90} color={macroColors.carbs} />
              <ProgressRing value={todayData.totals.fat} goal={goals.fat} label="Fat" unit="g" size={90} color={macroColors.fat} />
            </div>
          </section>

          {/* ═══ MACRO BREAKDOWN ═══ */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              Macro Breakdown (Today)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-2">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-3">By Weight</div>
                <PieChart data={pieMacros} size={140} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary mb-3">By Calories</div>
                <PieChart data={calPie} size={140} />
              </div>
            </div>
          </section>

          {/* ═══ DAILY CALORIES CHART ═══ */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-theme-text-primary/10 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary">
                Daily Calories
              </h2>
              <div className="flex gap-px border border-theme-text-primary/20">
                {[{ key: 'bar', label: 'Bar' }, { key: 'line', label: 'Line' }].map(t => (
                  <button key={t.key} onClick={() => setChartType(t.key)}
                    className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                      chartType === t.key ? 'bg-theme-text-primary text-theme-bg-primary' : 'text-theme-text-tertiary hover:text-theme-text-primary'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="border border-theme-text-primary/10 p-4">
              {chartType === 'bar' ? (
                <BarChart data={barData} max={goals.calories * 1.3} height={140} />
              ) : (
                <LineChart data={barData} max={goals.calories * 1.3} height={140} goalLine={goals.calories} />
              )}
              <div className="flex items-center gap-4 mt-3 text-[10px] text-theme-text-tertiary">
                <span>Goal: <span className="font-bold text-theme-text-secondary">{goals.calories} kcal</span></span>
                <span>Avg: <span className="font-bold text-theme-text-secondary">{Math.round(avgCalories)} kcal</span></span>
                {bestDay && <span>Peak: <span className="font-bold text-theme-text-secondary">{Math.round(bestDay.totals.calories)} kcal</span> ({formatDate(bestDay.date)})</span>}
              </div>
            </div>
          </section>

          {/* ═══ MEAL TIME BREAKDOWN ═══ */}
          {daysWithData.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                Calories by Meal Time
              </h2>
              <div className="border border-theme-text-primary/10 p-4">
                <StackedBarChart data={mealTimeBreakdown} height={140} />
              </div>
            </section>
          )}

          {/* ═══ MACRO TRENDS ═══ */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              Macro Trends
            </h2>
            <div className="border border-theme-text-primary/10 p-4">
              <MultiLineChart
                data={macroTrendData}
                datasets={[
                  { key: 'protein', label: 'Protein', color: macroColors.protein },
                  { key: 'carbs', label: 'Carbs', color: macroColors.carbs },
                  { key: 'fat', label: 'Fat', color: macroColors.fat },
                ]}
                height={140}
              />
            </div>
          </section>

          {/* ═══ AVERAGES ═══ */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              {period === 'week' ? 'Weekly' : 'Monthly'} Averages
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10">
              {[
                { label: 'Calories', value: Math.round(avgCalories), unit: 'kcal', goal: goals.calories },
                { label: 'Protein', value: Math.round(avgProtein), unit: 'g', goal: goals.protein },
                { label: 'Carbs', value: Math.round(avgCarbs), unit: 'g', goal: goals.carbs },
                { label: 'Fat', value: Math.round(avgFat), unit: 'g', goal: goals.fat },
              ].map(s => (
                <div key={s.label} className="bg-theme-bg-primary px-4 py-3">
                  <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">{s.label}</div>
                  <div className={`text-lg font-bold tabular-nums mt-1 ${s.value > s.goal ? 'text-red-500' : ''}`}>
                    {s.value}<span className="text-xs text-theme-text-tertiary ml-0.5">{s.unit}</span>
                  </div>
                  <div className="text-[10px] text-theme-text-tertiary mt-0.5">Goal: {s.goal}{s.unit}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ GOAL HIT RATE ═══ */}
          {goalHitRate.length > 0 && activeDays > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                Goal Hit Rate <span className="font-normal text-theme-text-tertiary/50 normal-case tracking-normal">({activeDays} active day{activeDays !== 1 ? 's' : ''})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10">
                {goalHitRate.map(g => {
                  const pct = activeDays > 0 ? g.daysHit / activeDays : 0;
                  return (
                    <div key={g.label} className="bg-theme-bg-primary px-4 py-3">
                      <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">{g.label}</div>
                      <div className="text-lg font-bold tabular-nums mt-1">{g.daysHit}<span className="text-xs text-theme-text-tertiary ml-0.5">/{activeDays}</span></div>
                      <div className="h-1.5 w-full bg-theme-text-primary/10 mt-2 overflow-hidden">
                        <div className="h-full transition-all duration-300" style={{ width: `${pct * 100}%`, backgroundColor: pct >= 0.8 ? '#22c55e' : pct >= 0.5 ? g.color : '#ef4444' }} />
                      </div>
                      <div className="text-[9px] text-theme-text-tertiary mt-1">{Math.round(pct * 100)}% on track</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ TOP FOODS ═══ */}
          {foodFrequency.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                Most Eaten Foods
              </h2>
              <div className="border border-theme-text-primary/10 divide-y divide-theme-text-primary/5">
                {foodFrequency.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs font-bold text-theme-text-tertiary w-5 tabular-nums">{i + 1}</span>
                    <div className="flex-1 min-w-0 truncate text-sm">{f.name}</div>
                    <span className="text-xs text-theme-text-tertiary tabular-nums">{f.count}x</span>
                    <span className="text-xs text-theme-text-secondary tabular-nums w-16 text-right">{Math.round(f.totalCal)} cal</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ═══ WEIGHT TREND ═══ */}
          {weightEntries.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
                Weight Trend
              </h2>
              <div className="border border-theme-text-primary/10 p-4">
                <div className="flex items-end gap-1" style={{ height: 100 }}>
                  {(() => {
                    const weights = weightEntries.map(e => e.weight);
                    const min = Math.min(...weights) - 2;
                    const max = Math.max(...weights) + 2;
                    const range = max - min || 1;
                    return weightEntries.map((e, i) => {
                      const pct = ((e.weight - min) / range) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${formatDate(e.date)}: ${e.weight} lbs`}>
                          <div className="text-[9px] font-mono tabular-nums text-theme-text-tertiary/60">{e.weight}</div>
                          <div className="w-full relative" style={{ height: 60 }}>
                            <div className="absolute bottom-0 w-full bg-theme-text-primary/50" style={{ height: `${pct}%`, minHeight: 2 }} />
                          </div>
                          <div className="text-[8px] text-theme-text-tertiary">{formatShort(e.date).day}</div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="flex gap-4 mt-3 text-[10px] text-theme-text-tertiary">
                  <span>Latest: <span className="font-bold text-theme-text-secondary">{weightEntries[weightEntries.length - 1].weight} lbs</span></span>
                  {weightEntries.length >= 2 && (
                    <span>Change: <span className={`font-bold ${weightEntries[weightEntries.length - 1].weight < weightEntries[0].weight ? 'text-green-500' : 'text-red-500'}`}>
                      {(weightEntries[weightEntries.length - 1].weight - weightEntries[0].weight).toFixed(1)} lbs
                    </span></span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ═══ DETAILED MACROS ═══ */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-theme-text-tertiary border-b border-theme-text-primary/10 pb-2">
              Today&rsquo;s Detailed Nutrition
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-theme-text-primary/10 border border-theme-text-primary/10">
              {[
                { label: 'Saturated Fat', value: todayData.totals.saturated_fat, goal: goals.saturated_fat ?? 20, unit: 'g' },
                { label: 'Fiber', value: todayData.totals.fiber, goal: goals.fiber ?? 28, unit: 'g' },
                { label: 'Sugar', value: todayData.totals.sugar, goal: goals.sugar ?? 50, unit: 'g' },
                { label: 'Added Sugar', value: todayData.totals.added_sugar, goal: goals.added_sugar ?? 25, unit: 'g' },
                { label: 'Sodium', value: todayData.totals.sodium, goal: goals.sodium ?? 2300, unit: 'mg' },
                { label: 'Cholesterol', value: todayData.totals.cholesterol, goal: goals.cholesterol ?? 300, unit: 'mg' },
              ].map(s => {
                const over = s.value > s.goal;
                const pct = s.goal > 0 ? Math.min(s.value / s.goal, 1) : 0;
                return (
                  <div key={s.label} className="bg-theme-bg-primary px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-theme-text-tertiary">{s.label}</div>
                    <div className={`text-base font-bold tabular-nums mt-1 ${over ? 'text-red-500' : ''}`}>
                      {Math.round(s.value * 10) / 10}<span className="text-xs text-theme-text-tertiary ml-0.5">{s.unit}</span>
                    </div>
                    <div className="h-1.5 w-full bg-theme-text-primary/10 mt-2 overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${over ? 'bg-red-500' : 'bg-theme-text-primary/40'}`} style={{ width: `${pct * 100}%` }} />
                    </div>
                    <div className="text-[9px] text-theme-text-tertiary mt-1">/ {s.goal}{s.unit}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-theme-text-primary/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6 text-xs uppercase tracking-widest">
              <Link href="/" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Home</Link>
              <Link href="/profile" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">Profile</Link>
              <Link href="/about" className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors">About</Link>
            </div>
            <span className="text-xs text-theme-text-tertiary/40">{new Date().getFullYear()}</span>
          </footer>
        </div>
      </div>
    </>
  );
}

StatsPage.getLayout = (page) => page;
