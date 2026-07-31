'use client';
import { useLang } from '@/lib/i18n';

export default function LangSelector() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-lg border overflow-hidden text-xs">
      {(['fr', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 uppercase ${lang === l ? 'bg-brand text-white' : 'bg-surface text-gray-600'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
