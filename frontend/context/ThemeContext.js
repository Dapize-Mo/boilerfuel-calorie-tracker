import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
    theme: 'system',
    setTheme: () => { },
});

function applyResolvedTheme(resolved) {
    const root = document.documentElement;
    if (resolved === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
    } else {
        root.classList.add('light');
        root.classList.remove('dark');
    }
    root.removeAttribute('data-theme');
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('system');

    // Load theme from saved preference on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('boilerfuel_theme') || 'system';
        setTheme(savedTheme);
    }, []);

    // Apply theme to document; for 'system', follow prefers-color-scheme
    useEffect(() => {
        localStorage.setItem('boilerfuel_theme', theme);

        if (theme === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            applyResolvedTheme(mq.matches ? 'dark' : 'light');
            const handler = (e) => applyResolvedTheme(e.matches ? 'dark' : 'light');
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        } else {
            applyResolvedTheme(theme);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
