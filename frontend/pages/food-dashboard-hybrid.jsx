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
function formatDateDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function FoodDashboardHybrid() {
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
    const dateInputRef = useRef(null);

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

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 font-light">Loading...</div>;

    return (
        <>
            <Head><title>Clean Grid Tracker</title></Head>
            <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-min">

                    {/* Header Block - Clean & Simple */}
                    <div className="col-span-full flex flex-col md:flex-row justify-between items-end md:items-center mb-2">
                        <div>
                            <h1 className="text-3xl font-light tracking-tight text-gray-900">Dashboard</h1>
                            <p className="text-gray-400 text-sm mt-1">Track your nutrition</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-gray-300 transition-colors" onClick={() => dateInputRef.current?.showPicker()}>
                            <span className="text-gray-600 text-sm font-medium">{formatDateDisplay(selectedDate)}</span>
                            <input
                                ref={dateInputRef}
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="w-0 h-0 opacity-0"
                            />
                        </div>
                    </div>

                    {/* Calories Block - Minimalist Big Number */}
                    <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between h-64 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="text-9xl">🔥</span>
                        </div>
                        <div>
                            <p className="text-gray-400 font-medium text-sm uppercase tracking-wider mb-2">Calories Consumed</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-6xl font-light text-gray-900">{Math.round(totals.calories)}</h2>
                                <span className="text-gray-400 text-xl">/ {goals.calories}</span>
                            </div>
                        </div>
                        <div className="w-full">
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>Progress</span>
                                <span>{Math.round((totals.calories / goals.calories) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-900 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (totals.calories / goals.calories) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Macros Block - Clean Stack */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center gap-6 h-64">
                        <HybridMacro label="Protein" value={Math.round(totals.protein)} max={goals.protein} color="bg-gray-900" />
                        <HybridMacro label="Carbs" value={Math.round(totals.carbs)} max={goals.carbs} color="bg-gray-400" />
                        <HybridMacro label="Fats" value={Math.round(totals.fats)} max={goals.fats} color="bg-gray-300" />
                    </div>

                    {/* Water Block - Simple & Clean */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center h-64 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-50/30"></div>
                        <div className="relative z-10">
                            <div className="text-3xl mb-3 text-blue-400">💧</div>
                            <h3 className="text-4xl font-light text-gray-900 mb-1">{waterIntake}</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-6">Glasses</p>
                            <div className="flex gap-3">
                                <button onClick={() => updateWater(-1)} className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-400 transition-all flex items-center justify-center text-xl pb-1">-</button>
                                <button onClick={() => updateWater(1)} className="w-10 h-10 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all flex items-center justify-center text-xl pb-1">+</button>
                            </div>
                        </div>
                    </div>

                    {/* Logged Meals List - Clean List */}
                    <div className="md:col-span-2 lg:col-span-1 md:row-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-[500px]">
                        <h3 className="font-medium text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Today's Meals
                        </h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {selectedDayLogs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                    <span className="text-2xl mb-2">🍽️</span>
                                    <p className="text-sm">No meals logged</p>
                                </div>
                            ) : (
                                selectedDayLogs.map(log => {
                                    const f = foodsById.get(log.foodId);
                                    if (!f) return null;
                                    return (
                                        <div key={log.id} className="group flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{f.name}</p>
                                                <p className="text-xs text-gray-400">{Math.round(f.calories * log.servings)} cal</p>
                                            </div>
                                            <button onClick={() => persistLogs(logs.filter(l => l.id !== log.id))} className="text-gray-300 hover:text-red-400 transition-colors px-2 opacity-0 group-hover:opacity-100">×</button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Food Menu - Grid of Clean Cards */}
                    <div className="col-span-full md:col-span-3 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-medium text-gray-900">Menu</h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search foods..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-gray-200 placeholder:text-gray-400"
                                />
                                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 content-start">
                            {foods.filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(food => (
                                <div key={food.id} onClick={() => handleQuickAdd(food.id)} className="group border border-gray-100 rounded-2xl p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer bg-white relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <h4 className="font-medium text-gray-900 text-sm group-hover:text-black transition-colors line-clamp-1" title={food.name}>{food.name}</h4>
                                        <span className="bg-gray-50 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-100">{food.calories}</span>
                                    </div>
                                    <div className="flex gap-3 text-[10px] text-gray-400 font-medium relative z-10">
                                        <span>P: {Math.round(food.macros?.protein || 0)}</span>
                                        <span>C: {Math.round(food.macros?.carbs || 0)}</span>
                                        <span>F: {Math.round(food.macros?.fats || 0)}</span>
                                    </div>
                                    <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity -z-0"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

function HybridMacro({ label, value, max, color }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div>
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                <span>{label}</span>
                <span>{value}g <span className="text-gray-300">/ {max}g</span></span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }}></div>
            </div>
        </div>
    );
}
