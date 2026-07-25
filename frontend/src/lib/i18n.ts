'use client';
import { useEffect, useState } from 'react';

export type Lang = 'fr' | 'en';

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'fr';
  return (localStorage.getItem('ganndal_lang') as Lang) || 'fr';
}

export function setLang(l: Lang): void {
  localStorage.setItem('ganndal_lang', l);
  document.documentElement.lang = l;
  window.dispatchEvent(new Event('langchange'));
}

// i18n minimaliste : t(fr, en) renvoie la chaîne selon la langue courante.
// Toute chaîne non enveloppée reste en français (migration incrémentale).
export function useLang() {
  const [lang, setL] = useState<Lang>('fr'); // fr au premier rendu (SSR) -> pas de mismatch
  useEffect(() => {
    setL(getLang());
    document.documentElement.lang = getLang();
    const h = () => setL(getLang());
    window.addEventListener('langchange', h);
    return () => window.removeEventListener('langchange', h);
  }, []);
  const t = (fr: string, en: string) => (lang === 'en' ? en : fr);
  return { lang, t, setLang };
}
