import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
    theme: 'default',
    setTheme: () => { },
});

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('bare');

    // Load theme from saved preference on mount
    useEffect(() => {
        // Enforce bare theme
        setTheme('bare');
        localStorage.setItem('boilerfuel_theme', 'bare');
    }, []);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        // Always apply 'bare' data-theme
        root.setAttribute('data-theme', 'bare');

        // Ensure no other classes interfere
        root.classList.remove('dark', 'light');

        // Save to local storage
        localStorage.setItem('boilerfuel_theme', 'bare');
    }, [theme]);

    // Handle font loading if themes use different fonts
    useEffect(() => {
        // No special fonts needed for bare theme (Times New Roman)
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
