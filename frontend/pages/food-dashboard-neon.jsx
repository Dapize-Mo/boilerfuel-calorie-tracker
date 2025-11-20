import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

// ... (Copy all helper functions from minimal/original to ensure functionality) ...
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

export default function FoodDashboardNeon() {
    // ... State ...
    const [foods, setFoods] = useState([]);
    const [allFoods, setAllFoods] = useState([]);
    const [diningCourts, setDiningCourts] = useState([]);
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
                const [c, f] = await Promise.all([
                    apiCall('/api/dining-courts').catch(() => []),
                    apiCall('/api/foods').catch(() => [])
                ]);
                setDiningCourts(Array.isArray(c) ? c : []);
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

    if (loading) return <div className="min-h-screen bg-black text-green-500 flex items-center justify-center font-mono">INITIALIZING...</div>;

    return (
        <>
            <Head><title>NEON TRACKER</title></Head>
            <div className="min-h-screen bg-black text-green-400 font-mono selection:bg-green-500 selection:text-black">
                <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
                    {/* Header */}
                    <div className="border-b-2 border-green-500/50 pb-6 mb-10 flex justify-between items-end">
                        <div>
                            <h1 className="text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
                                CYBER_TRACK
                            </h1>
                            <p className="text-xs text-green-500/70 mt-2 tracking-widest">SYSTEM STATUS: ONLINE</p>
                        </div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="bg-black border border-green-500 text-green-400 px-4 py-2 rounded-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:shadow-[0_0_15px_rgba(74,222,128,0.5)]"
                        />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                        <NeonStat label="CALORIES" value={Math.round(totals.calories)} max={goals.calories} color="text-yellow-400" border="border-yellow-400" shadow="shadow-yellow-400/50" />
                        <NeonStat label="PROTEIN" value={Math.round(totals.protein)} max={goals.protein} suffix="g" color="text-red-400" border="border-red-400" shadow="shadow-red-400/50" />
                        <NeonStat label="CARBS" value={Math.round(totals.carbs)} max={goals.carbs} suffix="g" color="text-blue-400" border="border-blue-400" shadow="shadow-blue-400/50" />
                        <NeonStat label="FATS" value={Math.round(totals.fats)} max={goals.fats} suffix="g" color="text-purple-400" border="border-purple-400" shadow="shadow-purple-400/50" />
                    </div>

                    {/* Water Module */}
                    <div className="border border-cyan-500 bg-black/50 p-6 mb-12 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl animate-pulse">💧</div>
                                <div>
                                    <h3 className="text-xl font-bold text-cyan-400">HYDRATION_LEVEL</h3>
                                    <div className="w-48 h-2 bg-gray-800 mt-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" style={{ width: `${Math.min(100, (waterIntake / 8) * 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => updateWater(-1)} className="w-12 h-12 border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all font-bold text-xl">-</button>
                                <span className="text-3xl font-bold text-cyan-400 w-12 text-center">{waterIntake}</span>
                                <button onClick={() => updateWater(1)} className="w-12 h-12 border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all font-bold text-xl">+</button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Split */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left: Logged Items */}
                        <div className="lg:col-span-1 border-r border-green-500/30 pr-8">
                            <h2 className="text-2xl font-bold mb-6 text-green-400 border-b border-green-500/30 pb-2 inline-block">LOGGED_DATA</h2>
                            <div className="space-y-3">
                                {selectedDayLogs.map(log => {
                                    const f = foodsById.get(log.foodId);
                                    if (!f) return null;
                                    return (
                                        <div key={log.id} className="bg-green-900/10 border border-green-500/30 p-3 flex justify-between items-center hover:bg-green-900/20 transition-colors">
                                            <div>
                                                <div className="font-bold text-sm text-green-300">{f.name}</div>
                                                <div className="text-xs text-green-500/60">{Math.round(f.calories * log.servings)} kcal</div>
                                            </div>
                                            <button onClick={() => persistLogs(logs.filter(l => l.id !== log.id))} className="text-red-500 hover:text-red-400 font-bold px-2">DEL</button>
                                        </div>
                                    );
                                })}
                                {selectedDayLogs.length === 0 && <div className="text-green-500/30 italic text-sm">NO_DATA_FOUND</div>}
                            </div>
                        </div>

                        {/* Right: Food Database */}
                        <div className="lg:col-span-2">
                            <div className="flex gap-4 mb-6">
                                <input
                                    type="text"
                                    placeholder="SEARCH_DATABASE..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-black border border-green-500/50 text-green-400 px-4 py-3 focus:outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(74,222,128,0.3)] placeholder:text-green-900"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {foods.filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(food => (
                                    <div key={food.id} onClick={() => handleQuickAdd(food.id)} className="group border border-green-500/30 bg-black p-4 hover:border-green-400 hover:shadow-[0_0_15px_rgba(74,222,128,0.2)] transition-all cursor-pointer relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex justify-between items-start relative z-10">
                                            <h3 className="font-bold text-green-300 group-hover:text-green-200">{food.name}</h3>
                                            <span className="text-xs border border-green-500/50 px-1 text-green-500">{food.calories}</span>
                                        </div>
                                        <div className="mt-2 text-xs text-green-600 font-bold flex gap-3">
                                            <span>P:{Math.round(food.macros?.protein || 0)}</span>
                                            <span>C:{Math.round(food.macros?.carbs || 0)}</span>
                                            <span>F:{Math.round(food.macros?.fats || 0)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function NeonStat({ label, value, max, suffix = '', color, border, shadow }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div className={`border ${border} bg-black p-4 relative overflow-hidden group`}>
            <div className={`absolute inset-0 bg-current opacity-5 group-hover:opacity-10 transition-opacity ${color}`}></div>
            <div className="relative z-10">
                <div className={`text-xs font-bold ${color} mb-1 tracking-widest`}>{label}</div>
                <div className={`text-3xl font-bold ${color} drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]`}>
                    {value}<span className="text-sm ml-1 opacity-70">{suffix}</span>
                </div>
                <div className="w-full h-1 bg-gray-900 mt-3">
                    <div className={`h-full ${color.replace('text-', 'bg-')} ${shadow}`} style={{ width: `${pct}%` }}></div>
                </div>
            </div>
        </div>
    );
}
