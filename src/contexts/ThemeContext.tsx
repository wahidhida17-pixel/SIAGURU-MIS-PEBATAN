import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, ColorThemeId, COLOR_THEMES, ColorThemeOption } from '../types/theme';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorTheme: ColorThemeId;
  resolvedMode: 'light' | 'dark';
  currentThemeOption: ColorThemeOption;
  setThemeMode: (mode: ThemeMode) => void;
  setColorTheme: (theme: ColorThemeId) => void;
  toggleThemeMode: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = 'siaguru_theme_mode';
const COLOR_THEME_KEY = 'siaguru_color_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_MODE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'light';
  });

  const [colorTheme, setColorThemeState] = useState<ColorThemeId>(() => {
    try {
      const saved = localStorage.getItem(COLOR_THEME_KEY);
      if (COLOR_THEMES.some(t => t.id === saved)) {
        return saved as ColorThemeId;
      }
    } catch {
      // fallback
    }
    return 'emerald';
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen to system dark mode changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedMode: 'light' | 'dark' = themeMode === 'system' 
    ? (systemDark ? 'dark' : 'light') 
    : themeMode;

  const currentThemeOption = COLOR_THEMES.find(t => t.id === colorTheme) || COLOR_THEMES[0];

  // Apply classes and CSS variables whenever resolvedMode or colorTheme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Toggle dark class
    if (resolvedMode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }

    // Set dataset attributes for target styling
    root.dataset.mode = resolvedMode;
    root.dataset.colorTheme = colorTheme;

    // Apply dynamic CSS variables on root
    root.style.setProperty('--theme-primary', currentThemeOption.primaryHex);
    root.style.setProperty('--theme-secondary', currentThemeOption.secondaryHex);
    root.style.setProperty('--theme-accent', currentThemeOption.accentHex);
  }, [resolvedMode, colorTheme, currentThemeOption]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(THEME_MODE_KEY, mode);
    } catch {
      // ignore
    }
  };

  const setColorTheme = (theme: ColorThemeId) => {
    setColorThemeState(theme);
    try {
      localStorage.setItem(COLOR_THEME_KEY, theme);
    } catch {
      // ignore
    }
  };

  const toggleThemeMode = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('light');
    } else {
      // If currently system, toggle opposite to current resolved
      setThemeMode(resolvedMode === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        colorTheme,
        resolvedMode,
        currentThemeOption,
        setThemeMode,
        setColorTheme,
        toggleThemeMode,
        isDark: resolvedMode === 'dark'
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
