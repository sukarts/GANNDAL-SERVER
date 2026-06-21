'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Sujet {
  id: string;
  reference: string;
  titre: string;
  statut: string;
  priorite: string;
  dateLimite: string | null;
  jri: { nom: string; prenom: string } | null;
}

const STATUT_COLOR: Record<string, string> = {
  ASSIGNE: 'bg-gray-100 text-gray-700',
  EN_COURS: 'bg-blue-100 text-blue-700',
  LIVRE: 'bg-amber-100 text-amber-700',
  VALIDE: 'bg-green-100 text-green-700',
  REJETE: 'bg-red-100 text-red-700',
};

export default function SujetsPage() {
  const [sujets, setSujets] = useState<Sujet[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Sujet[]>('/sujets').then(setSujets).catch((e) => setError((e as Error).message));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sujets</h1>
      {error && <p className="text-red-600">{error}</p>}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Référence</th>
              <th className="p-3">Titre</th>
              <th className="p-3">JRI</th>
              <th className="p-3">Priorité</th>
              <th className="p-3">Échéance</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {sujets.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-mono text-xs">{s.reference}</td>
                <td className="p-3">{s.titre}</td>
                <td className="p-3">{s.jri ? `${s.jri.prenom} ${s.jri.nom}` : '—'}</td>
                <td className="p-3">{s.priorite}</td>
                <td className="p-3">{s.dateLimite ? new Date(s.dateLimite).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${STATUT_COLOR[s.statut] ?? ''}`}>{s.statut}</span>
                </td>
              </tr>
            ))}
            {sujets.length === 0 && (
              <tr><td className="p-6 text-center text-gray-400" colSpan={6}>Aucun sujet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
