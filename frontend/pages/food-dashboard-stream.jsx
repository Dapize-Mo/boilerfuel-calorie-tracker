import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

// --- Constants & Helpers ---
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
function parseLogsCookie() {
    const raw = readCookie(LOG_COOKIE_KEY);
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

export default function FoodDashboardStream() {
    // --- State ---
    const [foods, setFoods] = useState([]);
    const [allFoods, setAllFoods] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(startOfToday()));
    const [logs, setLogs] = useState(() => parseLogsCookie());
    const [goals, setGoals] = useState(() => parseGoalsCookie());
    const [waterIntake, setWaterIntake] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const dateInputRef = useRef(null);

    // --- Load Data ---
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

    // --- Logic ---
    const foodsById = useMemo(() => { const m = new Map(); allFoods.forEach(f => m.set(f.id, f)); return m; }, [allFoods]);
    const selectedDateStart = useMemo(() => { const d = new Date(selectedDate); d.setHours(0, 0, 0, 0); return d; }, [selectedDate]);
    const selectedDayLogs = useMemo(() => logs.filter(l => isSameDay(l.timestamp, selectedDateStart)).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)), [logs, selectedDateStart]);

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
        setShowAddModal(false);
    }
    function updateWater(n) {
        const v = Math.max(0, waterIntake + n);
        setWaterIntake(v);
        writeCookie(WATER_COOKIE_KEY, JSON.stringify({ date: formatDateForInput(new Date()), count: v }));
    }

    if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400 font-serif">Loading...</div>;

    return (
        <>
            <Head><title>Stream Tracker</title></Head>
            <div className="min-h-screen bg-stone-50 font-sans text-stone-900 pb-24">

                {/* Header & Date */}
                <div className="sticky top-0 z-20 bg-stone-50/95 backdrop-blur-md border-b border-stone-200 px-4 py-4">
                    <div className="max-w-2xl mx-auto flex justify-between items-center">
                        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Today</h1>
                        <div
                            onClick={() => dateInputRef.current?.showPicker()}
                            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-stone-200 cursor-pointer"
                        >
                            <span className="text-sm font-medium text-stone-600">{formatDateDisplay(selectedDate)}</span>
                            <input ref={dateInputRef} type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-0 h-0 opacity-0" />
                        </div>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

                    {/* Stories / Progress Header */}
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                        {/* Calories Story */}
                        <div className="snap-center shrink-0 w-32 h-48 bg-orange-500 rounded-2xl p-4 flex flex-col justify-between text-white shadow-lg shadow-orange-200 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
                            <span className="font-bold text-sm opacity-90">Calories</span>
                            <div>
                                <span className="text-3xl font-bold block">{Math.round(totals.calories)}</span>
                                <span className="text-xs opacity-80">of {goals.calories} kcal</span>
                            </div>
                            <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, (totals.calories / goals.calories) * 100)}%` }}></div>
                            </div>
                        </div>

                        {/* Protein Story */}
                        <div className="snap-center shrink-0 w-32 h-48 bg-stone-800 rounded-2xl p-4 flex flex-col justify-between text-white shadow-lg shadow-stone-300 relative overflow-hidden">
                            <span className="font-bold text-sm opacity-90">Protein</span>
                            <div>
                                <span className="text-3xl font-bold block">{Math.round(totals.protein)}g</span>
                                <span className="text-xs opacity-80">Target: {goals.protein}g</span>
                            </div>
                            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min(100, (totals.protein / goals.protein) * 100)}%` }}></div>
                            </div>
                        </div>

                        {/* Water Story */}
                        <div className="snap-center shrink-0 w-32 h-48 bg-blue-500 rounded-2xl p-4 flex flex-col justify-between text-white shadow-lg shadow-blue-200 relative overflow-hidden cursor-pointer" onClick={() => updateWater(1)}>
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-blue-400"></div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-sm opacity-90">Water</span>
                                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white">+1</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-4xl font-bold block">{waterIntake}</span>
                                    <span className="text-xs opacity-80">glasses</span>
                                </div>
                                <div className="text-center text-xs opacity-60">Tap to add</div>
                            </div>
                        </div>
                    </div>

                    {/* Feed of Meals */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-stone-900">Timeline</h2>

                        {selectedDayLogs.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-3xl border border-stone-100 shadow-sm">
                                <p className="text-stone-400 mb-4">No meals logged today</p>
                                <button onClick={() => setShowAddModal(true)} className="text-orange-500 font-bold text-sm">Start Tracking</button>
                            </div>
                        ) : (
                            selectedDayLogs.map(log => {
                                const f = foodsById.get(log.foodId);
                                if (!f) return null;
                                return (
                                    <div key={log.id} className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                                                    {f.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-stone-900">{f.name}</h3>
                                                    <p className="text-xs text-stone-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => persistLogs(logs.filter(l => l.id !== log.id))} className="text-stone-300 hover:text-red-500 p-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-end border-t border-stone-50 pt-4">
                                            <div className="flex gap-4">
                                                <div className="text-center">
                                                    <span className="block text-xs text-stone-400 font-bold uppercase">Prot</span>
                                                    <span className="block text-sm font-bold text-stone-700">{Math.round((f.macros?.protein || 0) * log.servings)}g</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="block text-xs text-stone-400 font-bold uppercase">Carb</span>
                                                    <span className="block text-sm font-bold text-stone-700">{Math.round((f.macros?.carbs || 0) * log.servings)}g</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="block text-xs text-stone-400 font-bold uppercase">Fat</span>
                                                    <span className="block text-sm font-bold text-stone-700">{Math.round((f.macros?.fats || 0) * log.servings)}g</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black text-stone-900">{Math.round(f.calories * log.servings)}</span>
                                                <span className="text-xs text-stone-500 font-bold ml-1">KCAL</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Floating Action Button */}
                <div className="fixed bottom-8 right-8 z-30">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-16 h-16 bg-stone-900 text-white rounded-full shadow-2xl shadow-stone-900/40 flex items-center justify-center text-3xl hover:scale-105 transition-transform"
                    >
                        +
                    </button>
                </div>

                {/* Add Meal Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl h-[80vh] flex flex-col overflow-hidden animate-slide-up">
                            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-stone-900">Add Meal</h3>
                                <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-900">Close</button>
                            </div>
                            <div className="p-4 border-b border-stone-100 bg-stone-50">
                                <input
                                    type="text"
                                    placeholder="Search for food..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    autoFocus
                                    className="w-full bg-white border-none rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-2 focus:ring-orange-500 placeholder:text-stone-400"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {foods.filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(food => (
                                    <div key={food.id} onClick={() => handleQuickAdd(food.id)} className="p-4 bg-white border border-stone-100 rounded-2xl flex justify-between items-center hover:border-orange-500 transition-colors cursor-pointer">
                                        <div>
                                            <h4 className="font-bold text-stone-900">{food.name}</h4>
                                            <p className="text-sm text-stone-500">{food.calories} kcal</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                                            +
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
