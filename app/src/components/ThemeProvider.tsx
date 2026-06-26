import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import type { ThemeMode } from '../types';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  themes: { value: ThemeMode; label: string; icon: string }[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'light' },
  { value: 'dark', label: 'Dark', icon: 'dark' },
  { value: 'terminal', label: 'Terminal', icon: 'terminal' },
  { value: 'ide', label: 'IDE', icon: 'ide' },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const settings = useLiveQuery(() => db.settings.get('global'));
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (settings?.theme) {
      setThemeState(settings.theme);
    }
    setReady(true);
  }, [settings?.theme]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme, ready]);

  const setTheme = useCallback(
    async (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      await db.settings.put({
        id: 'global',
        theme: newTheme,
        sidebarWidth: settings?.sidebarWidth ?? 320,
        sidebarCollapsed: settings?.sidebarCollapsed ?? false,
        notesPanelWidth: settings?.notesPanelWidth ?? 320,
        notesPanelCollapsed: settings?.notesPanelCollapsed ?? true,
      });
    },
    [settings],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEME_OPTIONS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return ctx;
}
