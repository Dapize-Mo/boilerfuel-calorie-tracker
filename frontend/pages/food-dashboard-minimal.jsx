import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { apiCall } from '../utils/auth';
import { deleteCookie, readCookie, writeCookie } from '../utils/cookies';

const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';
const USER_PREFS_COOKIE_KEY = 'boilerfuel_user_prefs_v1';
const WATER_COOKIE_KEY = 'boilerfuel_water_v1';

// ... Helper functions (same as original) ...
function parseGoalsCookie() {
    const raw = readCookie(GOALS_COOKIE_KEY);
    if (!raw) return { calories: 2000, protein: 150, carbs: 250, fats: 65, activityMinutes: 30 };
    try {
        const parsed = JSON.parse(raw);
        return {
            calories: Number(parsed?.calories) || 2000,
            protein: Number(parsed?.protein) || 150,
            carbs: Number(parsed?.carbs) || 250,
            fats: Number(parsed?.fats) || 65,
            activityMinutes: Number(parsed?.activityMinutes) || 30,
        };
    } catch { return { calories: 2000, protein: 150, carbs: 250, fats: 65, activityMinutes: 30 }; }
}

function parseUserPrefsCookie() {
    const raw = readCookie(USER_PREFS_COOKIE_KEY);
    if (!raw) return { showGoals: true };
    try { return { showGoals: JSON.parse(raw)?.showGoals !== false }; } catch { return { showGoals: true }; }
}

function parseLogsCookie() {
    const raw = readCookie(LOG_COOKIE_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((entry, index) => ({
            id: Number(entry?.id) || Date.now() - index,
            foodId: Number(entry?.foodId),
            servings: Number(entry?.servings),
            timestamp: typeof entry?.timestamp === 'string' ? entry.timestamp : new Date().toISOString(),
        })).filter(l => l.foodId && l.servings > 0);
    } catch { return []; }
}

function parseActivityLogsCookie() {
    const raw = readCookie(ACTIVITY_LOG_COOKIE_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((entry, index) => ({
            id: Number(entry?.id) || Date.now() - index,
            activityId: Number(entry?.activityId),
            duration: Number(entry?.duration),
            timestamp: typeof entry?.timestamp === 'string' ? entry.timestamp : new Date().toISOString(),
        })).filter(l => l.activityId && l.duration > 0);
    } catch { return []; }
}

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function parseLocalDate(dateString) {
    if (!dateString) return startOfToday();
    const parts = String(dateString).split('-').map(Number);
    if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
    return new Date(dateString);
}

