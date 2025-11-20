import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

// ... (Copy all helper functions) ...
const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';
const USER_PREFS_COOKIE_KEY = 'boilerfuel_user_prefs_v1';
const WATER_COOKIE_KEY = 'boilerfuel_water_v1';

function parseGoalsCookie() {
    const raw = readCookie(GOALS_COOKIE_KEY);
    if (!raw) return { calories: 2000, protein: 150, carbs: 250, fats: 65, activityMinutes: 30 };
    try { return JSON.parse(raw); } catch { return { calories: 2000, protein: 150, carbs: 250, fats: 65, activityMinutes: 30 }; }
}
function parseUserPrefsCookie() {
    const raw = readCookie(USER_PREFS_COOKIE_KEY);
    if (!raw) return { showGoals: true };
    try { return JSON.parse(raw); } catch { return { showGoals: true }; }
}
function parseLogsCookie() {
    const raw = readCookie(LOG_COOKIE_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
}
function parseActivityLogsCookie() {
    const raw = readCookie(ACTIVITY_LOG_COOKIE_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
}
function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function formatDateForInput(d) { return d.toISOString().split('T')[0]; }
function isSameDay(ts, d) { if (!ts) return false; const date = new Date(ts); return date.toDateString() === d.toDateString(); }

export default function FoodDashboardBento() {
    // ... State ...
    const [foods, setFoods] = useState([]);
    const [allFoods, setAllFoods] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(startOfToday()));
    const [logs, setLogs] = useState(() => parseLogsCookie());
    const [activityLogs, setActivityLogs] = useState(() => parseActivityLogsCookie());
    const [goals, setGoals] = useState(() => parseGoalsCookie());
    const [waterIntake, setWaterIntake] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // ... Load Data ...
    useEffect(() => {
        async function load() {
            try {
                const f = await apiCall('/api/foods').catch(() => []);
                setAllFoods(Array.isArray(f) ? f : []);
                setFoods(Array.isArray(f) ? f : []);
                setLoading(false);
            } catch (e) { }
        }
        load();
        const w = readCookie(WATER_COOKIE_KEY);
        if (w) { try { const p = JSON.parse(w); if (p.date === formatDateForInput(new Date())) setWaterIntake(p.count); } catch { } }
    }, []);

    // ... Logic ...
    const foodsById = useMemo(() => { const m = new Map(); allFoods.forEach(f => m.set(f.id, f)); return m; }, [allFoods]);
    const selectedDateStart = useMemo(() => { const d = new Date(selectedDate); d.setHours(0, 0, 0, 0); return d; }, [selectedDate]);
    const selectedDayLogs = useMemo(() => logs.filter(l => isSameDay(l.timestamp, selectedDateStart)), [logs, selectedDateStart]);

    const totals = useMemo(() => {
        return selectedDayLogs.reduce((acc, log) => {
            const f = foodsById.get(log.foodId);
            if (!f) return acc;
            acc.calories += (f.calories || 0) * log.servings;
            acc.protein += (f.macros?.protein || 0) * log.servings;
            acc.carbs += (f.macros?.carbs || 0) * log.servings;
            acc.fats += (f.macros?.fats || 0) * log.servings;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }, [selectedDayLogs, foodsById]);

    function persistLogs(n) { setLogs(n); writeCookie(LOG_COOKIE_KEY, JSON.stringify(n)); }
    function handleQuickAdd(id) {
        const newLog = { id: Date.now(), foodId: id, servings: 1, timestamp: new Date(selectedDate + 'T12:00:00').toISOString() };
        persistLogs([newLog, ...logs]);
    }
    function updateWater(n) {
        const v = Math.max(0, waterIntake + n);
        setWaterIntake(v);
        writeCookie(WATER_COOKIE_KEY, JSON.stringify({ date: formatDateForInput(new Date()), count: v }));
    }

    if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center">Loading...</div>;

    return (
        <>
            <Head><title>Bento Tracker</title></Head>
            <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-800">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min">

                    {/* Header Block */}
                    <div className="col-span-full bg-white rounded-3xl p-6 shadow-sm flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                            <p className="text-slate-500 text-sm">Welcome back, User</p>
                        </div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="bg-slate-100 border-none rounded-xl px-4 py-2 text-slate-600 font-medium focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Calories Block (Large) */}
                    <div className="md:col-span-2 bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div>
                            <p className="text-indigo-200 font-medium mb-1">Calories Consumed</p>
                            <h2 className="text-5xl font-bold">{Math.round(totals.calories)}</h2>
                        </div>
                        <div className="mt-8">
                            <div className="flex justify-between text-sm mb-2 opacity-90">
                                <span>Goal: {goals.calories}</span>
                                <span>{Math.round((totals.calories / goals.calories) * 100)}%</span>
                            </div>
                            <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, (totals.calories / goals.calories) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Macros Block (Vertical Stack) */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-center gap-4">
                        <BentoMacro label="Protein" value={Math.round(totals.protein)} max={goals.protein} color="bg-emerald-500" />
                        <BentoMacro label="Carbs" value={Math.round(totals.carbs)} max={goals.carbs} color="bg-amber-500" />
                        <BentoMacro label="Fats" value={Math.round(totals.fats)} max={goals.fats} color="bg-rose-500" />
                    </div>

                    {/* Water Block */}
                    <div className="bg-sky-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="text-4xl mb-2">💧</div>
                        <h3 className="font-bold text-sky-900 text-lg">{waterIntake} / 8</h3>
                        <p className="text-sky-600 text-xs font-bold uppercase tracking-wider mb-4">Glasses</p>
                        <div className="flex gap-2">
                            <button onClick={() => updateWater(-1)} className="w-8 h-8 rounded-full bg-white text-sky-600 shadow-sm hover:scale-110 transition-transform font-bold">-</button>
                            <button onClick={() => updateWater(1)} className="w-8 h-8 rounded-full bg-sky-500 text-white shadow-sm hover:scale-110 transition-transform font-bold">+</button>
                        </div>
                    </div>

                    {/* Logged Meals List (Tall) */}
                    <div className="md:col-span-2 lg:col-span-1 md:row-span-2 bg-white rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
                        <h3 className="font-bold text-slate-900 mb-4">Today's Meals</h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {selectedDayLogs.length === 0 ? (
                                <p className="text-slate-400 text-center text-sm py-10">No meals yet.</p>
                            ) : (
                                selectedDayLogs.map(log => {
                                    const f = foodsById.get(log.foodId);
                                    if (!f) return null;
                                    return (
                                        <div key={log.id} className="bg-slate-50 rounded-xl p-3 flex justify-between items-center group">
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">{f.name}</p>
                                                <p className="text-xs text-slate-500">{Math.round(f.calories * log.servings)} cal</p>
                                            </div>
                                            <button onClick={() => persistLogs(logs.filter(l => l.id !== log.id))} className="text-slate-300 hover:text-red-500 transition-colors px-2">×</button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Food Menu (Large Grid) */}
                    <div className="col-span-full md:col-span-3 bg-white rounded-3xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900">Menu</h3>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="bg-slate-100 border-none rounded-xl px-4 py-2 text-sm w-48 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {foods.filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(food => (
                                <div key={food.id} onClick={() => handleQuickAdd(food.id)} className="border border-slate-100 rounded-2xl p-4 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{food.name}</h4>
                                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full">{food.calories}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400" title={`Protein: ${food.macros?.protein}`}></span>
                                        <span className="w-2 h-2 rounded-full bg-amber-400" title={`Carbs: ${food.macros?.carbs}`}></span>
                                        <span className="w-2 h-2 rounded-full bg-rose-400" title={`Fats: ${food.macros?.fats}`}></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

function BentoMacro({ label, value, max, color }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div>
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <span>{label}</span>
                <span>{value}g</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }}></div>
            </div>
        </div>
    );
}
