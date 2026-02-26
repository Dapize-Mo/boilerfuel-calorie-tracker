import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'boilerfuel-install-dismissed';

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [platform, setPlatform] = useState(null); // 'android' | 'ios' | null
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) return;

    if (localStorage.getItem(DISMISSED_KEY)) return;

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isIosSafari =
      isIos && /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

    if (isIosSafari) {
      const t = setTimeout(() => {
        setPlatform('ios');
        setVisible(true);
      }, 3000);
      return () => clearTimeout(t);
    }

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
    if (outcome === 'accepted') setVisible(false);
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
      className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe font-mono"
    >
      <div className="max-w-md mx-auto border border-theme-text-primary/20 bg-theme-bg-primary overflow-hidden">
        {/* Yellow accent strip */}
        <div className="h-px bg-yellow-500/60" />

        <div className="p-4 flex items-start gap-3">
          {/* App icon */}
          <div className="shrink-0 w-10 h-10 bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500/80">
              <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
              <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-theme-text-primary">
              Add to home screen
            </p>

            {platform === 'android' && (
              <>
                <p className="text-[10px] text-theme-text-tertiary mt-1">
                  Install for quick access — no App Store needed.
                </p>
                <button
                  onClick={handleInstall}
                  className="mt-3 px-4 py-1.5 bg-yellow-500 text-slate-900 text-xs font-bold uppercase tracking-wider hover:bg-yellow-400 transition-colors"
                >
                  Install
                </button>
              </>
            )}

            {platform === 'ios' && (
              <p className="text-[10px] text-theme-text-secondary mt-1 leading-relaxed">
                Tap the{' '}
                <span className="inline-flex items-center gap-0.5 align-middle">
                  {/* iOS Safari Share button icon: arrow-up-on-square */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-theme-text-tertiary">
                    <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                  </svg>
                </span>{' '}
                Share button, then <strong className="text-theme-text-primary">Add to Home Screen</strong>.
              </p>
            )}
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="shrink-0 p-1 text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
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
