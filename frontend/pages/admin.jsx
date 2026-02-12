import { useTheme } from '../context/ThemeContext';
import Link from 'next/link';

export default function AdminPanel() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen p-8 bg-theme-bg-primary text-theme-text-primary font-mono flex flex-col items-center justify-center">
      <h1 className="text-4xl mb-8 font-bold">Admin</h1>

      <div className="space-y-4 flex flex-col items-center">
        <p className="mb-4">Current Theme: <span className="font-bold uppercase">{theme}</span></p>

        <button
          onClick={() => setTheme('light')}
          className="px-6 py-2 border border-theme-text-primary hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors uppercase"
        >
          Set Light Mode
        </button>

        <button
          onClick={() => setTheme('dark')}
          className="px-6 py-2 border border-theme-text-primary hover:bg-theme-text-primary hover:text-theme-bg-primary transition-colors uppercase"
        >
          Set Dark Mode
        </button>
      </div>

      <div className="mt-12">
        <Link href="/" className="underline hover:no-underline">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
