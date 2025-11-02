import React, { useState, useCallback } from 'react';

/**
 * AdminScrapeButton - A button that triggers the menu scraper and polls for completion.
 * 
 * Props:
 * - authToken: Admin JWT token (if available)
 * - adminPassword: Admin password for X-ADMIN-PASSWORD header (fallback)
 * - onStart: Callback when scrape starts
 * - onComplete: Callback(message) when scrape completes successfully
 * - onError: Callback(error) when scrape fails
 * - onProgress: Callback(message) for in-progress updates
 * - apiCall: Optional function to use for authenticated API calls (uses stored token)
 * - getAdminToken: Optional function to retrieve stored admin token
 */
export default function AdminScrapeButton({ 
  authToken, 
  adminPassword,
  onStart,
  onComplete,
  onError,
  onProgress,
  apiCall,
  getAdminToken
}) {
  const [status, setStatus] = useState('idle'); // idle | starting | in_progress | complete | error
  const [isPolling, setIsPolling] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  const callWithAuth = useCallback(async (path, { method = 'GET', password } = {}) => {
    // If apiCall and getAdminToken are provided, use them for JWT-based auth
    const token = getAdminToken ? getAdminToken() : authToken;
    if (token && apiCall) {
      return apiCall(path, { method }, { requireAdmin: true });
    }

    // Fallback to header-based auth
    let pw = password || adminPassword;
    if (!pw && !token) {
      pw = typeof window !== 'undefined' ? window.prompt('Enter admin password to run scraper (local only):') : null;
      if (!pw) throw new Error('Admin password required');
    }

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (pw) {
      headers['X-ADMIN-PASSWORD'] = pw;
    }

    const resp = await fetch(`${apiUrl}${path}`, { method, headers, credentials: 'include' });
    const contentType = resp.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await resp.json() : await resp.text();
    if (!resp.ok) throw new Error((data && data.error) || data || `Request failed: ${resp.status}`);
    return data;
  }, [apiUrl, authToken, adminPassword, apiCall, getAdminToken]);

  const poll = useCallback(async () => {
    try {
      const statusResp = await callWithAuth('/api/scrape-status', { method: 'GET' });
      
      if (statusResp?.status === 'in_progress') {
        setStatus('in_progress');
        onProgress && onProgress(statusResp.message || 'Scraping in progress...');
        setTimeout(poll, 2000);
        return;
      }

      if (statusResp?.status === 'complete') {
        setStatus('complete');
        setIsPolling(false);
        onComplete && onComplete(statusResp.message || 'Scraping complete');
        return;
      }

      if (statusResp?.status === 'error') {
        setStatus('error');
        setIsPolling(false);
        onError && onError(statusResp.error || 'Scraping failed');
        return;
      }

      setStatus('idle');
      setIsPolling(false);
    } catch (err) {
      setStatus('error');
      setIsPolling(false);
      onError && onError(err.message || 'Failed to check scrape status');
    }
  }, [callWithAuth, onProgress, onComplete, onError]);

  async function triggerScrape() {
    setStatus('starting');
    try {
      await callWithAuth('/api/admin/scrape', { method: 'POST' });
      setStatus('in_progress');
      setIsPolling(true);
      onStart && onStart();
      poll();
    } catch (err) {
      setStatus('error');
      onError && onError(err.message || 'Failed to start scraping');
    }
  }

  const isDisabled = status === 'starting' || status === 'in_progress' || isPolling;

  return (
    <button
      onClick={triggerScrape}
      disabled={isDisabled}
      className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {(status === 'starting' || status === 'in_progress') && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )}
      <span>
        {status === 'starting' || status === 'in_progress' ? 'Scraping...' : 'Scrape Purdue Menus'}
      </span>
    </button>
  );
}
