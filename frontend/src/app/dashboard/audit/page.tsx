'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import EmptyState from '@/components/EmptyState';

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
      <div className="bg-surface rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-muted"><tr><th className="p-3">Date</th><th className="p-3">Utilisateur</th><th className="p-3">Action</th><th className="p-3">Entité</th><th className="p-3">ID</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-3">{new Date(l.createdAt).toLocaleString('fr-FR')}</td>
                <td className="p-3">{l.user ? `${l.user.prenom} ${l.user.nom}` : 'Système'}</td>
                <td className="p-3"><span className="px-2 py-1 bg-surface-2 border border-line rounded text-xs">{l.action}</span></td>
                <td className="p-3">{l.entite}</td>
                <td className="p-3 font-mono text-xs">{l.entiteId ?? '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5}>
                <EmptyState title={'Aucun log'} hint={'Les actions sensibles seront journalisées ici.'} />
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
