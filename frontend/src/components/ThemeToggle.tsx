'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

// Bascule light/dark. Persiste 'ganndal_theme' et pose data-theme sur <html>.
// Le thème initial est déjà appliqué par le script inline du layout (anti-flash).
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('ganndal_theme', next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Passer en clair' : 'Passer en sombre'}
      title={dark ? 'Mode clair' : 'Mode sombre'}
      className="p-2 rounded-lg text-muted hover:bg-surface-2 hover:text-content transition-colors"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
