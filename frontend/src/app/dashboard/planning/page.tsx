'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, getUser } from '@/lib/api';

interface Sujet {
  id: string; reference: string; titre: string; statut: string; priorite: string;
  rubrique: string | null; dateLimite: string | null;
  jri: { nom: string; prenom: string } | null;
}

const COLS: { statut: string; label: string; color: string }[] = [
  { statut: 'ASSIGNE', label: 'Assigné', color: 'border-gray-300' },
  { statut: 'EN_COURS', label: 'En cours', color: 'border-blue-400' },
  { statut: 'LIVRE', label: 'Livré', color: 'border-amber-400' },
  { statut: 'VALIDE', label: 'Validé', color: 'border-green-500' },
  { statut: 'REJETE', label: 'Rejeté', color: 'border-red-400' },
];
const PRIO_DOT: Record<string, string> = { BASSE: 'bg-gray-300', NORMALE: 'bg-blue-400', HAUTE: 'bg-amber-500', URGENTE: 'bg-red-500' };
const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function PlanningPage() {
  const [sujets, setSujets] = useState<Sujet[]>([]);
  const [vue, setVue] = useState<'kanban' | 'calendrier'>('kanban');
  const [curseur, setCurseur] = useState(new Date());
  const [drag, setDrag] = useState<string | null>(null);
  const user = typeof window !== 'undefined' ? getUser() : null;
  const peutDeplacer = user?.role === 'ADMIN' || user?.role === 'REDACTEUR';

  const load = useCallback(() => { api<Sujet[]>('/sujets').then(setSujets).catch(() => {}); }, []);
  useEffect(load, [load]);

  async function deplacer(id: string, statut: string) {
    const s = sujets.find((x) => x.id === id);
    if (!s || s.statut === statut) return;
    // maj optimiste
    setSujets((prev) => prev.map((x) => (x.id === id ? { ...x, statut } : x)));
    try {
      if (statut === 'VALIDE' || statut === 'REJETE') {
        await api(`/sujets/${id}/validation`, { method: 'POST', body: JSON.stringify({ action: statut }) });
      } else {
        await api(`/sujets/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) });
      }
    } catch { load(); } // rollback via reload si échec
  }

  function Carte({ s }: { s: Sujet }) {
    const enRetard = s.dateLimite && new Date(s.dateLimite) < new Date() && s.statut !== 'VALIDE';
    return (
      <Link
        href={`/dashboard/sujets/${s.id}`}
        draggable={peutDeplacer}
        onDragStart={() => setDrag(s.id)}
        onDragEnd={() => setDrag(null)}
        className="block bg-white rounded-lg border p-2 mb-2 text-sm shadow-sm hover:shadow cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2 h-2 rounded-full ${PRIO_DOT[s.priorite] ?? 'bg-gray-300'}`} />
          <span className="font-mono text-[10px] text-gray-400">{s.reference}</span>
          {s.rubrique && <span className="ml-auto text-[10px] bg-gray-100 rounded px-1.5 py-0.5">{s.rubrique}</span>}
        </div>
        <div className="font-medium leading-tight">{s.titre}</div>
        <div className="text-xs text-gray-500 mt-1 flex justify-between">
          <span>{s.jri ? `${s.jri.prenom} ${s.jri.nom}` : '—'}</span>
          {s.dateLimite && <span className={enRetard ? 'text-red-600 font-medium' : ''}>{new Date(s.dateLimite).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>}
        </div>
      </Link>
    );
  }

  // ---- Calendrier ----
  const annee = curseur.getFullYear(), mois = curseur.getMonth();
  const premier = new Date(annee, mois, 1);
  const decalage = (premier.getDay() + 6) % 7; // lundi = 0
  const nbJours = new Date(annee, mois + 1, 0).getDate();
  const cellules: (number | null)[] = [...Array(decalage).fill(null), ...Array.from({ length: nbJours }, (_, i) => i + 1)];
  const sujetsDuJour = (j: number) => sujets.filter((s) => {
    if (!s.dateLimite) return false;
    const d = new Date(s.dateLimite);
    return d.getFullYear() === annee && d.getMonth() === mois && d.getDate() === j;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planning éditorial</h1>
        <div className="flex rounded-lg border overflow-hidden text-sm">
          <button onClick={() => setVue('kanban')} className={`px-3 py-1.5 ${vue === 'kanban' ? 'bg-brand text-white' : 'bg-white'}`}>Kanban</button>
          <button onClick={() => setVue('calendrier')} className={`px-3 py-1.5 ${vue === 'calendrier' ? 'bg-brand text-white' : 'bg-white'}`}>Calendrier</button>
        </div>
      </div>

      {vue === 'kanban' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {COLS.map((c) => {
            const items = sujets.filter((s) => s.statut === c.statut);
            return (
              <div
                key={c.statut}
                onDragOver={(e) => { if (peutDeplacer) e.preventDefault(); }}
                onDrop={() => { if (drag) deplacer(drag, c.statut); setDrag(null); }}
                className={`bg-gray-50 rounded-xl p-2 border-t-4 ${c.color} min-h-[120px]`}
              >
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-sm font-medium">{c.label}</span>
                  <span className="text-xs text-gray-400">{items.length}</span>
                </div>
                {items.map((s) => <Carte key={s.id} s={s} />)}
              </div>
            );
          })}
        </div>
      )}
      {vue === 'kanban' && peutDeplacer && <p className="text-xs text-gray-400 mt-3">Glissez-déposez une carte pour changer son statut.</p>}

      {vue === 'calendrier' && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setCurseur(new Date(annee, mois - 1, 1))} className="border rounded px-2 py-1 text-sm">←</button>
            <span className="font-medium">{MOIS_FR[mois]} {annee}</span>
            <button onClick={() => setCurseur(new Date(annee, mois + 1, 1))} className="border rounded px-2 py-1 text-sm">→</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((j) => (
              <div key={j} className="text-center text-gray-500 font-medium py-1">{j}</div>
            ))}
            {cellules.map((j, i) => (
              <div key={i} className={`min-h-[84px] rounded-lg p-1 ${j ? 'bg-white border' : ''}`}>
                {j && <div className="text-[11px] text-gray-400 mb-1">{j}</div>}
                {j && sujetsDuJour(j).map((s) => {
                  const enRetard = s.statut !== 'VALIDE' && new Date(s.dateLimite!) < new Date();
                  return (
                    <Link key={s.id} href={`/dashboard/sujets/${s.id}`} className={`block truncate rounded px-1 py-0.5 mb-0.5 text-[10px] ${enRetard ? 'bg-red-100 text-red-700' : 'bg-brand/10 text-brand'}`}>
                      {s.titre}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
