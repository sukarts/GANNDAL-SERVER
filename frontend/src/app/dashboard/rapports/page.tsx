'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Activite { periode: string; crees: number; livres: number; valides: number; rejetes: number }
interface Classement { jriId: string; nom: string; sujets: number; minutes: number }

export default function RapportsPage() {
  const [periode, setPeriode] = useState('mois');
  const [act, setAct] = useState<Activite | null>(null);
  const [classement, setClassement] = useState<Classement[]>([]);

  useEffect(() => {
    api<Activite>(`/rapports/activite?periode=${periode}`).then(setAct).catch(() => {});
    api<Classement[]>(`/rapports/classement-jri?periode=${periode}`).then(setClassement).catch(() => {});
  }, [periode]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Rapports</h1>
        <div className="flex items-center gap-2">
          <select value={periode} onChange={(e) => setPeriode(e.target.value)} className="border rounded px-3 py-1">
            <option value="jour">Journalier</option>
            <option value="semaine">Hebdomadaire</option>
            <option value="mois">Mensuel</option>
          </select>
          <button onClick={() => window.print()} className="border rounded px-3 py-1 text-sm hover:bg-gray-50">Imprimer / PDF</button>
        </div>
      </div>

      {act && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-xs text-gray-500">Créés</div><div className="text-2xl font-bold">{act.crees}</div></div>
          <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-xs text-gray-500">Livrés</div><div className="text-2xl font-bold">{act.livres}</div></div>
          <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-xs text-gray-500">Validés</div><div className="text-2xl font-bold">{act.valides}</div></div>
          <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-xs text-gray-500">Rejetés</div><div className="text-2xl font-bold">{act.rejetes}</div></div>
        </div>
      )}

      <h2 className="font-semibold mb-2">Classement des JRI</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">#</th><th className="p-3">JRI</th><th className="p-3">Sujets</th><th className="p-3">Minutes</th></tr></thead>
          <tbody>
            {classement.map((c, i) => (
              <tr key={c.jriId} className="border-t"><td className="p-3">{i + 1}</td><td className="p-3">{c.nom}</td><td className="p-3">{c.sujets}</td><td className="p-3">{c.minutes}</td></tr>
            ))}
            {classement.length === 0 && <tr><td className="p-6 text-center text-gray-400" colSpan={4}>Aucune donnée</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
