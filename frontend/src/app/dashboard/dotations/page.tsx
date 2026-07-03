'use client';
import { useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';
import Modal from '@/components/Modal';

interface Dotation {
  id: string; dateRemise: string; statut: string; etatRemise: string;
  materiel: { reference: string; categorie: { nom: string } };
  jri: { nom: string; prenom: string };
}
interface Materiel { id: string; reference: string; statut: string }
interface Jri { id: string; nom: string; prenom: string }

const INPUT = 'w-full border rounded px-3 py-2 text-sm';

export default function DotationsPage() {
  const [list, setList] = useState<Dotation[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [jris, setJris] = useState<Jri[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ materielId: '', jriId: '', etatRemise: 'BON_ETAT', observations: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const user = typeof window !== 'undefined' ? getUser() : null;
  const peutCreer = user?.role === 'ADMIN' || user?.role === 'REDACTEUR';

  function load() { api<Dotation[]>('/dotations').then(setList).catch(() => {}); }
  useEffect(load, []);

  function openForm() {
    setForm({ materielId: '', jriId: '', etatRemise: 'BON_ETAT', observations: '' });
    setError('');
    api<Materiel[]>('/materiel?statut=DISPONIBLE').then(setMateriels).catch(() => {});
    api<Jri[]>('/users?role=JRI').then(setJris).catch(() => {});
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api('/dotations', {
        method: 'POST',
        body: JSON.stringify({
          materielId: form.materielId, jriId: form.jriId,
          etatRemise: form.etatRemise, observations: form.observations || undefined,
        }),
      });
      setOpen(false); load();
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dotations</h1>
        {peutCreer && <button onClick={openForm} className="bg-brand text-white rounded px-4 py-2 text-sm hover:bg-brand-dark">+ Nouvelle dotation</button>}
      </div>
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

      <Modal open={open} title="Nouvelle dotation" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <select required className={INPUT} value={form.materielId} onChange={(e) => setForm({ ...form, materielId: e.target.value })}>
            <option value="">— Matériel disponible —</option>
            {materiels.map((m) => <option key={m.id} value={m.id}>{m.reference}</option>)}
          </select>
          {materiels.length === 0 && <p className="text-xs text-gray-400">Aucun matériel disponible.</p>}
          <select required className={INPUT} value={form.jriId} onChange={(e) => setForm({ ...form, jriId: e.target.value })}>
            <option value="">— JRI bénéficiaire —</option>
            {jris.map((j) => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
          </select>
          <label className="text-sm block">État à la remise
            <select className={INPUT} value={form.etatRemise} onChange={(e) => setForm({ ...form, etatRemise: e.target.value })}>
              <option value="NEUF">Neuf</option><option value="BON_ETAT">Bon état</option><option value="A_REPARER">À réparer</option>
            </select>
          </label>
          <textarea className={INPUT} rows={2} placeholder="Observations" value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 hover:bg-brand-dark disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Valider la remise'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
