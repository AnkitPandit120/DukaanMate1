import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark'; 

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always default to light
  const [theme] = useState<Theme>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    // Ensure dark mode class is removed and light is added
    root.classList.remove('dark');
    root.classList.add('light');
    localStorage.setItem('dukaan-theme', 'light');
  }, []);

  const toggleTheme = () => {
    // No-op: Dark mode disabled per user request
    console.log("Dark mode is currently disabled.");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
     // Fallback if used outside provider, though ideally shouldn't happen
    return { theme: 'light', toggleTheme: () => {} };
  }
  return context;
};