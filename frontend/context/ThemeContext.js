import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
    theme: 'default',
    setTheme: () => { },
});

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');

    // Load theme from saved preference on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('boilerfuel_theme') || 'light';
        setTheme(savedTheme);
    }, []);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
        root.removeAttribute('data-theme'); // Clear bare theme if present
        localStorage.setItem('boilerfuel_theme', theme);
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
