import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { signIn, signOut, useSession } from "next-auth/react";
import {
  adminLogin,
  apiCall,
  logoutAdmin,
  verifyAdminSession,
} from '../utils/auth';
import AdminScrapeButton from '../components/AdminScrapeButton';
import Toast from '../components/Toast';

export default function AdminScraper() {
  const { data: session, status } = useSession();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [scrapeLog, setScrapeLog] = useState([]);

  useEffect(() => {
    async function bootstrap() {
      // Check if user is signed in with Google
      if (session?.user) {
        setAuthenticated(true);
        setLoading(false);
        return;
      }

      // Otherwise check traditional admin session
      const sessionOk = await verifyAdminSession();
      if (sessionOk) {
        setAuthenticated(true);
      }
      setLoading(false);
    }

    if (status !== 'loading') {
      bootstrap();
    }
  }, [session, status]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');

    if (!password.trim()) {
      setLoginError('Password is required');
      return;
    }

    try {
      await adminLogin(password.trim());
      setAuthenticated(true);
      setPassword('');
    } catch (error) {
      setLoginError(error.message || 'Invalid password');
    }
  }

  async function handleLogout() {
    // Sign out from Google if using Google auth
    if (session?.user) {
      await signOut({ redirect: false });
    }
    // Also logout from traditional admin session
    await logoutAdmin();
    setAuthenticated(false);
  }

  async function handleGoogleSignIn() {
    try {
      await signIn('google', { redirect: false });
    } catch (error) {
      setLoginError('Failed to sign in with Google');
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const addLogEntry = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setScrapeLog(prev => [...prev, { timestamp, message, type }]);
  };

  const handleScrapeStart = () => {
    setScrapeLog([]);
    addLogEntry('Scraper started...', 'info');
    showToast('Scraper started!', 'info');
  };

  const handleScrapeProgress = (message) => {
    addLogEntry(message, 'info');
  };

  const handleScrapeComplete = (message) => {
    addLogEntry(message || 'Scraping complete!', 'success');
    showToast('Menu scraping completed successfully!', 'success');
  };

  const handleScrapeError = (error) => {
    addLogEntry(error || 'Scraping failed', 'error');
    showToast(`Error: ${error}`, 'error');
  };

  const getAdminToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken');
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary">
        <Head><title>Loading... - Admin Scraper</title></Head>
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </main>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary">
        <Head><title>Admin Login - Menu Scraper</title></Head>
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-theme-bg-secondary rounded-2xl p-8 shadow-xl border border-theme-border">
              <h1 className="text-3xl font-bold mb-2 text-center">🔐 Admin Login</h1>
              <p className="text-theme-text-tertiary text-center mb-6">Menu Scraper Access</p>

              {loginError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Admin Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-theme-bg-primary border border-theme-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    placeholder="Enter admin password"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Login
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-theme-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-theme-bg-secondary text-theme-text-tertiary">Or</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  className="mt-4 w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-all shadow-md hover:shadow-lg border border-gray-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>

              <div className="mt-6 text-center">
                <Link href="/admin" className="text-blue-400 hover:text-blue-300 text-sm">
                  ← Back to Admin Panel
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary">
      <Head>
        <title>Menu Scraper - Admin Panel</title>
      </Head>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <main className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">🔄 Menu Scraper</h1>
            <p className="text-theme-text-tertiary">Import dining hall menus from Purdue Dining</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg bg-theme-bg-secondary border border-theme-border hover:border-blue-500 transition-colors"
            >
              ← Back to Admin
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 hover:border-red-500 text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scraper Control Panel */}
          <div className="bg-theme-bg-secondary rounded-2xl p-6 border border-theme-border">
            <h2 className="text-2xl font-bold mb-4">Scraper Control</h2>
            <p className="text-theme-text-tertiary mb-6">
              Click the button below to fetch the latest menu data from Purdue Dining Services.
            </p>

            <div className="space-y-4">
              <AdminScrapeButton
                authToken={session?.user ? session.accessToken : null}
                onStart={handleScrapeStart}
                onProgress={handleScrapeProgress}
                onComplete={handleScrapeComplete}
                onError={handleScrapeError}
                apiCall={apiCall}
                getAdminToken={getAdminToken}
              />

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="font-semibold text-blue-400 mb-2">ℹ️ What does this do?</h3>
                <ul className="text-sm text-theme-text-tertiary space-y-1">
                  <li>• Fetches menu data from all Purdue dining courts</li>
                  <li>• Updates breakfast, lunch, and dinner menus</li>
                  <li>• Imports food items with nutritional information</li>
                  <li>• Process typically takes 30-60 seconds</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Scraper Log */}
          <div className="bg-theme-bg-secondary rounded-2xl p-6 border border-theme-border">
            <h2 className="text-2xl font-bold mb-4">Scraper Log</h2>
            
            {scrapeLog.length === 0 ? (
              <div className="text-center py-12 text-theme-text-tertiary">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No scraper activity yet</p>
                <p className="text-sm mt-2">Start the scraper to see logs here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {scrapeLog.map((entry, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      entry.type === 'error'
                        ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                        : entry.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-theme-bg-primary border border-theme-border'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-theme-text-tertiary shrink-0 mt-0.5">
                        {entry.timestamp}
                      </span>
                      <span className="flex-1">{entry.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-theme-bg-secondary rounded-lg p-4 border border-theme-border">
            <h3 className="font-semibold mb-2">📅 Schedule</h3>
            <p className="text-sm text-theme-text-tertiary">
              Menus are automatically updated daily. Manual scraping is useful for testing or immediate updates.
            </p>
          </div>
          
          <div className="bg-theme-bg-secondary rounded-lg p-4 border border-theme-border">
            <h3 className="font-semibold mb-2">🏢 Dining Courts</h3>
            <p className="text-sm text-theme-text-tertiary">
              Scraper fetches data from all active Purdue dining locations including Wiley, Ford, Earhart, and more.
            </p>
          </div>
          
          <div className="bg-theme-bg-secondary rounded-lg p-4 border border-theme-border">
            <h3 className="font-semibold mb-2">⚠️ Troubleshooting</h3>
            <p className="text-sm text-theme-text-tertiary">
              If scraping fails, check the logs for errors. Common issues include network problems or source website changes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
