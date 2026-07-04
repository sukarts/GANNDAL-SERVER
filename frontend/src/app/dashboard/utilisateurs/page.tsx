'use client';
import { useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';
import Modal from '@/components/Modal';

interface User {
  id: string; email: string; nom: string; prenom: string; telephone: string | null;
  role: string; actif: boolean;
}

const INPUT = 'w-full border rounded px-3 py-2 text-sm';
const ROLES = ['ADMIN', 'REDACTEUR', 'JRI', 'COMPTABLE'] as const;
const emptyCreate = { email: '', password: '', nom: '', prenom: '', telephone: '', role: 'REDACTEUR' };

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700', REDACTEUR: 'bg-blue-100 text-blue-700',
  JRI: 'bg-green-100 text-green-700', COMPTABLE: 'bg-amber-100 text-amber-700',
};

export default function UtilisateursPage() {
  const [list, setList] = useState<User[]>([]);
  const [filtre, setFiltre] = useState('');
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: '', nom: '', prenom: '', telephone: '', role: 'REDACTEUR' });
  const [lienInvit, setLienInvit] = useState('');
  const [edit, setEdit] = useState<User | null>(null);
  const [form, setForm] = useState(emptyCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const r = await api<{ lien: string }>('/users/invite', { method: 'POST', body: JSON.stringify({ ...invite, telephone: invite.telephone || undefined }) });
      setInviteOpen(false); setInvite({ email: '', nom: '', prenom: '', telephone: '', role: 'REDACTEUR' }); load();
      setLienInvit(r.lien); // affiché pour partage manuel
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }
  const me = typeof window !== 'undefined' ? getUser() : null;

  function load() { api<User[]>('/users').then(setList).catch((e) => setError((e as Error).message)); }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api('/users', { method: 'POST', body: JSON.stringify({ ...form, telephone: form.telephone || undefined }) });
      setOpen(false); setForm(emptyCreate); load();
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setSaving(true); setError('');
    try {
      await api(`/users/${edit.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ nom: edit.nom, prenom: edit.prenom, email: edit.email, telephone: edit.telephone || undefined, role: edit.role }),
      });
      setEdit(null); load();
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }

  async function toggle(u: User) {
    await api(`/users/${u.id}/toggle-actif`, { method: 'PATCH' }).catch(() => {});
    load();
  }

  async function resetPwd(u: User) {
    const p = prompt(`Nouveau mot de passe pour ${u.prenom} ${u.nom} (min 6) :`);
    if (!p) return;
    try { await api(`/users/${u.id}/reset-password`, { method: 'POST', body: JSON.stringify({ nouveauMotDePasse: p }) }); alert('Mot de passe réinitialisé.'); }
    catch (e) { alert((e as Error).message); }
  }

  const visibles = filtre ? list.filter((u) => u.role === filtre) : list;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <div className="flex items-center gap-2">
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="">Tous les rôles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={() => { setError(''); setInviteOpen(true); }} className="border rounded px-3 py-2 text-sm hover:bg-gray-50">Inviter par email</button>
          <button onClick={() => { setForm(emptyCreate); setError(''); setOpen(true); }} className="bg-brand text-white rounded px-4 py-2 text-sm hover:bg-brand-dark">+ Nouvel utilisateur</button>
        </div>
      </div>
      {error && !open && !edit && <p className="text-red-600 mb-3">{error}</p>}

      {lienInvit && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-green-800">Invitation créée — lien d’activation (valable 7 j)</span>
            <button onClick={() => setLienInvit('')} className="text-green-700 text-xs underline">Fermer</button>
          </div>
          <div className="flex gap-2">
            <input readOnly value={lienInvit} className="flex-1 border rounded px-2 py-1 text-xs bg-white" onFocus={(e) => e.target.select()} />
            <button onClick={() => { navigator.clipboard.writeText(lienInvit); }} className="bg-brand text-white rounded px-3 py-1 text-xs">Copier</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Un email a aussi été tenté. Si l’utilisateur ne le reçoit pas, envoyez-lui ce lien (WhatsApp, etc.).</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Nom</th><th className="p-3">Email</th><th className="p-3">Téléphone</th><th className="p-3">Rôle</th><th className="p-3">Actif</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {visibles.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.prenom} {u.nom}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.telephone ?? '—'}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${ROLE_BADGE[u.role] ?? ''}`}>{u.role}</span></td>
                <td className="p-3">
                  <button onClick={() => toggle(u)} disabled={u.id === me?.id} className="text-xs underline disabled:opacity-40">{u.actif ? '✅ actif' : '❌ inactif'}</button>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => { setError(''); setEdit(u); }} className="text-xs underline mr-3">Éditer</button>
                  <button onClick={() => resetPwd(u)} className="text-xs underline text-gray-500">Reset MDP</button>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && <tr><td className="p-6 text-center text-gray-400" colSpan={6}>Aucun utilisateur</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Nouvel utilisateur" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <div className="flex gap-3">
            <input required className={INPUT} placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            <input required className={INPUT} placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </div>
          <input required type="email" className={INPUT} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="password" className={INPUT} placeholder="Mot de passe (min 6)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input className={INPUT} placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          <select className={INPUT} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <p className="text-xs text-gray-400">Pour un JRI, les tarifs se règlent ensuite sur sa fiche.</p>
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 disabled:opacity-50">{saving ? 'Création…' : 'Créer'}</button>
        </form>
      </Modal>

      <Modal open={inviteOpen} title="Inviter par email" onClose={() => setInviteOpen(false)}>
        <form onSubmit={sendInvite} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <div className="flex gap-3">
            <input required className={INPUT} placeholder="Prénom" value={invite.prenom} onChange={(e) => setInvite({ ...invite, prenom: e.target.value })} />
            <input required className={INPUT} placeholder="Nom" value={invite.nom} onChange={(e) => setInvite({ ...invite, nom: e.target.value })} />
          </div>
          <input required type="email" className={INPUT} placeholder="Email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
          <input className={INPUT} placeholder="Téléphone" value={invite.telephone} onChange={(e) => setInvite({ ...invite, telephone: e.target.value })} />
          <select className={INPUT} value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <p className="text-xs text-gray-400">L'utilisateur reçoit un lien pour définir son mot de passe (valable 7 jours).</p>
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 disabled:opacity-50">{saving ? 'Envoi…' : 'Envoyer l\'invitation'}</button>
        </form>
      </Modal>

      <Modal open={!!edit} title="Éditer l'utilisateur" onClose={() => setEdit(null)}>
        {edit && (
          <form onSubmit={saveEdit} className="space-y-3">
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <div className="flex gap-3">
              <input required className={INPUT} placeholder="Prénom" value={edit.prenom} onChange={(e) => setEdit({ ...edit, prenom: e.target.value })} />
              <input required className={INPUT} placeholder="Nom" value={edit.nom} onChange={(e) => setEdit({ ...edit, nom: e.target.value })} />
            </div>
            <input required type="email" className={INPUT} value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            <input className={INPUT} placeholder="Téléphone" value={edit.telephone ?? ''} onChange={(e) => setEdit({ ...edit, telephone: e.target.value })} />
            <select className={INPUT} value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })} disabled={edit.id === me?.id}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button disabled={saving} className="w-full bg-brand text-white rounded py-2 disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
