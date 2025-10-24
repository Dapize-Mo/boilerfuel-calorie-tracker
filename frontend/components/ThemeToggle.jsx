import { useTheme } from '../utils/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 rounded-lg bg-theme-bg-hover/80 p-1 border border-theme-border-primary">
      <button
        onClick={() => setTheme('light')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          theme === 'light'
            ? 'bg-theme-bg-secondary text-theme-text-primary shadow-md'
            : 'text-theme-text-tertiary hover:text-theme-text-primary'
        }`}
        title="Light mode"
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          theme === 'system'
            ? 'bg-theme-bg-secondary text-theme-text-primary shadow-md'
            : 'text-theme-text-tertiary hover:text-theme-text-primary'
        }`}
        title="System theme"
      >
        💻
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          theme === 'dark'
            ? 'bg-theme-bg-secondary text-theme-text-primary shadow-md'
            : 'text-theme-text-tertiary hover:text-theme-text-primary'
        }`}
        title="Dark mode"
      >
        🌙
      </button>
    </div>
  );
}
