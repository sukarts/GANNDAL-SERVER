'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Jri {
  id: string; nom: string; prenom: string; email: string; actif: boolean;
  jriProfile: { tarifParSujet: string; tarifParMinute: string; specialite: string | null } | null;
}

export default function JriPage() {
  const [list, setList] = useState<Jri[]>([]);
  useEffect(() => { api<Jri[]>('/users?role=JRI').then(setList).catch(() => {}); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">JRI / Pigistes</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Nom</th><th className="p-3">Email</th><th className="p-3">Spécialité</th><th className="p-3">Tarif/sujet</th><th className="p-3">Tarif/min</th><th className="p-3">Actif</th></tr>
          </thead>
          <tbody>
            {list.map((j) => (
              <tr key={j.id} className="border-t">
                <td className="p-3">{j.prenom} {j.nom}</td>
                <td className="p-3">{j.email}</td>
                <td className="p-3">{j.jriProfile?.specialite ?? '—'}</td>
                <td className="p-3">{j.jriProfile?.tarifParSujet ?? '—'}</td>
                <td className="p-3">{j.jriProfile?.tarifParMinute ?? '—'}</td>
                <td className="p-3">{j.actif ? '✅' : '❌'}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td className="p-6 text-center text-gray-400" colSpan={6}>Aucun JRI</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
