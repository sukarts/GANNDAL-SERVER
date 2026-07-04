'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearSession, getUser } from '@/lib/api';

const INPUT = 'w-full border rounded px-3 py-2 text-sm';

export default function ComptePage() {
  const router = useRouter();
  const user = typeof window !== 'undefined' ? getUser() : null;
  const [form, setForm] = useState({ ancien: '', nouveau: '', confirme: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMsg('');
    if (form.nouveau.length < 6) { setError('Nouveau mot de passe : 6 caractères minimum.'); return; }
    if (form.nouveau !== form.confirme) { setError('La confirmation ne correspond pas.'); return; }
    setSaving(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ ancienMotDePasse: form.ancien, nouveauMotDePasse: form.nouveau }),
      });
      setMsg('Mot de passe changé. Reconnexion nécessaire…');
      setTimeout(() => { clearSession(); router.replace('/login'); }, 1500);
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-1">Mon compte</h1>
      <p className="text-sm text-gray-500 mb-6">{user?.prenom} {user?.nom} · {user?.email} · {user?.role}</p>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold mb-4">Changer le mot de passe</h2>
        {msg && <p className="text-sm text-green-700 bg-green-50 p-2 rounded mb-3">{msg}</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-3">{error}</p>}
        <form onSubmit={submit} className="space-y-3">
          <input required type="password" className={INPUT} placeholder="Mot de passe actuel" value={form.ancien} onChange={(e) => setForm({ ...form, ancien: e.target.value })} />
          <input required type="password" className={INPUT} placeholder="Nouveau mot de passe" value={form.nouveau} onChange={(e) => setForm({ ...form, nouveau: e.target.value })} />
          <input required type="password" className={INPUT} placeholder="Confirmer le nouveau" value={form.confirme} onChange={(e) => setForm({ ...form, confirme: e.target.value })} />
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 hover:bg-brand-dark disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
