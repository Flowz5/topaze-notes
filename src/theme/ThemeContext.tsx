import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './context';

const STORAGE_KEY = 'topaze-theme';

// J'applique le thème sur <html> de façon synchrone : ainsi les composants qui
// lisent les variables CSS pendant le rendu (ex. le graphe) ont déjà les bonnes valeurs.
const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#13100d' : '#faf7f3');
};

const readStoredTheme = (): Theme | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage indisponible (navigation privée...) : on ignore
  }
  return null;
};

const systemTheme = (): Theme =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [hasUserChoice, setHasUserChoice] = useState(() => readStoredTheme() !== null);
  const [theme, setThemeState] = useState<Theme>(() => {
    const initial = readStoredTheme() ?? systemTheme();
    applyTheme(initial);
    return initial;
  });

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setThemeState(next);
    setHasUserChoice(true);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // pas grave, le thème ne sera juste pas mémorisé
    }
  }, []);

  // Tant que l'utilisateur n'a rien choisi, on suit le système en direct.
  useEffect(() => {
    if (hasUserChoice || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      const next: Theme = e.matches ? 'dark' : 'light';
      applyTheme(next);
      setThemeState(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [hasUserChoice]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
