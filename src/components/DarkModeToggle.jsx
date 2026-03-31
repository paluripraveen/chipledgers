import { useState, useEffect } from 'react';

function getInitialTheme() {
  const stored = localStorage.getItem('chipledgers_theme');
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function DarkModeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('chipledgers_theme', theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      className="text-emerald-200 hover:text-white text-sm"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
