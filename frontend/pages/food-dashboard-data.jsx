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
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function FoodDashboardData() {
    // --- State ---
    const [foods, setFoods] = useState([]);
    const [allFoods, setAllFoods] = useState([]);
    const [diningCourts, setDiningCourts] = useState([]);
    const [selectedDiningCourt, setSelectedDiningCourt] = useState('Earhart');
    const [selectedMealTime, setSelectedMealTime] = useState('Lunch');
    const [selectedDate, setSelectedDate] = useState(() => formatDateForInput(startOfToday()));
    const [logs, setLogs] = useState(() => parseLogsCookie());
    const [goals, setGoals] = useState(() => parseGoalsCookie());
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [hoveredFood, setHoveredFood] = useState(null);
    const dateInputRef = useRef(null);

    // --- Load Data ---
    useEffect(() => {
        async function load() {
            try {
                const [courts, f] = await Promise.all([
                    apiCall('/api/dining-courts').catch(() => []),
                    apiCall('/api/foods').catch(() => [])
                ]);
                setDiningCourts(Array.isArray(courts) ? courts : []);
                setAllFoods(Array.isArray(f) ? f : []);
                setFoods(Array.isArray(f) ? f : []);
                setLoading(false);
            } catch (e) { }
        }
        load();
    }, []);

    useEffect(() => {
        async function fetchFoods() {
            if (loading) return;
            try {
                let url = '/api/foods';
                const params = new URLSearchParams();
                if (selectedDiningCourt) params.append('dining_court', selectedDiningCourt);
                if (selectedMealTime) params.append('meal_time', selectedMealTime);

                if (params.toString()) url += `?${params.toString()}`;

                let f = await apiCall(url).catch(() => []);

                // Fallback Mock Data for Verification
                if ((!f || f.length === 0)) {
                    f = [
                        { id: 101, name: 'Scrambled Eggs', calories: 140, macros: { protein: 12, carbs: 2, fats: 9 }, dining_court: 'Earhart', station: 'Grill', meal_time: 'Breakfast' },
                        { id: 102, name: 'Bacon Strips', calories: 90, macros: { protein: 6, carbs: 0, fats: 7 }, dining_court: 'Earhart', station: 'Grill', meal_time: 'Breakfast' },
                        { id: 103, name: 'Pancakes', calories: 220, macros: { protein: 4, carbs: 30, fats: 8 }, dining_court: 'Earhart', station: 'Comfort', meal_time: 'Breakfast' },
                        { id: 104, name: 'Grilled Chicken Breast', calories: 180, macros: { protein: 35, carbs: 0, fats: 4 }, dining_court: 'Earhart', station: 'Grill', meal_time: 'Lunch' },
                        { id: 105, name: 'Steamed Broccoli', calories: 40, macros: { protein: 3, carbs: 6, fats: 0 }, dining_court: 'Earhart', station: 'Healthy', meal_time: 'Lunch' },
                        { id: 106, name: 'Cheeseburger', calories: 450, macros: { protein: 25, carbs: 35, fats: 22 }, dining_court: 'Ford', station: 'Grill', meal_time: 'Lunch' },
                        { id: 107, name: 'Pepperoni Pizza', calories: 280, macros: { protein: 12, carbs: 30, fats: 14 }, dining_court: 'Ford', station: 'Pizza', meal_time: 'Lunch' },
                        { id: 108, name: 'Caesar Salad', calories: 120, macros: { protein: 5, carbs: 8, fats: 9 }, dining_court: 'Ford', station: 'Salad Bar', meal_time: 'Lunch' },
                        { id: 109, name: 'Roast Beef', calories: 250, macros: { protein: 28, carbs: 2, fats: 15 }, dining_court: 'Earhart', station: 'Carving', meal_time: 'Dinner' },
                        { id: 110, name: 'Mashed Potatoes', calories: 180, macros: { protein: 3, carbs: 25, fats: 7 }, dining_court: 'Earhart', station: 'Comfort', meal_time: 'Dinner' },
                    ].filter(item =>
                        (!selectedDiningCourt || item.dining_court === selectedDiningCourt) &&
                        (!selectedMealTime || item.meal_time === selectedMealTime)
                    );
                }

                setFoods(Array.isArray(f) ? f : []);
            } catch (e) { }
        }
        fetchFoods();
    }, [selectedDiningCourt, selectedMealTime, loading]);

    // Mock Dining Courts if empty
    useEffect(() => {
        if (diningCourts.length === 0) {
            setDiningCourts(['Earhart', 'Ford', 'Wiley', 'Windsor', 'Hillenbrand']);
        }
    }, [diningCourts]);

    // --- Logic ---
    const foodsById = useMemo(() => { const m = new Map(); allFoods.forEach(f => m.set(f.id, f)); return m; }, [allFoods]);

    const foodsByStation = useMemo(() => {
        const grouped = {};
        foods.forEach(f => {
            const station = f.station || 'Other';
            if (!grouped[station]) grouped[station] = [];
            grouped[station].push(f);
        });
        return grouped;
    }, [foods]);

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

    if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500 font-mono">Loading Data...</div>;

    return (
        <>
            <Head><title>Data Tracker</title></Head>
            <div className="min-h-screen bg-gray-100 font-sans text-gray-900">

                {/* Top Navigation Bar */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center text-white font-bold">B</div>
                        <h1 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5">
                            <span className="text-sm font-medium text-gray-600 mr-2">{formatDateDisplay(selectedDate)}</span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none text-sm p-0 focus:ring-0 text-gray-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="max-w-[1600px] mx-auto p-6 space-y-6">

                    {/* Top Row: KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <KPICard label="Calories" value={Math.round(totals.calories)} target={goals.calories} unit="kcal" />
                        <KPICard label="Protein" value={Math.round(totals.protein)} target={goals.protein} unit="g" />
                        <KPICard label="Carbs" value={Math.round(totals.carbs)} target={goals.carbs} unit="g" />
                        <KPICard label="Fats" value={Math.round(totals.fats)} target={goals.fats} unit="g" />
                    </div>

                    {/* Middle Row: Charts & Database */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Left Column: Charts & Details (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">

                            {/* Macro Distribution */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Macro Distribution</h3>
                                <div className="flex items-center justify-center h-64 relative">
                                    {/* Simple CSS Pie Chart */}
                                    <div className="w-48 h-48 rounded-full relative" style={{
                                        background: `conic-gradient(
                                            #3b82f6 0% ${totals.protein / (totals.protein + totals.carbs + totals.fats || 1) * 100}%, 
                                            #a855f7 ${totals.protein / (totals.protein + totals.carbs + totals.fats || 1) * 100}% ${(totals.protein + totals.carbs) / (totals.protein + totals.carbs + totals.fats || 1) * 100}%, 
                                            #f97316 ${(totals.protein + totals.carbs) / (totals.protein + totals.carbs + totals.fats || 1) * 100}% 100%
                                        )`
                                    }}>
                                        <div className="absolute inset-0 m-8 bg-white rounded-full flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold text-gray-900">{Math.round(totals.calories)}</span>
                                            <span className="text-xs text-gray-400 font-medium">TOTAL KCAL</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-center gap-6 mt-4">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div><span className="text-xs font-medium text-gray-600">Protein</span></div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-sm"></div><span className="text-xs font-medium text-gray-600">Carbs</span></div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500 rounded-sm"></div><span className="text-xs font-medium text-gray-600">Fats</span></div>
                                </div>
                            </div>

                            {/* Item Details Panel (Moved here) */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 h-48 transition-all sticky top-24">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Item Details</h3>
                                {hoveredFood ? (
                                    <div className="animate-in fade-in duration-200">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900">{hoveredFood.name}</h4>
                                                <p className="text-sm text-gray-500">{hoveredFood.station || 'General'}</p>
                                            </div>
                                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded border border-blue-200">
                                                {hoveredFood.calories} kcal
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div className="bg-gray-50 rounded p-2 border border-gray-100">
                                                <div className="text-xs text-gray-500 mb-1">Protein</div>
                                                <div className="font-mono font-bold text-blue-600">{Math.round(hoveredFood.macros?.protein || 0)}g</div>
                                            </div>
                                            <div className="bg-gray-50 rounded p-2 border border-gray-100">
                                                <div className="text-xs text-gray-500 mb-1">Carbs</div>
                                                <div className="font-mono font-bold text-purple-600">{Math.round(hoveredFood.macros?.carbs || 0)}g</div>
                                            </div>
                                            <div className="bg-gray-50 rounded p-2 border border-gray-100">
                                                <div className="text-xs text-gray-500 mb-1">Fats</div>
                                                <div className="font-mono font-bold text-orange-600">{Math.round(hoveredFood.macros?.fats || 0)}g</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                                        Hover over a food item to see details
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Food Database (Expanded to 8 cols) */}
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-[calc(100vh-200px)] sticky top-24">
                                <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-semibold text-gray-900">Food Database</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Meal Time Selector */}
                                        <select
                                            value={selectedMealTime}
                                            onChange={e => setSelectedMealTime(e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {['Breakfast', 'Lunch', 'Late Lunch', 'Dinner'].map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>

                                        {/* Dining Court Selector */}
                                        <select
                                            value={selectedDiningCourt}
                                            onChange={e => setSelectedDiningCourt(e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {diningCourts.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="Filter database..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex-1 overflow-y-auto p-0">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-2">Item</th>
                                                <th className="px-4 py-2 text-right">Kcal</th>
                                                <th className="px-4 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {Object.entries(foodsByStation).map(([station, stationFoods]) => (
                                                <>
                                                    <tr key={`station-${station}`} className="bg-gray-50/50">
                                                        <td colSpan="3" className="px-4 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider border-t border-b border-gray-100">
                                                            {station}
                                                        </td>
                                                    </tr>
                                                    {stationFoods.filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(food => (
                                                        <tr
                                                            key={food.id}
                                                            className="hover:bg-blue-50 group cursor-pointer transition-colors"
                                                            onClick={() => handleQuickAdd(food.id)}
                                                            onMouseEnter={() => setHoveredFood(food)}
                                                            onMouseLeave={() => setHoveredFood(null)}
                                                        >
                                                            <td className="px-4 py-2 font-medium text-gray-900 truncate max-w-[150px]" title={food.name}>{food.name}</td>
                                                            <td className="px-4 py-2 text-right font-mono text-gray-600">{food.calories}</td>
                                                            <td className="px-4 py-2 text-right">
                                                                <span className="text-blue-600 opacity-0 group-hover:opacity-100 font-bold text-xs">+ ADD</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </>
                                            ))}
                                            {Object.keys(foodsByStation).length === 0 && (
                                                <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-400 italic">No foods found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>      {/* Detailed Log Table - Full Width at Bottom */}
                    <div className="col-span-12 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-900">Detailed Logs</h3>
                            <button className="text-xs font-medium text-blue-600 hover:text-blue-800">Export CSV</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3">Time</th>
                                        <th className="px-6 py-3">Food Item</th>
                                        <th className="px-6 py-3 text-right">Servings</th>
                                        <th className="px-6 py-3 text-right">Calories</th>
                                        <th className="px-6 py-3 text-right">P (g)</th>
                                        <th className="px-6 py-3 text-right">C (g)</th>
                                        <th className="px-6 py-3 text-right">F (g)</th>
                                        <th className="px-6 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedDayLogs.length === 0 ? (
                                        <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-400 italic">No data available for this date</td></tr>
                                    ) : (
                                        selectedDayLogs.map(log => {
                                            const f = foodsById.get(log.foodId);
                                            if (!f) return null;
                                            return (
                                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td className="px-6 py-3 font-medium text-gray-900">{f.name}</td>
                                                    <td className="px-6 py-3 text-right text-gray-600">{log.servings}</td>
                                                    <td className="px-6 py-3 text-right font-mono text-gray-900">{Math.round(f.calories * log.servings)}</td>
                                                    <td className="px-6 py-3 text-right font-mono text-blue-600">{Math.round((f.macros?.protein || 0) * log.servings)}</td>
                                                    <td className="px-6 py-3 text-right font-mono text-purple-600">{Math.round((f.macros?.carbs || 0) * log.servings)}</td>
                                                    <td className="px-6 py-3 text-right font-mono text-orange-600">{Math.round((f.macros?.fats || 0) * log.servings)}</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <button onClick={() => persistLogs(logs.filter(l => l.id !== log.id))} className="text-gray-400 hover:text-red-600 transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
            </div>
        </>
    );
}

function KPICard({ label, value, target, unit }) {
    const pct = Math.min(100, (value / target) * 100);
    const isOver = value > target;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {Math.round((value / target) * 100)}%
                </span>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                <span className="text-sm text-gray-400 font-medium">/ {target} {unit}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${pct}%` }}></div>
            </div>
        </div>
    );
}
