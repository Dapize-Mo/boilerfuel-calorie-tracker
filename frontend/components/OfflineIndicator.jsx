import { useEffect, useState } from 'react';

export default function OfflineIndicator() {
  const [status, setStatus] = useState(null); // null | 'offline' | 'reconnected'

  useEffect(() => {
    if (!navigator.onLine) setStatus('offline');

    let reconnectTimer = null;

    const handleOffline = () => {
      clearTimeout(reconnectTimer);
      setStatus('offline');
    };

    const handleOnline = () => {
      setStatus('reconnected');
      reconnectTimer = setTimeout(() => setStatus(null), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearTimeout(reconnectTimer);
    };
  }, []);

  if (!status) return null;

  return (
    <div className="fixed top-16 inset-x-0 z-50 flex justify-center pointer-events-none">
      <div
        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest font-mono pointer-events-auto border-b border-x ${
          status === 'offline'
            ? 'bg-theme-bg-primary border-theme-text-primary/30 text-theme-text-primary'
            : 'bg-theme-bg-primary border-theme-text-primary/20 text-theme-text-tertiary'
        }`}
      >
        {status === 'offline' ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
              <path fillRule="evenodd" d="M2.22 2.22a.75.75 0 0 1 1.06 0l18.5 18.5a.75.75 0 0 1-1.06 1.06l-2.536-2.535A10.487 10.487 0 0 1 12 21.5a10.5 10.5 0 0 1-8.653-4.552.75.75 0 0 1 1.232-.855A9 9 0 0 0 12 20a9.004 9.004 0 0 0 4.315-1.094L14.28 16.87A4.503 4.503 0 0 1 7.56 10.148L5.284 7.873A8.993 8.993 0 0 0 3.75 12a.75.75 0 0 1-1.5 0 10.44 10.44 0 0 1 1.629-5.62l-1.659-1.66a.75.75 0 0 1 0-1.5ZM12 3.5c1.804 0 3.495.487 4.952 1.337L8.29 6.115A8.963 8.963 0 0 1 12 3.5Zm0 3.5a5.48 5.48 0 0 1 3.535 1.287l-7.33 7.33A4.503 4.503 0 0 1 12 7Z" clipRule="evenodd" />
            </svg>
            <span>You&apos;re offline — meal data saved locally</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
            </svg>
            <span>Back online</span>
          </>
        )}
      </div>
    </div>
  );
}
