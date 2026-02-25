import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({
    theme: 'system',
    resolvedTheme: 'light',
    setTheme: () => { },
});

function getSystemTheme() {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme) {
    if (theme === 'system') return getSystemTheme();
    return theme;
}

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState('system');
    const [resolvedTheme, setResolvedTheme] = useState('light');

    // Load theme from saved preference on mount
    useEffect(() => {
        // Check both storage keys for backwards compatibility
        const savedTheme = localStorage.getItem('theme') || localStorage.getItem('boilerfuel_theme') || 'system';
        setThemeState(savedTheme);
        setResolvedTheme(resolveTheme(savedTheme));
    }, []);

    // Listen for system theme changes when in 'system' mode
    useEffect(() => {
        if (theme !== 'system') return;

        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        function onChange(e) {
            const resolved = e.matches ? 'dark' : 'light';
            setResolvedTheme(resolved);
            applyThemeToDOM(resolved);
        }
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [theme]);

    // Apply theme to document
    useEffect(() => {
        const resolved = resolveTheme(theme);
        setResolvedTheme(resolved);
        applyThemeToDOM(resolved);
        // Save to both keys for compatibility
        localStorage.setItem('theme', theme);
        localStorage.setItem('boilerfuel_theme', theme);
    }, [theme]);

    const setTheme = useCallback((newTheme) => {
        setThemeState(newTheme);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

function applyThemeToDOM(resolved) {
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

export function useTheme() {
    return useContext(ThemeContext);
}
