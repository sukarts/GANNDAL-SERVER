'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';

interface Fiche {
  id: string; reference: string; annee: number; mois: number;
  nbSujets: number; totalMinutes: number; montantTotal: string; statut: string;
  jri?: { nom: string; prenom: string };
}

export default function PaiementsPage() {
  const [list, setList] = useState<Fiche[]>([]);
  useEffect(() => { api<Fiche[]>('/paiements').then(setList).catch(() => {}); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Piges & paiements</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Référence</th><th className="p-3">JRI</th><th className="p-3">Période</th><th className="p-3">Sujets</th><th className="p-3">Minutes</th><th className="p-3">Total</th><th className="p-3">Statut</th></tr>
          </thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3 font-mono text-xs">{f.reference}</td>
                <td className="p-3">{f.jri ? `${f.jri.prenom} ${f.jri.nom}` : '—'}</td>
                <td className="p-3">{String(f.mois).padStart(2, '0')}/{f.annee}</td>
                <td className="p-3">{f.nbSujets}</td>
                <td className="p-3">{f.totalMinutes}</td>
                <td className="p-3 font-medium">{formatMoney(Number(f.montantTotal))}</td>
                <td className="p-3">{f.statut}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td className="p-6 text-center text-gray-400" colSpan={7}>Aucune fiche</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
