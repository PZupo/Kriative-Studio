import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize state from localStorage or default to 'light'
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const storedTheme = window.localStorage.getItem('kriative-theme');
            return storedTheme === 'dark' ? 'dark' : 'light';
        } catch (error) {
            console.error("Could not access localStorage for theme.", error);
            return 'light';
        }
    });

    useEffect(() => {
        const root = window.document.documentElement;
        
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        try {
            window.localStorage.setItem('kriative-theme', theme);
        } catch (error) {
             console.error("Could not save theme to localStorage.", error);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const value = { theme, toggleTheme };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
