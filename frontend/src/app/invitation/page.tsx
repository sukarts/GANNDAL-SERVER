'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setSession, type AuthUser } from '@/lib/api';

interface Invite { email: string; prenom: string; nom: string; role: string }

export default function InvitationPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ mdp: '', confirme: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') ?? '';
    setToken(t);
    if (!t) { setError('Lien invalide.'); setLoading(false); return; }
    api<Invite>(`/auth/invitation/${t}`)
      .then(setInvite)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.mdp.length < 6) { setError('Mot de passe : 6 caractères minimum.'); return; }
    if (form.mdp !== form.confirme) { setError('La confirmation ne correspond pas.'); return; }
    setSaving(true);
    try {
      const res = await api<{ accessToken: string; user: AuthUser }>('/auth/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({ token, motDePasse: form.mdp }),
      });
      setSession(res.accessToken, res.user);
      router.replace('/dashboard');
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-brand">GANNDAL</h1>
          <p className="text-sm text-gray-500">Activation de votre compte</p>
        </div>

        {loading && <p className="text-sm text-gray-500 text-center">Vérification…</p>}
        {!loading && error && !invite && <p className="text-sm text-red-600 bg-red-50 p-3 rounded text-center">{error}</p>}

        {invite && (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm text-gray-600">
              Bonjour <b>{invite.prenom} {invite.nom}</b> ({invite.email}) — rôle <b>{invite.role}</b>.
              Choisissez votre mot de passe.
            </p>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <input type="password" className="w-full border rounded px-3 py-2" placeholder="Mot de passe (min 6)" value={form.mdp} onChange={(e) => setForm({ ...form, mdp: e.target.value })} />
            <input type="password" className="w-full border rounded px-3 py-2" placeholder="Confirmer" value={form.confirme} onChange={(e) => setForm({ ...form, confirme: e.target.value })} />
            <button disabled={saving} className="w-full bg-brand text-white rounded py-2 font-medium hover:bg-brand-dark disabled:opacity-50">
              {saving ? 'Activation…' : 'Activer mon compte'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
