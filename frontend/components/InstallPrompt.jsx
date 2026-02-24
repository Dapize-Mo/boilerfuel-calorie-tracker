import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'boilerfuel-install-dismissed';

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [platform, setPlatform] = useState(null); // 'android' | 'ios' | null
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Never show if already running as installed PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) return;

    // Never show if user already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isIosSafari =
      isIos && /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

    if (isIosSafari) {
      // Delay slightly so it doesn't pop up the instant the page loads
      const t = setTimeout(() => {
        setPlatform('ios');
        setVisible(true);
      }, 3000);
      return () => clearTimeout(t);
    }

    // Android / Chrome — wait for the browser's install prompt event
    const handler = (e) => {
      e.preventDefault();
      setInstallEvent(e);
      setPlatform('android');
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setInstallEvent(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Add BoilerFuel to your home screen"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe"
    >
      <div className="max-w-md mx-auto rounded-2xl shadow-2xl border border-theme-border-secondary bg-theme-bg-secondary overflow-hidden">
        {/* Amber accent strip */}
        <div className="h-1 bg-gradient-to-r from-yellow-400 to-yellow-500" />

        <div className="p-4 flex items-start gap-3">
          {/* App icon */}
          <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-slate-900">
              <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
              <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-theme-text-primary">
              Add BoilerFuel to your home screen
            </p>

            {platform === 'android' && (
              <>
                <p className="text-xs text-theme-text-tertiary mt-0.5">
                  Install the app for quick access — no App Store needed.
                </p>
                <button
                  onClick={handleInstall}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-900 text-sm font-semibold transition-colors"
                >
                  Install
                </button>
              </>
            )}

            {platform === 'ios' && (
              <p className="text-xs text-theme-text-secondary mt-1 leading-relaxed">
                Tap the{' '}
                <span className="inline-flex items-center gap-0.5 align-middle">
                  {/* iOS Share icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-400">
                    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
                  </svg>
                </span>{' '}
                Share button, then choose{' '}
                <strong className="text-theme-text-primary">Add to Home Screen</strong>.
              </p>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="shrink-0 p-1 rounded-md text-theme-text-tertiary hover:text-theme-text-primary hover:bg-theme-bg-hover transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
