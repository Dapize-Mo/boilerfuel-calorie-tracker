import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
    theme: 'default',
    setTheme: () => { },
});

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('default');

    // Load theme from saved preference on mount
    useEffect(() => {
        // Check local storage or cookies logic here
        const savedTheme = localStorage.getItem('boilerfuel_theme') || 'default';
        setTheme(savedTheme);
    }, []);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'default') {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', theme);
        }

        // Save to local storage
        localStorage.setItem('boilerfuel_theme', theme);
    }, [theme]);

    // Handle font loading if themes use different fonts
    useEffect(() => {
        if (theme === 'soft') {
            // Import Nunito or Quicksand if needed, or rely on locally installed/Google Fonts
            // For now we assume they are available or fallback
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