function startOfDate(dateString) {
    const date = parseLocalDate(dateString);
    date.setHours(0, 0, 0, 0);
    return date;
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateString) {
    const date = parseLocalDate(dateString);
    const today = startOfToday();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (formatDateForInput(date) === formatDateForInput(today)) return 'Today';
    if (formatDateForInput(date) === formatDateForInput(yesterday)) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isSameDay(timestamp, selectedDateStart) {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    return date.getFullYear() === selectedDateStart.getFullYear() &&
        date.getMonth() === selectedDateStart.getMonth() &&
        date.getDate() === selectedDateStart.getDate();
}

export default function FoodDashboardMinimal() {
    // ... State (same as original) ...
    const [foods, setFoods] = useState([]);
    const [allFoods, setAllFoods] = useState([]);
    const [activities, setActivities] = useState([]);
    const [diningCourts, setDiningCourts] = useState([]);
    const [selectedDiningCourt, setSelectedDiningCourt] = useState('');
    const [selectedMealTime, setSelectedMealTime] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(startOfToday()));
    const [logs, setLogs] = useState(() => parseLogsCookie());
    const [activityLogs, setActivityLogs] = useState(() => parseActivityLogsCookie());
    const [goals, setGoals] = useState(() => parseGoalsCookie());
    const [userPrefs, setUserPrefs] = useState(() => parseUserPrefsCookie());
    const [waterIntake, setWaterIntake] = useState(0);
    const [editingGoals, setEditingGoals] = useState(false);
    const [goalForm, setGoalForm] = useState(() => parseGoalsCookie());
    const [loading, setLoading] = useState(true);
    const [menuError, setMenuError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFood, setSelectedFood] = useState(null);
    const [showAddMealModal, setShowAddMealModal] = useState(false);
    const [addMealStep, setAddMealStep] = useState(1);
    const [addMealDiningCourt, setAddMealDiningCourt] = useState('');
    const [addMealMealTime, setAddMealMealTime] = useState('');
    const [addMealSearchQuery, setAddMealSearchQuery] = useState('');
    const [batchSelection, setBatchSelection] = useState(() => new Map());
    const dateInputRef = useRef(null);
    const successTimeout = useRef(null);

    // ... Effects (same as original) ...
    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            try {
                const [courts, acts, all] = await Promise.all([
                    apiCall('/api/dining-courts').catch(() => []),
                    apiCall('/api/activities').catch(() => []),
                    apiCall('/api/foods').catch(() => [])
                ]);
                if (!isMounted) return;
                setDiningCourts(Array.isArray(courts) ? courts : []);
                setActivities(Array.isArray(acts) ? acts : []);
                setAllFoods(Array.isArray(all) ? all : []);
                setLoading(false);
            } catch (e) { console.error(e); }
        }
        loadData();

        const savedWater = readCookie(WATER_COOKIE_KEY);
        if (savedWater) {
            try {
                const parsed = JSON.parse(savedWater);
                if (parsed.date === new Date().toISOString().split('T')[0]) setWaterIntake(parsed.count || 0);
            } catch (e) { }
        }
        return () => { isMounted = false; clearTimeout(successTimeout.current); };
    }, []);

    useEffect(() => {
        let isMounted = true;
        async function loadFoods() {
            try {
                const params = new URLSearchParams();
                if (selectedDiningCourt) params.append('dining_court', selectedDiningCourt);
                if (selectedMealTime) params.append('meal_time', selectedMealTime);
                const data = await apiCall(params.toString() ? `/api/foods?${params}` : '/api/foods');
                if (isMounted) {
                    setFoods(Array.isArray(data) ? data : []);
                    setMenuError('');
                }
            } catch (e) { if (isMounted) setMenuError(e.message); }
        }
        loadFoods();
        return () => { isMounted = false; };
    }, [selectedDiningCourt, selectedMealTime]);

    // ... Logic (same as original) ...
    const foodsById = useMemo(() => {
        const map = new Map();
        allFoods.forEach(f => map.set(f.id, f));
        return map;
    }, [allFoods]);

    const isFoodAvailableToday = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return (food) => {
            if (!food.next_available?.length) return true;
            return food.next_available.some(slot => slot.date?.startsWith(todayStr));
        };
    }, []);

    const foodsByStation = useMemo(() => {
        const grouped = {};
        let available = foods.filter(isFoodAvailableToday);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            available = available.filter(f => f.name?.toLowerCase().includes(q) || f.station?.toLowerCase().includes(q));
        }
        available.forEach(f => {
            const s = f.station || 'Other';
            if (!grouped[s]) grouped[s] = [];
            grouped[s].push(f);
        });
        return grouped;
    }, [foods, isFoodAvailableToday, searchQuery]);

    const activitiesById = useMemo(() => {
        const map = new Map();
        activities.forEach(a => map.set(a.id, a));
        return map;
    }, [activities]);

    const selectedDateStart = useMemo(() => startOfDate(selectedDate), [selectedDate]);
    const selectedDayLogs = useMemo(() => logs.filter(l => isSameDay(l.timestamp, selectedDateStart)), [logs, selectedDateStart]);
    const selectedDayActivityLogs = useMemo(() => activityLogs.filter(l => isSameDay(l.timestamp, selectedDateStart)), [activityLogs, selectedDateStart]);

    const totals = useMemo(() => {
        const consumed = selectedDayLogs.reduce((acc, log) => {
            const f = foodsById.get(log.foodId);
            if (!f) return acc;
            const s = log.servings || 0;
            acc.calories += (f.calories || 0) * s;
            acc.protein += (f.macros?.protein || 0) * s;
            acc.carbs += (f.macros?.carbs || 0) * s;
            acc.fats += (f.macros?.fats || 0) * s;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

        const burned = selectedDayActivityLogs.reduce((acc, log) => {
            const a = activitiesById.get(log.activityId);
            return acc + ((a?.calories_per_hour || 0) * (log.duration || 0)) / 60;
        }, 0);

        return { ...consumed, burned, net: consumed.calories - burned };
    }, [selectedDayLogs, selectedDayActivityLogs, foodsById, activitiesById]);

    function persistLogs(next) {
        setLogs(next);
        next.length ? writeCookie(LOG_COOKIE_KEY, JSON.stringify(next)) : deleteCookie(LOG_COOKIE_KEY);
    }
    function persistGoals(next) { setGoals(next); writeCookie(GOALS_COOKIE_KEY, JSON.stringify(next)); }
    function persistUserPrefs(next) { setUserPrefs(next); writeCookie(USER_PREFS_COOKIE_KEY, JSON.stringify(next)); }

    function handleQuickAdd(foodId, servings = 1) {
        const newLog = { id: Date.now(), foodId: Number(foodId), servings, timestamp: new Date(selectedDate + 'T12:00:00').toISOString() };
        persistLogs([newLog, ...logs]);
        setSuccess('Added');
        clearTimeout(successTimeout.current);
        successTimeout.current = setTimeout(() => setSuccess(''), 2000);
    }

    function handleRemoveLog(id) { persistLogs(logs.filter(l => l.id !== id)); }
    function handleClearLogs() { persistLogs([]); }
    function updateWater(amount) {
        const next = Math.max(0, waterIntake + amount);
        setWaterIntake(next);
        writeCookie(WATER_COOKIE_KEY, JSON.stringify({ date: new Date().toISOString().split('T')[0], count: next }));
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

    return (
        <>
            <Head><title>Minimal Tracker</title></Head>
            <div className="min-h-screen bg-white text-gray-900 font-sans">

                {/* Minimal Header */}
                <div className="max-w-5xl mx-auto px-6 py-12">
                    <div className="flex justify-between items-end mb-12 border-b border-gray-100 pb-6">
                        <div>
                            <h1 className="text-4xl font-light tracking-tight text-gray-900 mb-2">Food Tracker</h1>
                            <p className="text-gray-400 text-sm">Minimalist Design</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <button onClick={() => dateInputRef.current?.showPicker()} className="hover:text-gray-900 transition-colors">
                                    {formatDateDisplay(selectedDate)}
                                </button>
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                    className="w-0 h-0 opacity-0"
                                />
                            </div>
                            <button onClick={() => setShowAddMealModal(true)} className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors">+ Add Meal</button>
                        </div>
                    </div>

                    {/* Stats Overview - Clean Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                        <MinimalStat label="Calories" value={Math.round(totals.calories)} goal={goals.calories} />
                        <MinimalStat label="Protein" value={`${Math.round(totals.protein)}g`} goal={`${goals.protein}g`} />
                        <MinimalStat label="Carbs" value={`${Math.round(totals.carbs)}g`} goal={`${goals.carbs}g`} />
                        <MinimalStat label="Fats" value={`${Math.round(totals.fats)}g`} goal={`${goals.fats}g`} />
                    </div>

                    {/* Water - Simple Counter */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-6 mb-16">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl text-blue-400">💧</span>
                            <div>
                                <p className="font-medium text-gray-900">Water Intake</p>
                                <p className="text-xs text-gray-400">Goal: 8 glasses</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <button onClick={() => updateWater(-1)} className="text-gray-400 hover:text-gray-600 text-xl">-</button>
                            <span className="text-xl font-light text-gray-900">{waterIntake}</span>
                            <button onClick={() => updateWater(1)} className="text-gray-400 hover:text-gray-600 text-xl">+</button>
                        </div>
                    </div>

                    {/* Logged Meals - List View */}
                    <div className="mb-16">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-light text-gray-900">Logged Meals</h2>
                            {selectedDayLogs.length > 0 && (
                                <button onClick={handleClearLogs} className="text-xs text-red-400 hover:text-red-600">Clear All</button>
                            )}
                        </div>

                        {selectedDayLogs.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                                No meals logged today.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {selectedDayLogs.map(log => {
                                    const food = foodsById.get(log.foodId);
                                    if (!food) return null;
                                    return (
                                        <div key={log.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors group">
                                            <div>
                                                <p className="font-medium text-gray-900">{food.name}</p>
                                                <p className="text-xs text-gray-400">{log.servings} serving(s)</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-sm text-gray-600">{Math.round(food.calories * log.servings)} cal</span>
                                                <button onClick={() => handleRemoveLog(log.id)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">×</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Food Menu - Clean Grid */}
                    <div>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                            <h2 className="text-xl font-light text-gray-900">Menu</h2>
                            <div className="flex gap-4 w-full md:w-auto">
                                <select
                                    value={selectedDiningCourt}
                                    onChange={e => setSelectedDiningCourt(e.target.value)}
                                    className="bg-transparent border-b border-gray-200 py-2 text-sm text-gray-600 focus:outline-none focus:border-gray-900"
                                >
                                    <option value="">All Courts</option>
                                    {diningCourts.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-b border-gray-200 py-2 text-sm text-gray-600 focus:outline-none focus:border-gray-900"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(foodsByStation).map(([station, items]) => (
                                <div key={station} className="space-y-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{station}</h3>
                                    <div className="space-y-2">
                                        {items.map(food => (
                                            <div key={food.id} onClick={() => handleQuickAdd(food.id)} className="p-4 border border-gray-100 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer bg-white">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-medium text-gray-900">{food.name}</p>
                                                    <span className="text-xs font-bold text-gray-400">{food.calories}</span>
                                                </div>
                                                <div className="mt-2 flex gap-2 text-[10px] text-gray-400 uppercase">
                                                    <span>P: {Math.round(food.macros?.protein || 0)}</span>
                                                    <span>C: {Math.round(food.macros?.carbs || 0)}</span>
                                                    <span>F: {Math.round(food.macros?.fats || 0)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Add Meal Modal (Reused logic, minimal style) */}
                {showAddMealModal && (
                    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                        <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl rounded-2xl p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-light">Add Meal</h3>
                                <button onClick={() => setShowAddMealModal(false)} className="text-gray-400 hover:text-gray-900">✕</button>
                            </div>
                            {/* Simplified Modal Content for brevity in this variant */}
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500">Use the main menu to add items quickly.</p>
                                <button onClick={() => setShowAddMealModal(false)} className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

function MinimalStat({ label, value, goal }) {
    const numVal = parseFloat(value);
    const numGoal = parseFloat(goal);
    const pct = numGoal ? Math.min(100, (numVal / numGoal) * 100) : 0;

    return (
        <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-light text-gray-900 mb-2">{value}</p>
            {goal && (
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full" style={{ width: `${pct}%` }} />
                </div>
            )}
        </div>
    );
}
