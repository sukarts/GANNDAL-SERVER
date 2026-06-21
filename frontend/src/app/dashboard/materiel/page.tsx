'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';

interface Inventaire {
  total: number; disponible: number; affecte: number;
  maintenance: number; perdu: number; vole: number; valeurParc: number;
}
interface Materiel {
  id: string; reference: string; numInventaire: string; marque: string | null;
  modele: string | null; etat: string; statut: string; categorie: { nom: string };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-brand">{value}</div>
    </div>
  );
}

export default function MaterielPage() {
  const [inv, setInv] = useState<Inventaire | null>(null);
  const [list, setList] = useState<Materiel[]>([]);

  useEffect(() => {
    api<Inventaire>('/materiel/inventaire').then(setInv).catch(() => {});
    api<Materiel[]>('/materiel').then(setList).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Équipements & inventaire</h1>
      {inv && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <Stat label="Total" value={inv.total} />
          <Stat label="Disponible" value={inv.disponible} />
          <Stat label="Affecté" value={inv.affecte} />
          <Stat label="Maintenance" value={inv.maintenance} />
          <Stat label="Perdu/Volé" value={inv.perdu + inv.vole} />
          <Stat label="Valeur parc" value={formatMoney(inv.valeurParc)} />
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Réf.</th><th className="p-3">N° inventaire</th>
              <th className="p-3">Catégorie</th><th className="p-3">Marque/Modèle</th>
              <th className="p-3">État</th><th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-3 font-mono text-xs">{m.reference}</td>
                <td className="p-3">{m.numInventaire}</td>
                <td className="p-3">{m.categorie?.nom}</td>
                <td className="p-3">{[m.marque, m.modele].filter(Boolean).join(' ')}</td>
                <td className="p-3">{m.etat}</td>
                <td className="p-3">{m.statut}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td className="p-6 text-center text-gray-400" colSpan={6}>Aucun équipement</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
