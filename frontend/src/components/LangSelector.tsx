'use client';
import { useLang } from '@/lib/i18n';

export default function LangSelector() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-lg border border-line overflow-hidden text-xs">
      {(['fr', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 uppercase ${lang === l ? 'bg-brand text-white' : 'bg-surface text-content hover:bg-surface-2'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
