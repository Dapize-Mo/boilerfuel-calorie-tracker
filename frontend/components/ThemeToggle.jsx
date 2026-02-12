import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 rounded-lg bg-theme-bg-hover/80 p-1 border border-theme-border-primary">
      <button
        onClick={() => setTheme('soft')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'soft' || theme === 'swiss' || theme === 'glass'
            ? 'bg-theme-bg-secondary text-theme-text-primary shadow-md'
            : 'text-theme-text-tertiary hover:text-theme-text-primary'
          }`}
        title="Light mode (Soft)"
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme('default')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'default'
            ? 'bg-theme-bg-secondary text-theme-text-primary shadow-md'
            : 'text-theme-text-tertiary hover:text-theme-text-primary'
          }`}
        title="Dark mode (Default)"
      >
        🌙
      </button>
    </div>
  );
}
