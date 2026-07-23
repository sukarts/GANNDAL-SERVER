'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getUser } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import Modal from '@/components/Modal';
import PieParcMateriel from '@/components/PieParcMateriel';

interface Inventaire {
  total: number; disponible: number; affecte: number;
  maintenance: number; perdu: number; vole: number; valeurParc: number;
}
interface Materiel {
  id: string; reference: string; numInventaire: string; marque: string | null;
  modele: string | null; etat: string; statut: string; categorie: { nom: string };
}
interface Categorie { id: string; nom: string }

const INPUT = 'w-full border rounded px-3 py-2 text-sm';
const empty = { reference: '', numInventaire: '', categorieId: '', marque: '', modele: '', numSerie: '', dateAchat: '', fournisseur: '', coutAcquisition: '', garantieFin: '', etat: 'NEUF' };

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
  const [cats, setCats] = useState<Categorie[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const user = typeof window !== 'undefined' ? getUser() : null;
  const peutCreer = user?.role === 'ADMIN' || user?.role === 'REDACTEUR';

  function load() {
    api<Inventaire>('/materiel/inventaire').then(setInv).catch(() => {});
    api<Materiel[]>('/materiel').then(setList).catch(() => {});
  }
  useEffect(() => {
    load();
    api<Categorie[]>('/materiel/categories').then(setCats).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api('/materiel', {
        method: 'POST',
        body: JSON.stringify({
          reference: form.reference, numInventaire: form.numInventaire, categorieId: form.categorieId,
          marque: form.marque || undefined, modele: form.modele || undefined, numSerie: form.numSerie || undefined,
          dateAchat: form.dateAchat || undefined, fournisseur: form.fournisseur || undefined,
          coutAcquisition: form.coutAcquisition ? Number(form.coutAcquisition) : undefined,
          garantieFin: form.garantieFin || undefined, etat: form.etat,
        }),
      });
      setOpen(false); setForm(empty); load();
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Équipements & inventaire</h1>
        {peutCreer && <button onClick={() => { setForm(empty); setError(''); setOpen(true); }} className="bg-brand text-white rounded px-4 py-2 text-sm hover:bg-brand-dark">+ Nouvel équipement</button>}
      </div>
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
      {inv && inv.total > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 max-w-md">
          <h2 className="font-semibold text-sm mb-1">Répartition du parc</h2>
          <PieParcMateriel inv={inv} />
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
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
                <td className="p-3 font-mono text-xs">
                  <Link href={`/dashboard/materiel/${m.id}`} className="text-brand hover:underline">{m.reference}</Link>
                </td>
                <td className="p-3">{m.numInventaire}</td>
                <td className="p-3">{m.categorie?.nom}</td>
                <td className="p-3">{[m.marque, m.modele].filter(Boolean).join(' ')}</td>
                <td className="p-3">{m.etat}</td>
                <td className="p-3">{m.statut}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td className="p-6 text-center text-gray-400" colSpan={6}>Aucun équipement</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Nouvel équipement" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <div className="flex gap-3">
            <input required className={INPUT} placeholder="Référence interne" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            <input required className={INPUT} placeholder="N° inventaire" value={form.numInventaire} onChange={(e) => setForm({ ...form, numInventaire: e.target.value })} />
          </div>
          <select required className={INPUT} value={form.categorieId} onChange={(e) => setForm({ ...form, categorieId: e.target.value })}>
            <option value="">— Catégorie —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <div className="flex gap-3">
            <input className={INPUT} placeholder="Marque" value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} />
            <input className={INPUT} placeholder="Modèle" value={form.modele} onChange={(e) => setForm({ ...form, modele: e.target.value })} />
          </div>
          <input className={INPUT} placeholder="N° de série" value={form.numSerie} onChange={(e) => setForm({ ...form, numSerie: e.target.value })} />
          <div className="flex gap-3">
            <label className="flex-1 text-sm">Date d’achat<input type="date" className={INPUT} value={form.dateAchat} onChange={(e) => setForm({ ...form, dateAchat: e.target.value })} /></label>
            <label className="flex-1 text-sm">Fin de garantie<input type="date" className={INPUT} value={form.garantieFin} onChange={(e) => setForm({ ...form, garantieFin: e.target.value })} /></label>
          </div>
          <div className="flex gap-3">
            <input className={INPUT} placeholder="Fournisseur" value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} />
            <input type="number" min={0} className={INPUT} placeholder="Coût (GNF)" value={form.coutAcquisition} onChange={(e) => setForm({ ...form, coutAcquisition: e.target.value })} />
          </div>
          <select className={INPUT} value={form.etat} onChange={(e) => setForm({ ...form, etat: e.target.value })}>
            <option value="NEUF">Neuf</option><option value="BON_ETAT">Bon état</option>
            <option value="A_REPARER">À réparer</option><option value="HORS_SERVICE">Hors service</option>
          </select>
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 hover:bg-brand-dark disabled:opacity-50">
            {saving ? 'Création…' : 'Créer (QR généré auto)'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
