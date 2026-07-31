'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setSession, type AuthUser } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import LangSelector from '@/components/LangSelector';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api<{ accessToken: string; refreshToken: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(res.accessToken, res.user, res.refreshToken);
      router.replace('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="bg-surface p-8 rounded-xl shadow w-full max-w-sm space-y-4">
        <div className="flex justify-end"><LangSelector /></div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand">GANNDAL</h1>
          <p className="text-sm text-muted">{t('Gestion média digital', 'Digital media management')}</p>
        </div>
        {error && <p className="text-sm text-danger bg-red-50 dark:bg-red-950/40 p-2 rounded">{error}</p>}
        <input
          className="w-full border rounded px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded px-3 py-2"
          type="password"
          placeholder={t('Mot de passe', 'Password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          disabled={loading}
          className="w-full bg-brand text-white rounded py-2 font-medium hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? t('Connexion…', 'Signing in…') : t('Se connecter', 'Sign in')}
        </button>
      </form>
    </main>
  );
}
