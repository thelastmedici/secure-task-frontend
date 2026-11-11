import { useEffect, useState } from 'react';

export function useThemePreference() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

export function ThemeToggle() {
  const { theme, setTheme } = useThemePreference();

  return (
    <button
      type="button"
      className={`theme-toggle ${theme === 'dark' ? 'dark' : 'light'}`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb" />
        <span className="theme-toggle-sun">☀</span>
        <span className="theme-toggle-moon">☾</span>
      </span>
    </button>
  );
}
