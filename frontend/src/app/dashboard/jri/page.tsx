'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getUser } from '@/lib/api';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

interface Jri {
  id: string; nom: string; prenom: string; email: string; actif: boolean;
  jriProfile: { tarifParSujet: string; tarifParMinute: string; specialite: string | null } | null;
}

const INPUT = 'w-full border rounded px-3 py-2 text-sm';
const empty = { email: '', password: '', nom: '', prenom: '', telephone: '', specialite: '', tarifParSujet: '', tarifParMinute: '' };

export default function JriPage() {
  const [list, setList] = useState<Jri[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const user = typeof window !== 'undefined' ? getUser() : null;
  const isAdmin = user?.role === 'ADMIN';

  function load() { api<Jri[]>('/users?role=JRI').then(setList).catch(() => {}); }
  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email, password: form.password, nom: form.nom, prenom: form.prenom,
          telephone: form.telephone || undefined, role: 'JRI',
          specialite: form.specialite || undefined,
          tarifParSujet: form.tarifParSujet ? Number(form.tarifParSujet) : undefined,
          tarifParMinute: form.tarifParMinute ? Number(form.tarifParMinute) : undefined,
        }),
      });
      setOpen(false); setForm(empty); load();
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }

  async function toggle(id: string) {
    await api(`/users/${id}/toggle-actif`, { method: 'PATCH' }).catch(() => {});
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">JRI / Pigistes</h1>
        {isAdmin && <button onClick={() => { setForm(empty); setError(''); setOpen(true); }} className="bg-brand text-white rounded-lg font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 px-4 py-2 text-sm hover:bg-brand-dark">+ Nouveau JRI</button>}
      </div>
      <div className="bg-surface rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-muted">
            <tr><th className="p-3">Nom</th><th className="p-3">Email</th><th className="p-3">Spécialité</th><th className="p-3">Tarif/sujet</th><th className="p-3">Tarif/min</th><th className="p-3">Actif</th></tr>
          </thead>
          <tbody>
            {list.map((j) => (
              <tr key={j.id} className="border-t">
                <td className="p-3">
                  <Link href={`/dashboard/jri/${j.id}`} className="text-brand hover:underline">{j.prenom} {j.nom}</Link>
                </td>
                <td className="p-3">{j.email}</td>
                <td className="p-3">{j.jriProfile?.specialite ?? '—'}</td>
                <td className="p-3">{j.jriProfile?.tarifParSujet ?? '—'}</td>
                <td className="p-3">{j.jriProfile?.tarifParMinute ?? '—'}</td>
                <td className="p-3">
                  {isAdmin
                    ? <button onClick={() => toggle(j.id)} className="text-xs underline">{j.actif ? '✅ actif' : '❌ inactif'}</button>
                    : (j.actif ? '✅' : '❌')}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6}>
                <EmptyState title={'Aucun JRI'} hint={'Invitez un JRI pour le voir apparaître ici.'} />
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Nouveau JRI" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          {error && <p className="text-sm text-danger bg-red-50 dark:bg-red-950/40 p-2 rounded">{error}</p>}
          <div className="flex gap-3">
            <input required className={INPUT} placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            <input required className={INPUT} placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </div>
          <input required type="email" className={INPUT} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="password" className={INPUT} placeholder="Mot de passe (min 6)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input className={INPUT} placeholder="Téléphone (WhatsApp)" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          <input className={INPUT} placeholder="Spécialité" value={form.specialite} onChange={(e) => setForm({ ...form, specialite: e.target.value })} />
          <div className="flex gap-3">
            <label className="flex-1 text-sm">Tarif / sujet (GNF)
              <input type="number" min={0} className={INPUT} value={form.tarifParSujet} onChange={(e) => setForm({ ...form, tarifParSujet: e.target.value })} />
            </label>
            <label className="flex-1 text-sm">Tarif / minute (GNF)
              <input type="number" min={0} className={INPUT} value={form.tarifParMinute} onChange={(e) => setForm({ ...form, tarifParMinute: e.target.value })} />
            </label>
          </div>
          <button disabled={saving} className="w-full bg-brand text-white rounded-lg font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 py-2 hover:bg-brand-dark disabled:opacity-50">
            {saving ? 'Création…' : 'Créer le JRI'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
