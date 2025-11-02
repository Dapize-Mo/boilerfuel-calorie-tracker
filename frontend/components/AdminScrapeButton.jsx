import React, { useState } from 'react';

export default function AdminScrapeButton({ adminPassword, authToken }) {
  const [status, setStatus] = useState('idle');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

  async function triggerScrape() {
    setStatus('starting');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (adminPassword) headers['X-ADMIN-PASSWORD'] = adminPassword;
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${apiUrl}/api/admin/scrape`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        setStatus('started');
      } else if (res.status === 401) {
        setStatus('unauthorized');
      } else {
        const txt = await res.text();
        setStatus(`error: ${res.status} ${txt}`);
      }
    } catch (err) {
      setStatus('error: ' + (err.message || err));
    }
  }

  return (
    <div>
      <button onClick={triggerScrape} disabled={status === 'starting' || status === 'started'}>
        {status === 'starting' ? 'Starting...' : 'Run Purdue scrape now'}
      </button>
      <div style={{ marginTop: 8 }}>{status}</div>
    </div>
  );
}
