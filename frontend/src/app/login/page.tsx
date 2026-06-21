'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setSession, type AuthUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@ganndal.media');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api<{ accessToken: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(res.accessToken, res.user);
      router.replace('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="bg-white p-8 rounded-xl shadow w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand">GANNDAL</h1>
          <p className="text-sm text-gray-500">Gestion média digital</p>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
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
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          disabled={loading}
          className="w-full bg-brand text-white rounded py-2 font-medium hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  );
}
