'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiPaged } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import Pagination from '@/components/Pagination';
import { Film, AudioLines, Image, FileText, type LucideIcon } from 'lucide-react';

interface Media {
  id: string; type: string; nomFichier: string; url: string | null; version: number;
  tailleOctets: string; createdAt: string;
  sujet: { id: string; reference: string; titre: string };
}

const LIMIT = 24;
const TYPES = ['', 'VIDEO', 'AUDIO', 'PHOTO', 'DOCUMENT'];
const ICONE: Record<string, LucideIcon> = { VIDEO: Film, AUDIO: AudioLines, PHOTO: Image, DOCUMENT: FileText };

function taille(o: string): string {
  const n = Number(o);
  if (n > 1e9) return (n / 1e9).toFixed(1) + ' Go';
  if (n > 1e6) return (n / 1e6).toFixed(1) + ' Mo';
  if (n > 1e3) return (n / 1e3).toFixed(0) + ' Ko';
  return n + ' o';
}

export default function MediasPage() {
  const [items, setItems] = useState<Media[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [recherche, setRecherche] = useState('');
  const { t } = useLang();

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (recherche) params.set('q', recherche);
    apiPaged<Media>(`/medias?${params.toString()}`, page, LIMIT)
      .then((r) => { setItems(r.items); setTotal(r.total); })
      .catch(() => {});
  }, [type, recherche, page]);
  useEffect(load, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">{t('Médiathèque', 'Media library')}</h1>
        <div className="flex items-center gap-2">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); setRecherche(q); }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Rechercher un fichier…', 'Search a file…')} className="border rounded px-3 py-1.5 text-sm w-56" />
          </form>
          <select value={type} onChange={(e) => { setPage(1); setType(e.target.value); }} className="border rounded px-2 py-1.5 text-sm">
            <option value="">{t('Tous types', 'All types')}</option>
            {TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((m) => (
          <div key={m.id} className="bg-surface rounded-xl shadow-sm overflow-hidden">
            <div className="aspect-video bg-surface-2 border border-line flex items-center justify-center overflow-hidden">
              {m.type === 'PHOTO' && m.url
                ? <img src={m.url} alt={m.nomFichier} className="w-full h-full object-cover" />
                : m.type === 'VIDEO' && m.url
                  ? <video src={m.url} className="w-full h-full object-cover" preload="metadata" />
                  : (() => { const Icone = ICONE[m.type] ?? FileText; return <Icone size={32} strokeWidth={1.5} className="text-muted" />; })()}
            </div>
            <div className="p-2 text-xs">
              <div className="font-medium truncate" title={m.nomFichier}>{m.nomFichier}</div>
              <div className="text-muted flex justify-between mt-0.5">
                <span>{m.type} · v{m.version}</span><span>{taille(m.tailleOctets)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <Link href={`/dashboard/sujets/${m.sujet.id}`} className="text-brand font-mono text-[10px] hover:underline">{m.sujet.reference}</Link>
                {m.url && <a href={m.url} target="_blank" className="underline text-muted">{t('Ouvrir', 'Open')}</a>}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="col-span-full text-center text-muted py-10">{t('Aucun élément.', 'No files.')}</p>}
      </div>

      <div className="mt-4"><Pagination page={page} total={total} limit={LIMIT} onChange={setPage} /></div>
    </div>
  );
}
