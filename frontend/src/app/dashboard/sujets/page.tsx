'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, apiPaged, getUser } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import { SkeletonRows } from '@/components/Skeleton';

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
  ASSIGNE: 'bg-surface-2 text-content',
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
  const [chargement, setChargement] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [jris, setJris] = useState<Jri[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titre: '', description: '', rubrique: '', jriId: '', dateLimite: '', priorite: 'NORMALE', dureeMinutes: '' });
  const { t } = useLang();
  const user = typeof window !== 'undefined' ? getUser() : null;
  const peutCreer = user?.role === 'ADMIN' || user?.role === 'REDACTEUR';

  function load() {
    setChargement(true);
    apiPaged<Sujet>('/sujets', page, LIMIT)
      .then((r) => { setSujets(r.items); setTotal(r.total); })
      .catch((e) => setError((e as Error).message))
      .finally(() => setChargement(false));
  }
  useEffect(load, [page]);

  function openForm() {
    setError('');
    setForm({ titre: '', description: '', rubrique: '', jriId: '', dateLimite: '', priorite: 'NORMALE', dureeMinutes: '' });
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
          rubrique: form.rubrique || undefined,
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
        <h1 className="text-2xl font-bold">{t('Sujets', 'Assignments')}</h1>
        {peutCreer && (
          <button onClick={openForm} className="bg-brand text-white rounded-lg font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 px-4 py-2 text-sm hover:bg-brand-dark">
            {t('+ Nouveau sujet', '+ New assignment')}
          </button>
        )}
      </div>
      {error && !open && <p className="text-red-600 mb-3">{error}</p>}
      <div className="bg-surface rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-muted">
            <tr>
              <th className="p-3">{t('Référence', 'Reference')}</th><th className="p-3">{t('Titre', 'Title')}</th><th className="p-3">{t('JRI', 'Contributor')}</th>
              <th className="p-3">{t('Priorité', 'Priority')}</th><th className="p-3">{t('Échéance', 'Deadline')}</th><th className="p-3">{t('Statut', 'Status')}</th>
            </tr>
          </thead>
          {chargement ? <SkeletonRows rows={5} cols={6} /> : (
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
            {sujets.length === 0 && (
              <tr><td colSpan={6}>
                <EmptyState title={t('Aucun sujet', 'No assignments')} hint={t('Créez un sujet et assignez-le à un JRI.', 'Create an assignment and assign it to a contributor.')} />
              </td></tr>
            )}
          </tbody>
          )}
        </table>
        <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
      </div>

      <Modal open={open} title="Nouveau sujet" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          {error && <p className="text-sm text-danger bg-red-50 dark:bg-red-950/40 p-2 rounded">{error}</p>}
          <input required className={INPUT} placeholder="Titre" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
          <textarea className={INPUT} placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className={INPUT} placeholder="Rubrique (Politique, Sport, Éco…)" value={form.rubrique} onChange={(e) => setForm({ ...form, rubrique: e.target.value })} />
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
          <button disabled={saving} className="w-full bg-brand text-white rounded-lg font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 py-2 hover:bg-brand-dark disabled:opacity-50">
            {saving ? 'Création…' : 'Créer le sujet'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
