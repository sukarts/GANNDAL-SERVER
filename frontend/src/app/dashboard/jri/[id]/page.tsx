'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, getUser } from '@/lib/api';
import { formatMoney } from '@/lib/money';

interface JriProfile { tarifParSujet: string; tarifParMinute: string; specialite: string | null; iban: string | null }
interface Sujet { id: string; reference: string; titre: string; statut: string; createdAt: string }
interface Dotation { id: string; statut: string; dateRemise: string; materiel: { reference: string } }
interface Fiche { id: string; reference: string; annee: number; mois: number; montantTotal: string; statut: string }
interface JriDetail {
  id: string; nom: string; prenom: string; email: string; telephone: string | null; role: string; actif: boolean;
  jriProfile: JriProfile | null;
  sujetsAssignes: Sujet[]; dotationsBenef: Dotation[]; fichesPaiement: Fiche[];
}

const INPUT = 'w-full border rounded px-3 py-2 text-sm';

export default function JriDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [u, setU] = useState<JriDetail | null>(null);
  const [error, setError] = useState('');
  const [tarifs, setTarifs] = useState({ tarifParSujet: '', tarifParMinute: '', specialite: '', iban: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const me = typeof window !== 'undefined' ? getUser() : null;
  const isAdmin = me?.role === 'ADMIN';

  const load = useCallback(() => {
    api<JriDetail>(`/users/${id}`).then((d) => {
      setU(d);
      setTarifs({
        tarifParSujet: d.jriProfile?.tarifParSujet ?? '',
        tarifParMinute: d.jriProfile?.tarifParMinute ?? '',
        specialite: d.jriProfile?.specialite ?? '',
        iban: d.jriProfile?.iban ?? '',
      });
    }).catch((e) => setError((e as Error).message));
  }, [id]);
  useEffect(load, [load]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!u) return <p>Chargement…</p>;

  async function saveTarifs(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await api(`/users/${id}/jri-profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          tarifParSujet: tarifs.tarifParSujet ? Number(tarifs.tarifParSujet) : 0,
          tarifParMinute: tarifs.tarifParMinute ? Number(tarifs.tarifParMinute) : 0,
          specialite: tarifs.specialite || undefined,
          iban: tarifs.iban || undefined,
        }),
      });
      setMsg('Tarifs enregistrés.'); load();
    } catch (err) { setMsg((err as Error).message); } finally { setSaving(false); }
  }

  return (
    <div>
      <Link href="/dashboard/jri" className="text-sm text-gray-500 hover:underline">← JRI</Link>
      <div className="flex items-center justify-between mt-2 mb-4">
        <h1 className="text-2xl font-bold">{u.prenom} {u.nom}</h1>
        <span className={`px-3 py-1 rounded text-sm ${u.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.actif ? 'Actif' : 'Inactif'}</span>
      </div>
      <p className="text-sm text-gray-500 mb-6">{u.email} · {u.telephone ?? '—'} · {u.role}</p>

      {/* Tarifs éditables (ADMIN) */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 max-w-xl">
        <h2 className="font-semibold mb-4">Tarifs & profil pige</h2>
        {msg && <p className="text-sm bg-gray-50 p-2 rounded mb-3">{msg}</p>}
        {isAdmin ? (
          <form onSubmit={saveTarifs} className="space-y-3">
            <div className="flex gap-3">
              <label className="flex-1 text-sm">Tarif / sujet (GNF)
                <input type="number" min={0} className={INPUT} value={tarifs.tarifParSujet} onChange={(e) => setTarifs({ ...tarifs, tarifParSujet: e.target.value })} />
              </label>
              <label className="flex-1 text-sm">Tarif / minute (GNF)
                <input type="number" min={0} className={INPUT} value={tarifs.tarifParMinute} onChange={(e) => setTarifs({ ...tarifs, tarifParMinute: e.target.value })} />
              </label>
            </div>
            <input className={INPUT} placeholder="Spécialité" value={tarifs.specialite} onChange={(e) => setTarifs({ ...tarifs, specialite: e.target.value })} />
            <input className={INPUT} placeholder="IBAN / coordonnées de paiement" value={tarifs.iban} onChange={(e) => setTarifs({ ...tarifs, iban: e.target.value })} />
            <button disabled={saving} className="bg-brand text-white rounded px-4 py-2 text-sm hover:bg-brand-dark disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Enregistrer les tarifs'}
            </button>
          </form>
        ) : (
          <div className="text-sm space-y-1">
            <div>Tarif / sujet : {formatMoney(Number(u.jriProfile?.tarifParSujet ?? 0))}</div>
            <div>Tarif / minute : {formatMoney(Number(u.jriProfile?.tarifParMinute ?? 0))}</div>
            <div>Spécialité : {u.jriProfile?.specialite ?? '—'}</div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Section title={`Sujets (${u.sujetsAssignes.length})`}>
          {u.sujetsAssignes.length === 0 ? <Empty /> : u.sujetsAssignes.map((s) => (
            <Link key={s.id} href={`/dashboard/sujets/${s.id}`} className="block border-b last:border-0 py-2 text-sm hover:bg-gray-50">
              <span className="font-mono text-xs text-brand">{s.reference}</span> — {s.titre} · <b>{s.statut}</b>
            </Link>
          ))}
        </Section>
        <Section title={`Matériel détenu`}>
          {u.dotationsBenef.filter((d) => d.statut === 'EN_COURS').length === 0 ? <Empty /> :
            u.dotationsBenef.filter((d) => d.statut === 'EN_COURS').map((d) => (
              <div key={d.id} className="border-b last:border-0 py-2 text-sm">{d.materiel.reference} · depuis {new Date(d.dateRemise).toLocaleDateString('fr-FR')}</div>
            ))}
        </Section>
        <Section title={`Piges`}>
          {u.fichesPaiement.length === 0 ? <Empty /> : u.fichesPaiement.map((f) => (
            <div key={f.id} className="border-b last:border-0 py-2 text-sm">
              {String(f.mois).padStart(2, '0')}/{f.annee} · {formatMoney(Number(f.montantTotal))} · <b>{f.statut}</b>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-semibold mb-2 text-sm">{title}</h2>
      <div className="bg-white rounded-xl shadow-sm px-4 py-1">{children}</div>
    </div>
  );
}
function Empty() { return <p className="text-gray-400 text-sm py-2">Aucun.</p>; }
