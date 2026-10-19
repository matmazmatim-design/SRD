'use client';

import { useEffect, useState } from 'react';

// Przełącznik trybu. Wybór zapisuje się w przeglądarce (localStorage, klucz "srd-theme").
export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('srd-theme', next); } catch (e) {}
    setTheme(next);
  }

  const toLight = theme === 'dark';
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Przełącz tryb jasny lub ciemny">
      {toLight ? (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M14.5 11.2A6 6 0 0 1 6.8 3.5a6 6 0 1 0 7.7 7.7z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
      )}
      <span>Tryb: {toLight ? 'jasny' : 'ciemny'}</span>
    </button>
  );
}
