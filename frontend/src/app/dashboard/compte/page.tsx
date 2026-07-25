'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearSession, getUser, updateStoredUser, type AuthUser } from '@/lib/api';
import { useLang } from '@/lib/i18n';

const INPUT = 'w-full border rounded px-3 py-2 text-sm';

export default function ComptePage() {
  const router = useRouter();
  const { t } = useLang();
  const user = typeof window !== 'undefined' ? getUser() : null;
  const [profil, setProfil] = useState({ prenom: user?.prenom ?? '', nom: user?.nom ?? '', telephone: '' });
  const [profilMsg, setProfilMsg] = useState('');
  const [savingProfil, setSavingProfil] = useState(false);
  const [form, setForm] = useState({ ancien: '', nouveau: '', confirme: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveProfil(e: React.FormEvent) {
    e.preventDefault();
    setProfilMsg(''); setSavingProfil(true);
    try {
      const u = await api<AuthUser>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ prenom: profil.prenom, nom: profil.nom, telephone: profil.telephone || undefined }),
      });
      updateStoredUser({ prenom: u.prenom, nom: u.nom });
      setProfilMsg(t('Profil mis à jour.', 'Profile updated.'));
    } catch (err) { setProfilMsg((err as Error).message); } finally { setSavingProfil(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMsg('');
    if (form.nouveau.length < 6) { setError(t('Nouveau mot de passe : 6 caractères minimum.', 'New password: 6 characters minimum.')); return; }
    if (form.nouveau !== form.confirme) { setError(t('La confirmation ne correspond pas.', 'Confirmation does not match.')); return; }
    setSaving(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ ancienMotDePasse: form.ancien, nouveauMotDePasse: form.nouveau }),
      });
      setMsg(t('Mot de passe changé. Reconnexion nécessaire…', 'Password changed. Please sign in again…'));
      setTimeout(() => { clearSession(); router.replace('/login'); }, 1500);
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-1">{t('Mon compte', 'My account')}</h1>
      <p className="text-sm text-gray-500 mb-6">{user?.email} · {user?.role}</p>

      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-semibold mb-4">{t('Profil', 'Profile')}</h2>
        {profilMsg && <p className="text-sm bg-gray-50 p-2 rounded mb-3">{profilMsg}</p>}
        <form onSubmit={saveProfil} className="space-y-3">
          <div className="flex gap-3">
            <input required className={INPUT} placeholder={t('Prénom', 'First name')} value={profil.prenom} onChange={(e) => setProfil({ ...profil, prenom: e.target.value })} />
            <input required className={INPUT} placeholder={t('Nom', 'Last name')} value={profil.nom} onChange={(e) => setProfil({ ...profil, nom: e.target.value })} />
          </div>
          <input className={INPUT} placeholder={t('Téléphone (WhatsApp)', 'Phone (WhatsApp)')} value={profil.telephone} onChange={(e) => setProfil({ ...profil, telephone: e.target.value })} />
          <button disabled={savingProfil} className="bg-brand text-white rounded px-4 py-2 text-sm hover:bg-brand-dark disabled:opacity-50">
            {savingProfil ? t('Enregistrement…', 'Saving…') : t('Enregistrer le profil', 'Save profile')}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold mb-4">{t('Changer le mot de passe', 'Change password')}</h2>
        {msg && <p className="text-sm text-green-700 bg-green-50 p-2 rounded mb-3">{msg}</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-3">{error}</p>}
        <form onSubmit={submit} className="space-y-3">
          <input required type="password" className={INPUT} placeholder={t('Mot de passe actuel', 'Current password')} value={form.ancien} onChange={(e) => setForm({ ...form, ancien: e.target.value })} />
          <input required type="password" className={INPUT} placeholder={t('Nouveau mot de passe', 'New password')} value={form.nouveau} onChange={(e) => setForm({ ...form, nouveau: e.target.value })} />
          <input required type="password" className={INPUT} placeholder={t('Confirmer le nouveau', 'Confirm new password')} value={form.confirme} onChange={(e) => setForm({ ...form, confirme: e.target.value })} />
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 hover:bg-brand-dark disabled:opacity-50">
            {saving ? t('Enregistrement…', 'Saving…') : t('Changer le mot de passe', 'Change password')}
          </button>
        </form>
      </div>
    </div>
  );
}
