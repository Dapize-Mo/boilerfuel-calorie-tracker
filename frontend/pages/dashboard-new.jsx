import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { apiCall } from '../utils/auth';
import { readCookie, writeCookie } from '../utils/cookies';

// === Constants ===
const LOG_COOKIE_KEY = 'boilerfuel_logs_v1';
const GOALS_COOKIE_KEY = 'boilerfuel_goals_v1';
const WATER_COOKIE_KEY = 'boilerfuel_water_v1';
const ACTIVITY_LOG_COOKIE_KEY = 'boilerfuel_activity_logs_v1';

// === Helper Functions ===
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
    // === Core State ===
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(new Date()));
    const [activeTab, setActiveTab] = useState('overview'); // overview, nutrition, activity, menu
    
    // === Data State ===
    const [allFoods, setAllFoods] = useState([]);
    const [diningCourts, setDiningCourts] = useState([]);
    const [activities, setActivities] = useState([]);
    const [logs, setLogs] = useState(() => parseLogsCookie());
    const [activityLogs, setActivityLogs] = useState(() => parseActivityLogsCookie());
    const [goals, setGoals] = useState(() => parseGoalsCookie());
    const [waterIntake, setWaterIntake] = useState(0);
    
    // === Menu State ===
    const [selectedDiningCourt, setSelectedDiningCourt] = useState('Earhart');
    const [selectedMealTime, setSelectedMealTime] = useState('lunch');
    const [menuFoods, setMenuFoods] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredFood, setHoveredFood] = useState(null);

    // === Load Initial Data ===
    useEffect(() => {
        async function loadData() {
            try {
                const [courtsData, foodsData, activitiesData] = await Promise.all([
                    apiCall('/api/dining-courts').catch(() => ['Earhart', 'Ford', 'W iley', 'Windsor', 'Hillenbrand']),
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

        // Load water intake for today
        const w = readCookie(WATER_COOKIE_KEY);
        if (w) {
            try {
                const p = JSON.parse(w);
                if (p.date === formatDateForInput(new Date())) setWaterIntake(p.count || 0);
            } catch { }
        }
    }, []);

    // === Load Menu Foods ===
    useEffect(() => {
        async function fetchMenuFoods() {
            if (activeTab !== 'menu' || loading) return;
            try {
                const params = new URLSearchParams();
                if (selectedDiningCourt) params.append('dining_court', selectedDiningCourt);
                if (selectedMealTime) params.append('meal_time', selectedMealTime.toLowerCase());
                
                const url = `/api/foods?${params.toString()}`;
                const data = await apiCall(url).catch(() => []);
                setMenuFoods(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('Error fetching menu:', e);
            }
        }
        fetchMenuFoods();
    }, [activeTab, selectedDiningCourt, selectedMealTime, loading]);

    // === Computed Values ===
    const foodsById = useMemo(() => {
        const map = new Map();
        allFoods.forEach(f => map.set(f.id, f));
        return map;
    }, [allFoods]);

    const activitiesById = useMemo(() => {
        const map = new Map();
        activities.forEach(a => map.set(a.id, a));
        return map;
    }, [activities]);

    const selectedDateStart = useMemo(() => {
        const d = new Date(selectedDate + 'T00:00:00');
        return d;
    }, [selectedDate]);

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

    const totalActivityMinutes = useMemo(() => {
        return selectedDayActivityLogs.reduce((sum, log) => {
            return sum + (log.duration || 0);
        }, 0);
    }, [selectedDayActivityLogs]);

    const totalCaloriesBurned = useMemo(() => {
        return selectedDayActivityLogs.reduce((sum, log) => {
            const activity = activitiesById.get(log.activityId);
            if (!activity) return sum;
            return sum + (activity.calories_per_minute || 0) * (log.duration || 0);
        }, 0);
    }, [selectedDayActivityLogs, activitiesById]);

    const netCalories = totals.calories - totalCaloriesBurned;

    // === Event Handlers ===
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
        const newLog = {
            id: Date.now(),
            foodId: foodId,
            servings: 1,
            timestamp: new Date().toISOString()
        };
        persistLogs([newLog, ...logs]);
    }

    function handleDeleteFoodLog(logId) {
        persistLogs(logs.filter(l => l.id !== logId));
    }

    function handleQuickAddActivity(activityId) {
        const newLog = {
            id: Date.now(),
            activityId: activityId,
            duration: 30,
            timestamp: new Date().toISOString()
        };
        persistActivityLogs([newLog, ...activityLogs]);
    }

    function handleDeleteActivityLog(logId) {
        persistActivityLogs(activityLogs.filter(l => l.id !== logId));
    }

    // === Group Menu Foods by Station ===
    const menuFoodsByStation = useMemo(() => {
        const grouped = {};
        const filtered = menuFoods.filter(f => 
            !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        filtered.forEach(f => {
            const station = f.station || 'Other';
            if (!grouped[station]) grouped[station] = [];
            grouped[station].push(f);
        });
        return grouped;
    }, [menuFoods, searchQuery]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading BoilerFuel...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>BoilerFuel Dashboard</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* === Header === */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            {/* Logo */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                    <span className="text-white font-bold text-xl">B</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                        BoilerFuel
                                    </h1>
                                    <p className="text-xs text-gray-500">Nutrition & Fitness Tracker</p>
                                </div>
                            </div>

                            {/* Date Picker */}
                            <div className="flex items-center gap-4">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm font-medium"
                                />
                                <Link href="/gym" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm">
                                    Gym Tracker
                                </Link>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex gap-1 -mb-px">
                            {[
                                { id: 'overview', label: 'Overview', icon: '📊' },
                                { id: 'nutrition', label: 'Nutrition', icon: '🍽️' },
                                { id: 'activity', label: 'Activity', icon: '🏃' },
                                { id: 'menu', label: 'Menu', icon: '📋' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-3 font-medium text-sm transition-all border-b-2 ${
                                        activeTab === tab.id
                                            ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* === Main Content === */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {formatDateDisplay(selectedDate)}
                            </h2>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    label="Net Calories"
                                    value={Math.round(netCalories)}
                                    target={goals.calories}
                                    unit="kcal"
                                    color="amber"
                                    subtitle={`${Math.round(totals.calories)} in - ${Math.round(totalCaloriesBurned)} out`}
                                />
                                <StatCard
                                    label="Protein"
                                    value={Math.round(totals.protein)}
                                    target={goals.protein}
                                    unit="g"
                                    color="blue"
                                />
                                <StatCard
                                    label="Activity"
                                    value={totalActivityMinutes}
                                    target={goals.activityMinutes}
                                    unit="min"
                                    color="green"
                                />
                               <StatCard
                                    label="Water"
                                    value={waterIntake}
                                    target={8}
                                    unit="cups"
                                    color="cyan"
                                    interactive
                                    onIncrement={() => updateWater(1)}
                                    onDecrement={() => updateWater(-1)}
                                />
                            </div>

                            {/* Macros Chart */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Macronutrient Distribution</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Pie Chart */}
                                    <div className="flex items-center justify-center">
                                        <div className="relative">
                                            <div
                                                className="w-56 h-56 rounded-full"
                                                style={{
                                                    background: `conic-gradient(
                                                        #3b82f6 0% ${(totals.protein / (totals.protein + totals.carbs + totals.fats || 1)) * 100}%,
                                                        #a855f7 ${(totals.protein / (totals.protein + totals.carbs + totals.fats || 1)) * 100}% ${((totals.protein + totals.carbs) / (totals.protein + totals.carbs + totals.fats || 1)) * 100}%,
                                                        #f97316 ${((totals.protein + totals.carbs) / (totals.protein + totals.carbs + totals.fats || 1)) * 100}% 100%
                                                    )`
                                                }}
                                            >
                                                <div className="absolute inset-0 m-12 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                                                    <span className="text-4xl font-bold text-gray-900">{Math.round(totals.calories)}</span>
                                                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Calories</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Macro Bars */}
                                    <div className="space-y-6">
                                        <MacroBar label="Protein" value={totals.protein} target={goals.protein} color="blue" />
                                        <MacroBar label="Carbs" value={totals.carbs} target={goals.carbs} color="purple" />
                                        <MacroBar label="Fats" value={totals.fats} target={goals.fats} color="orange" />
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Recent Meals */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Meals</h3>
                                    <div className="space-y-3">
                                        {selectedDayLogs.slice(0, 5).map(log => {
                                            const food = foodsById.get(log.foodId);
                                            if (!food) return null;
                                            return (
                                                <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{food.name}</p>
                                                        <p className="text-sm text-gray-500">{log.servings}x serving</p>
                                                    </div>
                                                    <span className="font-bold text-amber-600">{Math.round(food.calories * log.servings)} kcal</span>
                                                </div>
                                            );
                                        })}
                                        {selectedDayLogs.length === 0 && (
                                            <p className="text-center text-gray-400 py-8 italic">No meals logged yet</p>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Exercises */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Exercises</h3>
                                    <div className="space-y-3">
                                        {selectedDayActivityLogs.slice(0, 5).map(log => {
                                            const activity = activitiesById.get(log.activityId);
                                            if (!activity) return null;
                                            return (
                                                <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{activity.name}</p>
                                                        <p className="text-sm text-gray-500">{log.duration} minutes</p>
                                                    </div>
                                                    <span className="font-bold text-green-600">-{Math.round(activity.calories_per_minute * log.duration)} kcal</span>
                                                </div>
                                            );
                                        })}
                                        {selectedDayActivityLogs.length === 0 && (
                                            <p className="text-center text-gray-400 py-8 italic">No activities logged yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Nutrition Tab */}
                    {activeTab === 'nutrition' && (
                        <NutritionTab
                            selectedDayLogs={selectedDayLogs}
                            foodsById={foodsById}
                            onDeleteLog={handleDeleteFoodLog}
                            totals={totals}
                            goals={goals}
                        />
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                        <ActivityTab
                            selectedDayActivityLogs={selectedDayActivityLogs}
                            activitiesById={activitiesById}
                            activities={activities}
                            onDeleteLog={handleDeleteActivityLog}
                            onQuickAdd={handleQuickAddActivity}
                            totalMinutes={totalActivityMinutes}
                            totalCaloriesBurned={totalCaloriesBurned}
                            goal={goals.activityMinutes}
                        />
                    )}

                    {/* Menu Tab */}
                    {activeTab === 'menu' && (
                        <MenuTab
                            diningCourts={diningCourts}
                            selectedDiningCourt={selectedDiningCourt}
                            setSelectedDiningCourt={setSelectedDiningCourt}
                            selectedMealTime={selectedMealTime}
                            setSelectedMealTime={setSelectedMealTime}
                            menuFoodsByStation={menuFoodsByStation}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            hoveredFood={hoveredFood}
                            setHoveredFood={setHoveredFood}
                            onQuickAdd={handleQuickAddFood}
                        />
                    )}
                </main>
            </div>
        </>
    );
}

// === Component: StatCard ===
function StatCard({ label, value, target, unit, color, subtitle, interactive, onIncrement, onDecrement }) {
    const percentage = Math.min(100, (value / target) * 100);
    const isOver = value > target;

    const colorClasses = {
        amber: { bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-700', progress: 'bg-gradient-to-r from-amber-500 to-orange-500' },
        blue: { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-700', progress: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
        green: { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-700', progress: 'bg-gradient-to-r from-green-500 to-emerald-500' },
        cyan: { bg: 'bg-cyan-100', border: 'border-cyan-200', text: 'text-cyan-700', progress: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
    };

    const colors = colorClasses[color] || colorClasses.amber;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{label}</h4>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
                    {Math.round(percentage)}%
                </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-900">{value}</span>
                <span className="text-sm text-gray-500 font-medium">/ {target} {unit}</span>
            </div>
            {subtitle && <p className="text-xs text-gray-500 mb-3">{subtitle}</p>}
            
            {interactive ? (
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={onDecrement}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
                    >
                        -
                    </button>
                    <button
                        onClick={onIncrement}
                        className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg text-white rounded-lg font-medium transition-all"
                    >
                        +
                    </button>
                </div>
            ) : (
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${isOver ? 'bg-red-500' : colors.progress} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
}

// === Component: MacroBar ===
function MacroBar({ label, value, target, color }) {
    const percentage = Math.min(100, (value / target) * 100);
    const isOver = value > target;

    const colorClasses = {
        blue: { bg: 'bg-blue-500', light: 'bg-blue-100' },
        purple: { bg: 'bg-purple-500', light: 'bg-purple-100' },
        orange: { bg: 'bg-orange-500', light: 'bg-orange-100' },
    };

    const colors = colorClasses[color] || colorClasses.blue;

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <span className="text-sm font-mono text-gray-600">
                    {Math.round(value)}g / {target}g
                </span>
            </div>
            <div className={`w-full h-3 ${colors.light} rounded-full overflow-hidden`}>
                <div
                    className={`h-full ${isOver ? 'bg-red-500' : colors.bg} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}

// === Component: NutritionTab ===
function NutritionTab({ selectedDayLogs, foodsById, onDeleteLog, totals, goals }) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Nutrition Log</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Calories</p>
                    <p className="text-2xl font-bold text-amber-600">{Math.round(totals.calories)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Protein</p>
                    <p className="text-2xl font-bold text-blue-600">{Math.round(totals.protein)}g</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Carbs</p>
                    <p className="text-2xl font-bold text-purple-600">{Math.round(totals.carbs)}g</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Fats</p>
                    <p className="text-2xl font-bold text-orange-600">{Math.round(totals.fats)}g</p>
                </div>
            </div>

            {/* Detailed Log Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Detailed Log</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Time</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Food</th>
                                <th className="px-6 py-3 text-right font-semibold text-gray-600">Servings</th>
                                <th className="px-6 py-3 text-right font-semibold text-gray-600">Calories</th>
                                <th className="px-6 py-3 text-right font-semibold text-gray-600">Protein</th>
                                <th className="px-6 py-3 text-right font-semibold text-gray-600">Carbs</th>
                                <th className="px-6 py-3 text-right font-semibold text-gray-600">Fats</th>
                                <th className="px-6 py-3 text-center font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {selectedDayLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400 italic">
                                        No meals logged for this date
                                    </td>
                                </tr>
                            ) : (
                                selectedDayLogs.map(log => {
                                    const food = foodsById.get(log.foodId);
                                    if (!food) return null;
                                    return (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{food.name}</td>
                                            <td className="px-6 py-4 text-right text-gray-600">{log.servings}</td>
                                            <td className="px-6 py-4 text-right font-mono font-semibold text-amber-600">
                                                {Math.round(food.calories * log.servings)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-blue-600">
                                                {Math.round((food.macros?.protein || 0) * log.servings)}g
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-purple-600">
                                                {Math.round((food.macros?.carbs || 0) * log.servings)}g
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-orange-600">
                                                {Math.round((food.macros?.fats || 0) * log.servings)}g
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => onDeleteLog(log.id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                    title="Delete"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// === Component: ActivityTab ===
function ActivityTab({ selectedDayActivityLogs, activitiesById, activities, onDeleteLog, onQuickAdd, totalMinutes, totalCaloriesBurned, goal }) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Total Duration</p>
                    <p className="text-3xl font-bold text-green-600">{totalMinutes} min</p>
                    <p className="text-xs text-gray-500 mt-1">Goal: {goal} min</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Calories Burned</p>
                    <p className="text-3xl font-bold text-red-600">{Math.round(totalCaloriesBurned)} kcal</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Activities</p>
                    <p className="text-3xl font-bold text-blue-600">{selectedDayActivityLogs.length}</p>
                </div>
            </div>

            {/* Quick Add */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Add Activity</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {activities.slice(0, 8).map(activity => (
                        <button
                            key={activity.id}
                            onClick={() => onQuickAdd(activity.id)}
                            className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200 rounded-lg text-left transition-all hover:shadow-md"
                        >
                            <p className="font-semibold text-gray-900 text-sm mb-1">{activity.name}</p>
                            <p className="text-xs text-green-600">{activity.calories_per_minute} kcal/min</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Activity Log Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Activity History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Time</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">Activity</th>
                                <th className="px-6 py-3 text-right font-semibold text-gray-600">Duration</th>
                                <th className="px-6 py-3 text-right font-semibold text-gray-600">Calories Burned</th>
                                <th className="px-6 py-3 text-center font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {selectedDayActivityLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                                        No activities logged for this date
                                    </td>
                                </tr>
                            ) : (
                                selectedDayActivityLogs.map(log => {
                                    const activity = activitiesById.get(log.activityId);
                                    if (!activity) return null;
                                    const caloriesBurned = Math.round(activity.calories_per_minute * log.duration);
                                    return (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{activity.name}</td>
                                            <td className="px-6 py-4 text-right text-gray-600">{log.duration} min</td>
                                            <td className="px-6 py-4 text-right font-mono font-semibold text-red-600">
                                                -{caloriesBurned} kcal
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => onDeleteLog(log.id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                    title="Delete"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// === Component: MenuTab ===
function MenuTab({ 
    diningCourts, 
    selectedDiningCourt, 
    setSelectedDiningCourt, 
    selectedMealTime, 
    setSelectedMealTime,
    menuFoodsByStation,
    searchQuery,
    setSearchQuery,
    hoveredFood,
    setHoveredFood,
    onQuickAdd
}) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dining Hall Menu</h2>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Dining Court</label>
                        <select
                            value={selectedDiningCourt}
                            onChange={e => setSelectedDiningCourt(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                            {diningCourts.map(court => (
                                <option key={court} value={court}>{court}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Meal Time</label>
                        <select
                            value={selectedMealTime}
                            onChange={e => setSelectedMealTime(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                            <option value="breakfast">Breakfast</option>
                            <option value="brunch">Brunch</option>
                            <option value="lunch">Lunch</option>
                            <option value="late lunch">Late Lunch</option>
                            <option value="dinner">Dinner</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Filter items..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Menu Items - 2 columns */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto">
                        {Object.keys(menuFoodsByStation).length === 0 ? (
                            <div className="p-12 text-center text-gray-400 italic">
                                No menu items available
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {Object.entries(menuFoodsByStation).map(([station, foods]) => (
                                    <div key={station} className="p-4">
                                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3 sticky top-0 bg-white py-2">
                                            {station}
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {foods.map(food => (
                                                <button
                                                    key={food.id}
                                                    onClick={() => onQuickAdd(food.id)}
                                                    onMouseEnter={() => setHoveredFood(food)}
                                                    onMouseLeave={() => setHoveredFood(null)}
                                                    className="flex justify-between items-center p-3 bg-gray-50 hover:bg-amber-50 rounded-lg text-left transition-all hover:shadow-md group"
                                                >
                                                    <span className="font-medium text-gray-900 group-hover:text-amber-900">{food.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-semibold text-amber-600">{food.calories} kcal</span>
                                                        <span className="text-xs font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            + ADD
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Item Details - 1 column (sticky) */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Item Details</h3>
                        {hoveredFood ? (
                            <div className="space-y-4 animate-in fade-in duration-200">
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-1">{hoveredFood.name}</h4>
                                    <p className="text-sm text-gray-500">{hoveredFood.station}</p>
                                </div>
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                                    <p className="text-sm text-gray-600 mb-1">Total Calories</p>
                                    <p className="text-4xl font-bold text-amber-600">{hoveredFood.calories}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <p className="text-xs text-gray-600 mb-1">Protein</p>
                                        <p className="text-lg font-bold text-blue-600">{Math.round((hoveredFood.macros?.protein || 0))}g</p>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                                        <p className="text-xs text-gray-600 mb-1">Carbs</p>
                                        <p className="text-lg font-bold text-purple-600">{Math.round((hoveredFood.macros?.carbs || 0))}g</p>
                                    </div>
                                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                                        <p className="text-xs text-gray-600 mb-1">Fats</p>
                                        <p className="text-lg font-bold text-orange-600">{Math.round((hoveredFood.macros?.fats || 0))}g</p>
                                    </div>
                                </div>
                                {hoveredFood.macros?.serving_size && (
                                    <p className="text-xs text-gray-500 italic border-t border-gray-200 pt-3">
                                        Serving: {hoveredFood.macros.serving_size}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-400 italic text-sm">
                                Hover over a menu item to see nutritional details
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
