import { useTheme } from '../context/ThemeContext';

const modes = ['light', 'system', 'dark'];
const labels = { light: 'Light', system: 'System', dark: 'Dark' };

export default function ThemeToggleButton() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    const idx = modes.indexOf(theme);
    const next = modes[(idx + 1) % modes.length];
    setTheme(next);
  };

  const icon = resolvedTheme === 'dark' ? 'moon' : 'sun';
  const isSystem = theme === 'system';

  return (
    <button
      onClick={cycleTheme}
      className="p-3 rounded-full bg-theme-bg-secondary border border-theme-border-secondary shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 relative"
      aria-label={`Theme: ${labels[theme]}. Click to switch.`}
      title={`Theme: ${labels[theme]} — click to cycle`}
    >
      {icon === 'moon' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-400">
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500">
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
        </svg>
      )}

      {/* System indicator dot */}
      {isSystem && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-theme-info border-2 border-theme-bg-secondary" title="Following system preference" />
      )}
    </button>
  );
}
