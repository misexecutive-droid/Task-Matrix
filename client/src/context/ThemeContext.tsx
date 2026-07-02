import React, { createContext, useContext, useEffect, useState } from 'react';

// A simple type that restricts theme values to either 'light' or 'dark'.
type Theme = 'light' | 'dark';

// Defines what the theme context will expose to components.
interface ThemeContextType {
  theme:       Theme;          // current theme value
  toggleTheme: () => void;     // function to switch between themes
}

// Create a context for theme state, initialized as null until the provider sets it.
const ThemeContext = createContext<ThemeContextType | null>(null);

// Determine the initial theme when the app starts.
const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('tm-theme');
  if (stored === 'light' || stored === 'dark') return stored;

  // Fallback to the user's OS/browser preference if nothing is stored.
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Keep theme in state and initialize it from local storage or system preference.
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    // Apply the current theme to the document so CSS can respond to it.
    document.documentElement.setAttribute('data-theme', theme);
    // Save the selected theme so it persists across page reloads.
    localStorage.setItem('tm-theme', theme);
  }, [theme]);

  // Flip the theme from light to dark or dark to light.
  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
};
