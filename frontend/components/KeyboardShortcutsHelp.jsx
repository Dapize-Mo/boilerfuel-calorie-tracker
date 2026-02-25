import { SHORTCUTS } from '../hooks/useKeyboardShortcuts';

/**
 * Overlay showing all available keyboard shortcuts.
 * Toggled by pressing '?'.
 */
export default function KeyboardShortcutsHelp({ show, onClose }) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="bg-theme-bg-secondary border border-theme-border-secondary rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-theme-border-secondary flex items-center justify-between">
          <h2 className="text-sm font-bold text-theme-text-primary uppercase tracking-widest">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors p-1"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-3 space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-theme-text-secondary">{s.description}</span>
              <div className="flex gap-1">
                {s.keys.split(' ').map((k, i) => (
                  <kbd
                    key={i}
                    className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-theme-bg-primary border border-theme-border-secondary text-[11px] font-mono font-bold text-theme-text-primary"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-theme-border-secondary">
          <p className="text-[10px] text-theme-text-tertiary text-center">
            Press <kbd className="px-1 py-0.5 rounded bg-theme-bg-primary border border-theme-border-secondary text-[10px] font-mono">?</kbd> to toggle
          </p>
        </div>
      </div>
    </div>
  );
}
