'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, apiUpload, getUser } from '@/lib/api';

interface Element { id: string; type: string; nomFichier: string; version: number; url: string | null; tailleOctets: string; createdAt: string }
interface Validation { id: string; action: string; commentaire: string | null; createdAt: string; validateur: { nom: string; prenom: string } }
interface SujetDetail {
  id: string; reference: string; titre: string; description: string | null; statut: string;
  priorite: string; dateLimite: string | null; dureeMinutes: number;
  jri: { id: string; nom: string; prenom: string } | null;
  createur: { nom: string; prenom: string } | null;
  elements: Element[]; validations: Validation[];
}

const STATUT_COLOR: Record<string, string> = {
  ASSIGNE: 'bg-gray-100 text-gray-700', EN_COURS: 'bg-blue-100 text-blue-700',
  LIVRE: 'bg-amber-100 text-amber-700', VALIDE: 'bg-green-100 text-green-700', REJETE: 'bg-red-100 text-red-700',
};
const INPUT = 'w-full border rounded px-3 py-2 text-sm';

function taille(o: string): string {
  const n = Number(o);
  if (n > 1e9) return (n / 1e9).toFixed(1) + ' Go';
  if (n > 1e6) return (n / 1e6).toFixed(1) + ' Mo';
  if (n > 1e3) return (n / 1e3).toFixed(0) + ' Ko';
  return n + ' o';
}

export default function SujetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [s, setS] = useState<SujetDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('VIDEO');
  const user = typeof window !== 'undefined' ? getUser() : null;

  const load = useCallback(() => {
    api<SujetDetail>(`/sujets/${id}`).then(setS).catch((e) => setError((e as Error).message));
  }, [id]);
  useEffect(load, [load]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!s) return <p>Chargement…</p>;

  const estJriProprio = user?.role === 'JRI' && s.jri?.id === user.id;
  const estRedac = user?.role === 'ADMIN' || user?.role === 'REDACTEUR';

  async function changerStatut(statut: string) {
    setBusy(true);
    try { await api(`/sujets/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) }); load(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  async function valider(action: string) {
    setBusy(true);
    try {
      await api(`/sujets/${id}/validation`, { method: 'POST', body: JSON.stringify({ action, commentaire: comment || undefined }) });
      setComment(''); load();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('fichier', file);
      fd.append('type', type);
      await apiUpload(`/sujets/${id}/elements`, fd);
      setFile(null); load();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div>
      <Link href="/dashboard/sujets" className="text-sm text-gray-500 hover:underline">← Sujets</Link>
      <div className="flex items-center justify-between mt-2 mb-1">
        <h1 className="text-2xl font-bold">{s.titre}</h1>
        <span className={`px-3 py-1 rounded text-sm ${STATUT_COLOR[s.statut] ?? ''}`}>{s.statut}</span>
      </div>
      <p className="text-sm text-gray-500 mb-4 font-mono">{s.reference}</p>

      <div className="grid md:grid-cols-3 gap-4 mb-6 text-sm">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-gray-500">JRI</div><div>{s.jri ? `${s.jri.prenom} ${s.jri.nom}` : '—'}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-gray-500">Échéance</div><div>{s.dateLimite ? new Date(s.dateLimite).toLocaleDateString('fr-FR') : '—'} · {s.priorite}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-gray-500">Durée</div><div>{s.dureeMinutes} min</div>
        </div>
      </div>
      {s.description && <p className="bg-white rounded-xl p-4 shadow-sm mb-6 text-sm">{s.description}</p>}

      {/* Actions JRI */}
      {estJriProprio && s.statut !== 'VALIDE' && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <h2 className="font-semibold mb-3">Mes actions</h2>
          <div className="flex gap-2 mb-4">
            {s.statut === 'ASSIGNE' && <button disabled={busy} onClick={() => changerStatut('EN_COURS')} className="bg-blue-600 text-white rounded px-3 py-1.5 text-sm">Démarrer</button>}
            {(s.statut === 'EN_COURS' || s.statut === 'REJETE') && <button disabled={busy} onClick={() => changerStatut('LIVRE')} className="bg-amber-600 text-white rounded px-3 py-1.5 text-sm">Marquer livré</button>}
          </div>
          <form onSubmit={upload} className="flex flex-wrap items-end gap-2 border-t pt-3">
            <label className="text-sm">Type
              <select className={INPUT} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="VIDEO">Vidéo</option><option value="AUDIO">Audio</option>
                <option value="PHOTO">Photo</option><option value="DOCUMENT">Document</option>
              </select>
            </label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
            <button disabled={busy || !file} className="bg-brand text-white rounded px-4 py-2 text-sm disabled:opacity-50">
              {busy ? 'Envoi…' : 'Déposer'}
            </button>
          </form>
        </div>
      )}

      {/* Validation rédacteur */}
      {estRedac && (s.statut === 'LIVRE' || s.statut === 'EN_COURS') && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <h2 className="font-semibold mb-3">Validation</h2>
          <textarea className={INPUT} rows={2} placeholder="Commentaire" value={comment} onChange={(e) => setComment(e.target.value)} />
          <div className="flex gap-2 mt-3">
            <button disabled={busy} onClick={() => valider('VALIDE')} className="bg-green-600 text-white rounded px-3 py-1.5 text-sm">Valider</button>
            <button disabled={busy} onClick={() => valider('CORRECTION_DEMANDEE')} className="bg-amber-600 text-white rounded px-3 py-1.5 text-sm">Demander correction</button>
            <button disabled={busy} onClick={() => valider('REJETE')} className="bg-red-600 text-white rounded px-3 py-1.5 text-sm">Rejeter</button>
          </div>
        </div>
      )}

      {/* Éléments */}
      <h2 className="font-semibold mb-2">Éléments déposés</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Type</th><th className="p-3">Fichier</th><th className="p-3">Version</th><th className="p-3">Taille</th><th className="p-3"></th></tr></thead>
          <tbody>
            {s.elements.map((el) => (
              <tr key={el.id} className="border-t">
                <td className="p-3">{el.type}</td>
                <td className="p-3">{el.nomFichier}</td>
                <td className="p-3">v{el.version}</td>
                <td className="p-3">{taille(el.tailleOctets)}</td>
                <td className="p-3">{el.url && <a href={el.url} target="_blank" className="text-brand underline text-xs">Ouvrir</a>}</td>
              </tr>
            ))}
            {s.elements.length === 0 && <tr><td className="p-6 text-center text-gray-400" colSpan={5}>Aucun élément</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Historique validations */}
      <h2 className="font-semibold mb-2">Historique des validations</h2>
      <div className="bg-white rounded-xl shadow-sm p-4 text-sm space-y-2">
        {s.validations.map((v) => (
          <div key={v.id} className="border-b last:border-0 pb-2 last:pb-0">
            <span className="text-gray-400">{new Date(v.createdAt).toLocaleString('fr-FR')}</span> —{' '}
            <b>{v.validateur.prenom} {v.validateur.nom}</b> : {v.action}
            {v.commentaire && <span className="text-gray-600"> — “{v.commentaire}”</span>}
          </div>
        ))}
        {s.validations.length === 0 && <p className="text-gray-400">Aucune validation.</p>}
      </div>
    </div>
  );
}
