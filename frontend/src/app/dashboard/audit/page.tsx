'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Log {
  id: string; action: string; entite: string; entiteId: string | null; createdAt: string;
  user: { nom: string; prenom: string; role: string } | null;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  useEffect(() => { api<{ logs: Log[] }>('/audit').then((d) => setLogs(d.logs)).catch(() => {}); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Journal d&apos;audit</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Date</th><th className="p-3">Utilisateur</th><th className="p-3">Action</th><th className="p-3">Entité</th><th className="p-3">ID</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-3">{new Date(l.createdAt).toLocaleString('fr-FR')}</td>
                <td className="p-3">{l.user ? `${l.user.prenom} ${l.user.nom}` : 'Système'}</td>
                <td className="p-3"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{l.action}</span></td>
                <td className="p-3">{l.entite}</td>
                <td className="p-3 font-mono text-xs">{l.entiteId ?? '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td className="p-6 text-center text-gray-400" colSpan={5}>Aucun log</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
