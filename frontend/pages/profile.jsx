import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession, signIn, signOut } from 'next-auth/react';

const PROFILE_KEY = 'boilerfuel_profile_v1';
const GOALS_KEY = 'boilerfuel_goals_v1';

function loadProfile() {
  if (typeof window === 'undefined') return { name: '', calorieGoal: 2000 };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: '', calorieGoal: 2000 };
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function loadGoals() {
  if (typeof window === 'undefined') return { calories: 2000, protein: 150, carbs: 250, fats: 65 };
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (raw) return JSON.parse(raw);
    // Also check cookie format used by other pages
    const cookie = document.cookie.split('; ').find(c => c.startsWith(GOALS_KEY + '='));
    if (cookie) return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
  } catch {}
  return { calories: 2000, protein: 150, carbs: 250, fats: 65 };
}

function saveGoals(goals) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  // Also save as cookie so other pages (macros, home-simple) can read it
  document.cookie = `${GOALS_KEY}=${encodeURIComponent(JSON.stringify(goals))}; path=/; max-age=31536000`;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState({ name: '', calorieGoal: 2000 });
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fats: 65 });
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setGoals(loadGoals());
  }, []);

  // Sync Google name into profile if signed in and no custom name set
  useEffect(() => {
    if (session?.user?.name && !profile.name) {
      setProfile(p => ({ ...p, name: session.user.name }));
    }
  }, [session]);

  function handleSave() {
    saveProfile(profile);
    saveGoals(goals);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }

  const displayName = profile.name || session?.user?.name || 'Guest';
  const displayEmail = session?.user?.email || null;
  const displayImage = session?.user?.image || null;
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <>
      <Head>
        <title>Profile - BoilerFuel</title>
        <meta name="description" content="Your BoilerFuel profile and nutrition goals" />
      </Head>

      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <header className="border-b border-theme-border-primary pb-6">
          <h1 className="text-4xl font-bold">Profile</h1>
          <p className="text-theme-text-tertiary mt-1">Manage your goals and preferences</p>
        </header>

        {/* Avatar + Identity */}
        <section className="rounded-lg bg-theme-card-bg border border-theme-border-secondary p-6">
          <div className="flex items-center gap-5">
            {displayImage ? (
              <img
                src={displayImage}
                alt={displayName}
                className="w-16 h-16 rounded-full border-2 border-yellow-500 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-xl font-bold text-slate-900 shadow-md">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold truncate">{displayName}</h2>
              {displayEmail && (
                <p className="text-sm text-theme-text-tertiary truncate">{displayEmail}</p>
              )}
              {status === 'authenticated' ? (
                <button
                  onClick={() => signOut()}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Sign out of Google
                </button>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-yellow-500 hover:text-yellow-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Connect Google account
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Name & Goals */}
        <section className="rounded-lg bg-theme-card-bg border border-theme-border-secondary p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Nutrition Goals</h3>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-yellow-500 hover:bg-yellow-600 text-slate-900 transition-colors"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditing(false); setProfile(loadProfile()); setGoals(loadGoals()); }}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg border border-theme-border-secondary hover:bg-theme-bg-hover text-theme-text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-yellow-500 hover:bg-yellow-600 text-slate-900 transition-colors"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-1.5">Display Name</label>
            {editing ? (
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg border border-theme-border-secondary bg-theme-bg-primary text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none focus:border-yellow-500 transition-colors"
              />
            ) : (
              <p className="text-theme-text-primary font-medium">{displayName}</p>
            )}
          </div>

          {/* Calorie Goal */}
          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-1.5">Daily Calorie Goal</label>
            {editing ? (
              <div className="relative">
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="50"
                  value={goals.calories}
                  onChange={e => setGoals(g => ({ ...g, calories: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-theme-border-secondary bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:border-yellow-500 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-theme-text-tertiary">kcal</span>
              </div>
            ) : (
              <p className="text-theme-text-primary font-medium">{goals.calories.toLocaleString()} kcal</p>
            )}
          </div>

          {/* Macro Goals */}
          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-3">Daily Macro Goals</label>
            {editing ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-theme-text-tertiary mb-1">Protein</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={goals.protein}
                      onChange={e => setGoals(g => ({ ...g, protein: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border border-theme-border-secondary bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-theme-text-tertiary">g</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-theme-text-tertiary mb-1">Carbs</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="800"
                      value={goals.carbs}
                      onChange={e => setGoals(g => ({ ...g, carbs: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border border-theme-border-secondary bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-theme-text-tertiary">g</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-theme-text-tertiary mb-1">Fats</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={goals.fats}
                      onChange={e => setGoals(g => ({ ...g, fats: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border border-theme-border-secondary bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-theme-text-tertiary">g</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-theme-bg-primary border border-theme-border-secondary p-3 text-center">
                  <p className="text-xs text-theme-text-tertiary">Protein</p>
                  <p className="text-lg font-bold text-blue-400">{goals.protein}g</p>
                </div>
                <div className="rounded-lg bg-theme-bg-primary border border-theme-border-secondary p-3 text-center">
                  <p className="text-xs text-theme-text-tertiary">Carbs</p>
                  <p className="text-lg font-bold text-green-400">{goals.carbs}g</p>
                </div>
                <div className="rounded-lg bg-theme-bg-primary border border-theme-border-secondary p-3 text-center">
                  <p className="text-xs text-theme-text-tertiary">Fats</p>
                  <p className="text-lg font-bold text-orange-400">{goals.fats}g</p>
                </div>
              </div>
            )}
          </div>

          {/* Save confirmation */}
          {saved && (
            <div className="flex items-center gap-2 text-green-500 text-sm font-medium animate-pulse">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </div>
          )}
        </section>

        {/* Data & Privacy */}
        <section className="rounded-lg bg-theme-card-bg border border-theme-border-secondary p-6 space-y-4">
          <h3 className="text-lg font-bold">Data & Privacy</h3>
          <p className="text-sm text-theme-text-secondary leading-relaxed">
            All your data is stored locally on this device. Your profile, goals, and meal logs never leave your browser.
            {status === 'authenticated' && ' Your Google account is only used for identity — no data is synced to the cloud.'}
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                if (confirm('Clear all saved goals and profile data? This cannot be undone.')) {
                  localStorage.removeItem(PROFILE_KEY);
                  localStorage.removeItem(GOALS_KEY);
                  document.cookie = `${GOALS_KEY}=; path=/; max-age=0`;
                  setProfile({ name: '', calorieGoal: 2000 });
                  setGoals({ calories: 2000, protein: 150, carbs: 250, fats: 65 });
                }
              }}
              className="px-3 py-1.5 text-sm rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Reset Profile
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
