'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, apiPaged, getUser } from '@/lib/api';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';

interface Sujet {
  id: string;
  reference: string;
  titre: string;
  statut: string;
  priorite: string;
  dateLimite: string | null;
  jri: { nom: string; prenom: string } | null;
}
interface Jri { id: string; nom: string; prenom: string }

const STATUT_COLOR: Record<string, string> = {
  ASSIGNE: 'bg-gray-100 text-gray-700',
  EN_COURS: 'bg-blue-100 text-blue-700',
  LIVRE: 'bg-amber-100 text-amber-700',
  VALIDE: 'bg-green-100 text-green-700',
  REJETE: 'bg-red-100 text-red-700',
};

const INPUT = 'w-full border rounded px-3 py-2 text-sm';
const LIMIT = 25;

export default function SujetsPage() {
  const [sujets, setSujets] = useState<Sujet[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [jris, setJris] = useState<Jri[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titre: '', description: '', jriId: '', dateLimite: '', priorite: 'NORMALE', dureeMinutes: '' });
  const user = typeof window !== 'undefined' ? getUser() : null;
  const peutCreer = user?.role === 'ADMIN' || user?.role === 'REDACTEUR';

  function load() {
    apiPaged<Sujet>('/sujets', page, LIMIT)
      .then((r) => { setSujets(r.items); setTotal(r.total); })
      .catch((e) => setError((e as Error).message));
  }
  useEffect(load, [page]);

  function openForm() {
    setError('');
    setForm({ titre: '', description: '', jriId: '', dateLimite: '', priorite: 'NORMALE', dureeMinutes: '' });
    api<Jri[]>('/users?role=JRI').then(setJris).catch(() => {});
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api('/sujets', {
        method: 'POST',
        body: JSON.stringify({
          titre: form.titre,
          description: form.description || undefined,
          jriId: form.jriId || undefined,
          dateLimite: form.dateLimite || undefined,
          priorite: form.priorite,
          dureeMinutes: form.dureeMinutes ? Number(form.dureeMinutes) : undefined,
        }),
      });
      setOpen(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sujets</h1>
        {peutCreer && (
          <button onClick={openForm} className="bg-brand text-white rounded px-4 py-2 text-sm hover:bg-brand-dark">
            + Nouveau sujet
          </button>
        )}
      </div>
      {error && !open && <p className="text-red-600 mb-3">{error}</p>}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Référence</th><th className="p-3">Titre</th><th className="p-3">JRI</th>
              <th className="p-3">Priorité</th><th className="p-3">Échéance</th><th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {sujets.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-mono text-xs">
                  <Link href={`/dashboard/sujets/${s.id}`} className="text-brand hover:underline">{s.reference}</Link>
                </td>
                <td className="p-3">{s.titre}</td>
                <td className="p-3">{s.jri ? `${s.jri.prenom} ${s.jri.nom}` : '—'}</td>
                <td className="p-3">{s.priorite}</td>
                <td className="p-3">{s.dateLimite ? new Date(s.dateLimite).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${STATUT_COLOR[s.statut] ?? ''}`}>{s.statut}</span></td>
              </tr>
            ))}
            {sujets.length === 0 && <tr><td className="p-6 text-center text-gray-400" colSpan={6}>Aucun sujet</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
      </div>

      <Modal open={open} title="Nouveau sujet" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <input required className={INPUT} placeholder="Titre" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
          <textarea className={INPUT} placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className={INPUT} value={form.jriId} onChange={(e) => setForm({ ...form, jriId: e.target.value })}>
            <option value="">— Attribuer à un JRI (optionnel) —</option>
            {jris.map((j) => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
          </select>
          <div className="flex gap-3">
            <label className="flex-1 text-sm">Échéance
              <input type="date" className={INPUT} value={form.dateLimite} onChange={(e) => setForm({ ...form, dateLimite: e.target.value })} />
            </label>
            <label className="flex-1 text-sm">Durée (min)
              <input type="number" min={0} className={INPUT} value={form.dureeMinutes} onChange={(e) => setForm({ ...form, dureeMinutes: e.target.value })} />
            </label>
          </div>
          <select className={INPUT} value={form.priorite} onChange={(e) => setForm({ ...form, priorite: e.target.value })}>
            <option value="BASSE">Basse</option><option value="NORMALE">Normale</option>
            <option value="HAUTE">Haute</option><option value="URGENTE">Urgente</option>
          </select>
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 hover:bg-brand-dark disabled:opacity-50">
            {saving ? 'Création…' : 'Créer le sujet'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
