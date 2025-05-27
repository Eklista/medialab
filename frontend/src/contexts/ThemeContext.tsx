// src/contexts/ThemeContext.tsx - Versión corregida
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Solo verificar localStorage si estamos en el navegador
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('medialab-theme') as Theme;
        if (stored && ['light', 'dark'].includes(stored)) {
          return stored;
        }
        
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
      } catch (error) {
        console.warn('Error accessing localStorage:', error);
      }
    }
    
    return 'light';
  });

  useEffect(() => {
    // Solo ejecutar en el navegador
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Store in localStorage with error handling
    try {
      localStorage.setItem('medialab-theme', theme);
    } catch (error) {
      console.warn('Error saving theme to localStorage:', error);
    }
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#ffffff');
    }

    // Update body background for better theme transition
    document.body.className = theme === 'dark' 
      ? 'bg-gray-900 text-white transition-colors duration-200' 
      : 'bg-white text-gray-900 transition-colors duration-200';
      
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Solo cambiar automáticamente si no hay preferencia guardada
      try {
        const storedTheme = localStorage.getItem('medialab-theme');
        if (!storedTheme) {
          setThemeState(e.matches ? 'dark' : 'light');
        }
      } catch (error) {
        console.warn('Error checking localStorage:', error);
      }
    };

    // Soporte para navegadores más antiguos
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value = {
    theme,
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};