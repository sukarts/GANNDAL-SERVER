'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Dotation {
  id: string; dateRemise: string; statut: string; etatRemise: string;
  materiel: { reference: string; categorie: { nom: string } };
  jri: { nom: string; prenom: string };
}

export default function DotationsPage() {
  const [list, setList] = useState<Dotation[]>([]);
  useEffect(() => { api<Dotation[]>('/dotations').then(setList).catch(() => {}); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dotations</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Matériel</th><th className="p-3">Catégorie</th><th className="p-3">JRI</th><th className="p-3">Remise</th><th className="p-3">État remise</th><th className="p-3">Statut</th></tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3 font-mono text-xs">{d.materiel.reference}</td>
                <td className="p-3">{d.materiel.categorie?.nom}</td>
                <td className="p-3">{d.jri.prenom} {d.jri.nom}</td>
                <td className="p-3">{new Date(d.dateRemise).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{d.etatRemise}</td>
                <td className="p-3">{d.statut}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td className="p-6 text-center text-gray-400" colSpan={6}>Aucune dotation</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
