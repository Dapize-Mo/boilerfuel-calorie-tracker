import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { apiCall } from '../utils/auth';
import { readCookie, writeCookie } from '../utils/cookies';

const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';
const WATER_COOKIE_KEY = 'boilerfuel_water_v1';
const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';
const THEME_KEY = 'boilerfuel_theme';
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
function parseActivityLogsCookie() {
    const raw = readCookie(ACTIVITY_LOG_COOKIE_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
}
function formatDateForInput(d) { return d.toISOString().split('T')[0]; }
function isSameDay(ts, d) { if (!ts) return false; const date = new Date(ts); return date.toDateString() === d.toDateString(); }
function formatDateDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function UnifiedDashboard() {
    const [theme, setTheme] = useState('light');
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(new Date()));
    const [activeTab, setActiveTab] = useState('overview');
    
    const [allFoods, setAllFoods] = useState([]);
    const [diningCourts, setDiningCourts] = useState([]);
    const [activities, setActivities] = useState([]);
    const [logs, setLogs] = useState(() => parseLogsCookie());
    const [activityLogs, setActivityLogs] = useState(() => parseActivityLogsCookie());
    const [goals, setGoals] = useState(() => parseGoalsCookie());
    const [waterIntake, setWaterIntake] = useState(0);
    
    const [selectedDiningCourt, setSelectedDiningCourt] = useState('Earhart');
    const [selectedMealTime, setSelectedMealTime] = useState('lunch');
    const [menuFoods, setMenuFoods] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Initialize theme from cookie
    useEffect(() => {
        const saved = readCookie(THEME_KEY) || 'light';
        setTheme(saved);
        applyTheme(saved);
    }, []);

    function applyTheme(t) {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('dark', t === 'dark');
    }

    function toggleTheme() {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
        writeCookie(THEME_KEY, newTheme);
    }

    // Load initial data
    useEffect(() => {
        async function loadData() {
            try {
                const [courtsData, foodsData, activitiesData] = await Promise.all([
                    apiCall('/api/dining-courts').catch(() => ['Earhart', 'Ford', 'Wiley', 'Windsor', 'Hillenbrand']),
                    apiCall('/api/foods').catch(() => []),
                    apiCall('/api/activities').catch(() => [])
                ]);
                setDiningCourts(Array.isArray(courtsData) ? courtsData : ['Earhart', 'Ford', 'Wiley', 'Windsor', 'Hillenbrand']);
                setAllFoods(Array.isArray(foodsData) ? foodsData : []);
                setActivities(Array.isArray(activitiesData) ? activitiesData : []);
                setLoading(false);
            } catch (e) {
                console.error('Error loading data:', e);
                setLoading(false);
            }
        }
        loadData();

        const w = readCookie(WATER_COOKIE_KEY);
        if (w) {
            try {
                const p = JSON.parse(w);
                if (p.date === formatDateForInput(new Date())) setWaterIntake(p.count || 0);
            } catch { }
        }
    }, []);

    // Load menu foods
    useEffect(() => {
        async function fetchMenuFoods() {
            if (activeTab !== 'menu' || loading) return;
            try {
                const params = new URLSearchParams();
                if (selectedDiningCourt) params.append('dining_court', selectedDiningCourt);
                if (selectedMealTime) params.append('meal_time', selectedMealTime.toLowerCase());
                
                const data = await apiCall(`/api/foods?${params.toString()}`).catch(() => []);
                setMenuFoods(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('Error fetching menu:', e);
            }
        }
        fetchMenuFoods();
    }, [activeTab, selectedDiningCourt, selectedMealTime, loading]);

    const foodsById = useMemo(() => new Map(allFoods.map(f => [f.id, f])), [allFoods]);
    const activitiesById = useMemo(() => new Map(activities.map(a => [a.id, a])), [activities]);

    const selectedDateStart = useMemo(() => new Date(selectedDate + 'T00:00:00'), [selectedDate]);

    const selectedDayLogs = useMemo(() => 
        logs.filter(l => isSameDay(l.timestamp, selectedDateStart))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        [logs, selectedDateStart]
    );

    const selectedDayActivityLogs = useMemo(() =>
        activityLogs.filter(l => isSameDay(l.timestamp, selectedDateStart))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        [activityLogs, selectedDateStart]
    );

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

    const totalActivityMinutes = useMemo(() => 
        selectedDayActivityLogs.reduce((sum, log) => sum + (log.duration || 0), 0),
        [selectedDayActivityLogs]
    );

    const totalCaloriesBurned = useMemo(() => 
        selectedDayActivityLogs.reduce((sum, log) => {
            const activity = activitiesById.get(log.activityId);
            return sum + (activity?.calories_per_minute || 0) * (log.duration || 0);
        }, 0),
        [selectedDayActivityLogs, activitiesById]
    );

    const netCalories = totals.calories - totalCaloriesBurned;

    function persistLogs(newLogs) {
        setLogs(newLogs);
        writeCookie(LOG_COOKIE_KEY, JSON.stringify(newLogs));
    }

    function persistActivityLogs(newLogs) {
        setActivityLogs(newLogs);
        writeCookie(ACTIVITY_LOG_COOKIE_KEY, JSON.stringify(newLogs));
    }

    function updateWater(delta) {
        const newValue = Math.max(0, waterIntake + delta);
        setWaterIntake(newValue);
        writeCookie(WATER_COOKIE_KEY, JSON.stringify({ 
            date: formatDateForInput(new Date()), 
            count: newValue 
        }));
    }

    function handleQuickAddFood(foodId) {
        persistLogs([{ id: Date.now(), foodId, servings: 1, timestamp: new Date().toISOString() }, ...logs]);
    }

    function handleDeleteFoodLog(logId) {
        persistLogs(logs.filter(l => l.id !== logId));
    }

    function handleQuickAddActivity(activityId) {
        persistActivityLogs([{ id: Date.now(), activityId, duration: 30, timestamp: new Date().toISOString() }, ...activityLogs]);
    }

    function handleDeleteActivityLog(logId) {
        persistActivityLogs(activityLogs.filter(l => l.id !== logId));
    }

    const menuFoodsByStation = useMemo(() => {
        const grouped = {};
        menuFoods
            .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .forEach(f => {
                const station = f.station || 'Other';
                if (!grouped[station]) grouped[station] = [];
                grouped[station].push(f);
            });
        return grouped;
    }, [menuFoods, searchQuery]);

    if (loading) return <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center"><div className="text-center"><div className="w-12 h-12 border-2 border-gray-300 dark:border-gray-700 border-t-gray-600 rounded-full animate-spin"></div><p className="text-gray-600 dark:text-gray-400 text-sm mt-4">Loading...</p></div></div>;

    return <>
        <Head>
            <title>BoilerFuel</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>

        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 bg-white dark:bg-gray-950">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BoilerFuel</h1>
                        <div className="flex items-center gap-3">
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} 
                                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                            />
                            <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-900">
                                {theme === 'light' ? '🌙' : '☀️'}
                            </button>
                            <Link href="/gym" className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded text-sm font-medium">Gym</Link>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 border-t border-gray-200 dark:border-gray-800 pt-4">
                        {[{ id: 'overview', label: 'Overview' }, { id: 'nutrition', label: 'Meals' }, { id: 'activity', label: 'Activity' }, { id: 'menu', label: 'Menu' }].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 font-medium text-sm border-b-2 ${activeTab === tab.id ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >{tab.label}</button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{formatDateDisplay(selectedDate)}</h2>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Net Calories</p>
                                <p className="text-4xl font-bold text-gray-900 dark:text-white">{Math.round(netCalories)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{Math.round(totals.calories)} in · {Math.round(totalCaloriesBurned)} out</p>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Protein</p>
                                <p className="text-4xl font-bold text-gray-900 dark:text-white">{Math.round(totals.protein)}g</p>
                                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mt-3 overflow-hidden"><div className="h-full bg-gray-900 dark:bg-gray-100" style={{ width: `${Math.min(100, (totals.protein / goals.protein) * 100)}%` }}></div></div>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Activity</p>
                                <p className="text-4xl font-bold text-gray-900 dark:text-white">{totalActivityMinutes}m</p>
                                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mt-3 overflow-hidden"><div className="h-full bg-gray-900 dark:bg-gray-100" style={{ width: `${Math.min(100, (totalActivityMinutes / goals.activityMinutes) * 100)}%` }}></div></div>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Water</p>
                                <p className="text-4xl font-bold text-gray-900 dark:text-white">{waterIntake}</p>
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => updateWater(-1)} className="flex-1 py-1.5 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-800">−</button>
                                    <button onClick={() => updateWater(1)} className="flex-1 py-1.5 text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded hover:opacity-90">+</button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Items */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-bold uppercase text-gray-600 dark:text-gray-400 mb-4">Recent Meals</h3>
                                <div className="space-y-2">
                                    {selectedDayLogs.slice(0, 8).map(log => {
                                        const food = foodsById.get(log.foodId);
                                        return food ? (
                                            <div key={log.id} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-800 rounded text-sm">
                                                <div><p className="font-medium text-gray-900 dark:text-white">{food.name}</p><p className="text-xs text-gray-500 dark:text-gray-500">{log.servings}x</p></div>
                                                <div className="flex items-center gap-2"><span className="font-bold text-gray-900 dark:text-white">{Math.round(food.calories * log.servings)}</span><button onClick={() => handleDeleteFoodLog(log.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button></div>
                                            </div>
                                        ) : null;
                                    })}
                                    {selectedDayLogs.length === 0 && <p className="text-center text-gray-500 dark:text-gray-500 py-8 text-sm">No meals</p>}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold uppercase text-gray-600 dark:text-gray-400 mb-4">Recent Activities</h3>
                                <div className="space-y-2">
                                    {selectedDayActivityLogs.slice(0, 8).map(log => {
                                        const activity = activitiesById.get(log.activityId);
                                        return activity ? (
                                            <div key={log.id} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-800 rounded text-sm">
                                                <div><p className="font-medium text-gray-900 dark:text-white">{activity.name}</p><p className="text-xs text-gray-500 dark:text-gray-500">{log.duration}m</p></div>
                                                <div className="flex items-center gap-2"><span className="font-bold text-gray-900 dark:text-white">−{Math.round(activity.calories_per_minute * log.duration)}</span><button onClick={() => handleDeleteActivityLog(log.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button></div>
                                            </div>
                                        ) : null;
                                    })}
                                    {selectedDayActivityLogs.length === 0 && <p className="text-center text-gray-500 dark:text-gray-500 py-8 text-sm">No activities</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Meals Tab */}
                {activeTab === 'nutrition' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Meal Log</h2>
                        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                                        <th className="px-4 py-3 text-left font-semibold text-xs uppercase text-gray-600 dark:text-gray-500">Time</th>
                                        <th className="px-4 py-3 text-left font-semibold text-xs uppercase text-gray-600 dark:text-gray-500">Food</th>
                                        <th className="px-4 py-3 text-right font-semibold text-xs uppercase text-gray-600 dark:text-gray-500">Cal</th>
                                        <th className="px-4 py-3 text-right font-semibold text-xs uppercase text-gray-600 dark:text-gray-500">P</th>
                                        <th className="px-4 py-3 text-right font-semibold text-xs uppercase text-gray-600 dark:text-gray-500">C</th>
                                        <th className="px-4 py-3 text-right font-semibold text-xs uppercase text-gray-600 dark:text-gray-500">F</th>
                                        <th className="px-4 py-3 text-center font-semibold text-xs uppercase text-gray-600 dark:text-gray-500">×</th>
                                    </tr></thead>
                                    <tbody>
                                        {selectedDayLogs.length === 0 ? (
                                            <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-500 text-sm">No meals</td></tr>
                                        ) : (
                                            selectedDayLogs.map(log => {
                                                const food = foodsById.get(log.foodId);
                                                return food ? (
                                                    <tr key={log.id} className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-500 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                        <td className="px-4 py-3 text-gray-900 dark:text-white">{food.name}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">{Math.round(food.calories * log.servings)}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">{Math.round((food.macros?.protein || 0) * log.servings)}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">{Math.round((food.macros?.carbs || 0) * log.servings)}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">{Math.round((food.macros?.fats || 0) * log.servings)}</td>
                                                        <td className="px-4 py-3 text-center"><button onClick={() => handleDeleteFoodLog(log.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button></td>
                                                    </tr>
                                                ) : null;
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Log</h2>
                        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                            <h3 className="text-sm font-bold uppercase text-gray-600 dark:text-gray-400 mb-3">Quick Add</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {activities.slice(0, 12).map(activity => (
                                    <button key={activity.id} onClick={() => handleQuickAddActivity(activity.id)}
                                        className="p-3 border border-gray-200 dark:border-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-900 text-left text-sm transition-colors"
                                    >
                                        <p className="font-medium text-xs text-gray-900 dark:text-white">{activity.name}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-500">{activity.calories_per_minute}/min</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                                        <th className="px-4 py-3 text-left font-semibold text-xs uppercase text-gray-600 dark:text-gray-500">Time</th>
                                        <th className="px-4 py-3 text-left font-semibold text-xs uppercase text-gray-600 dark:text-gray-500">Activity</th>
                                        <th className="px-4 py-3 text-right font-semibold text-xs uppercase text-gray-600 dark:text-gray-500">Duration</th>
                                        <th className="px-4 py-3 text-right font-semibold text-xs uppercase text-gray-600 dark:text-gray-500">Burned</th>
                                        <th className="px-4 py-3 text-center font-semibold text-xs uppercase text-gray-600 dark:text-gray-500">×</th>
                                    </tr></thead>
                                    <tbody>
                                        {selectedDayActivityLogs.length === 0 ? (
                                            <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-500 text-sm">No activities</td></tr>
                                        ) : (
                                            selectedDayActivityLogs.map(log => {
                                                const activity = activitiesById.get(log.activityId);
                                                return activity ? (
                                                    <tr key={log.id} className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                                                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-500 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                        <td className="px-4 py-3 text-gray-900 dark:text-white">{activity.name}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">{log.duration}m</td>
                                                        <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">−{Math.round(activity.calories_per_minute * log.duration)}</td>
                                                        <td className="px-4 py-3 text-center"><button onClick={() => handleDeleteActivityLog(log.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button></td>
                                                    </tr>
                                                ) : null;
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Menu Tab */}
                {activeTab === 'menu' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dining Menu</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <select value={selectedDiningCourt} onChange={e => setSelectedDiningCourt(e.target.value)}
                                className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                            >
                                {diningCourts.map(court => <option key={court} value={court}>{court}</option>)}
                            </select>
                            <select value={selectedMealTime} onChange={e => setSelectedMealTime(e.target.value)}
                                className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                            >
                                <option value="breakfast">Breakfast</option>
                                <option value="brunch">Brunch</option>
                                <option value="lunch">Lunch</option>
                                <option value="late lunch">Late Lunch</option>
                                <option value="dinner">Dinner</option>
                            </select>
                            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                            />
                        </div>
                        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
                            {Object.keys(menuFoodsByStation).length === 0 ? (
                                <div className="p-12 text-center text-gray-500 dark:text-gray-500 text-sm">No items</div>
                            ) : (
                                <div>
                                    {Object.entries(menuFoodsByStation).map(([station, foods]) => (
                                        <div key={station}>
                                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0">
                                                <p className="text-xs font-bold uppercase text-gray-600 dark:text-gray-500">{station}</p>
                                            </div>
                                            {foods.map(food => (
                                                <button key={food.id} onClick={() => handleQuickAddFood(food.id)}
                                                    className="w-full flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm text-left transition-colors"
                                                >
                                                    <span className="font-medium text-gray-900 dark:text-white">{food.name}</span>
                                                    <span className="text-gray-600 dark:text-gray-500 font-mono">{food.calories}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    </>;
}