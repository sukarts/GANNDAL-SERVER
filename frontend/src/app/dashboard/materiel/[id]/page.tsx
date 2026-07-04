'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, getUser } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import Modal from '@/components/Modal';

interface Dotation { id: string; dateRemise: string; statut: string; etatRemise: string; jri: { nom: string; prenom: string } }
interface Maintenance { id: string; datePanne: string; description: string; prestataire: string | null; cout: string; dateRemiseEnService: string | null }
interface Incident { id: string; type: string; description: string; createdAt: string }
interface Materiel {
  id: string; reference: string; numInventaire: string; marque: string | null; modele: string | null;
  numSerie: string | null; dateAchat: string | null; fournisseur: string | null; coutAcquisition: string;
  garantieFin: string | null; etat: string; statut: string; qrCodeUrl: string | null;
  categorie: { nom: string }; dotations: Dotation[]; maintenances: Maintenance[]; incidents: Incident[];
}

const INPUT = 'w-full border rounded px-3 py-2 text-sm';

export default function MaterielDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [m, setM] = useState<Materiel | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const [incOpen, setIncOpen] = useState(false);
  const [maint, setMaint] = useState({ datePanne: '', description: '', prestataire: '', cout: '', dateRemiseEnService: '' });
  const [inc, setInc] = useState({ type: 'PANNE', description: '' });
  const user = typeof window !== 'undefined' ? getUser() : null;
  const peutGerer = user?.role === 'ADMIN' || user?.role === 'REDACTEUR';

  const load = useCallback(() => {
    api<Materiel>(`/materiel/${id}`).then(setM).catch((e) => setError((e as Error).message));
  }, [id]);
  useEffect(load, [load]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!m) return <p>Chargement…</p>;

  async function submitMaint(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api(`/materiel/${id}/maintenance`, {
        method: 'POST',
        body: JSON.stringify({
          datePanne: maint.datePanne, description: maint.description,
          prestataire: maint.prestataire || undefined,
          cout: maint.cout ? Number(maint.cout) : undefined,
          dateRemiseEnService: maint.dateRemiseEnService || undefined,
        }),
      });
      setMaintOpen(false); setMaint({ datePanne: '', description: '', prestataire: '', cout: '', dateRemiseEnService: '' }); load();
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  }

  async function submitInc(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api(`/materiel/${id}/incident`, { method: 'POST', body: JSON.stringify(inc) });
      setIncOpen(false); setInc({ type: 'PANNE', description: '' }); load();
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  }

  return (
    <div>
      <Link href="/dashboard/materiel" className="text-sm text-gray-500 hover:underline">← Équipements</Link>
      <div className="flex items-center justify-between mt-2 mb-1">
        <h1 className="text-2xl font-bold">{m.reference} — {[m.marque, m.modele].filter(Boolean).join(' ') || m.categorie.nom}</h1>
        <span className="px-3 py-1 rounded text-sm bg-gray-100">{m.statut}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm md:col-span-2 text-sm space-y-1">
          <div><span className="text-gray-500">N° inventaire :</span> {m.numInventaire}</div>
          <div><span className="text-gray-500">Catégorie :</span> {m.categorie.nom}</div>
          <div><span className="text-gray-500">N° série :</span> {m.numSerie ?? '—'}</div>
          <div><span className="text-gray-500">Achat :</span> {m.dateAchat ? new Date(m.dateAchat).toLocaleDateString('fr-FR') : '—'} · {m.fournisseur ?? '—'}</div>
          <div><span className="text-gray-500">Garantie jusqu’au :</span> {m.garantieFin ? new Date(m.garantieFin).toLocaleDateString('fr-FR') : '—'}</div>
          <div><span className="text-gray-500">Coût :</span> {formatMoney(Number(m.coutAcquisition))}</div>
          <div><span className="text-gray-500">État :</span> {m.etat}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center justify-center">
          <div className="text-xs text-gray-500 mb-2">QR Code</div>
          {m.qrCodeUrl
            ? <img src={m.qrCodeUrl} alt="QR" className="w-32 h-32" />
            : <div className="w-32 h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">—</div>}
        </div>
      </div>

      {peutGerer && (
        <div className="flex gap-2 mb-6">
          <button onClick={() => { setError(''); setMaintOpen(true); }} className="bg-brand text-white rounded px-3 py-1.5 text-sm">+ Ticket maintenance</button>
          <button onClick={() => { setError(''); setIncOpen(true); }} className="border rounded px-3 py-1.5 text-sm">Déclarer un incident</button>
        </div>
      )}

      <Section title="Maintenance">
        {m.maintenances.length === 0 ? <Empty /> : m.maintenances.map((t) => (
          <div key={t.id} className="border-b last:border-0 py-2 text-sm">
            <b>{new Date(t.datePanne).toLocaleDateString('fr-FR')}</b> — {t.description}
            {t.prestataire && <> · {t.prestataire}</>} · {formatMoney(Number(t.cout))}
            {t.dateRemiseEnService ? <span className="text-green-700"> · remis en service le {new Date(t.dateRemiseEnService).toLocaleDateString('fr-FR')}</span> : <span className="text-amber-700"> · en cours</span>}
          </div>
        ))}
      </Section>

      <Section title="Incidents">
        {m.incidents.length === 0 ? <Empty /> : m.incidents.map((i) => (
          <div key={i.id} className="border-b last:border-0 py-2 text-sm">
            <span className="text-gray-400">{new Date(i.createdAt).toLocaleDateString('fr-FR')}</span> — <b>{i.type}</b> : {i.description}
          </div>
        ))}
      </Section>

      <Section title="Historique des dotations">
        {m.dotations.length === 0 ? <Empty /> : m.dotations.map((d) => (
          <div key={d.id} className="border-b last:border-0 py-2 text-sm">
            {new Date(d.dateRemise).toLocaleDateString('fr-FR')} — {d.jri.prenom} {d.jri.nom} · {d.etatRemise} · <b>{d.statut}</b>
          </div>
        ))}
      </Section>

      <Modal open={maintOpen} title="Ticket de maintenance" onClose={() => setMaintOpen(false)}>
        <form onSubmit={submitMaint} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <label className="text-sm block">Date de panne<input required type="date" className={INPUT} value={maint.datePanne} onChange={(e) => setMaint({ ...maint, datePanne: e.target.value })} /></label>
          <textarea required className={INPUT} rows={2} placeholder="Description" value={maint.description} onChange={(e) => setMaint({ ...maint, description: e.target.value })} />
          <div className="flex gap-3">
            <input className={INPUT} placeholder="Prestataire" value={maint.prestataire} onChange={(e) => setMaint({ ...maint, prestataire: e.target.value })} />
            <input type="number" min={0} className={INPUT} placeholder="Coût (GNF)" value={maint.cout} onChange={(e) => setMaint({ ...maint, cout: e.target.value })} />
          </div>
          <label className="text-sm block">Remise en service (si résolu)<input type="date" className={INPUT} value={maint.dateRemiseEnService} onChange={(e) => setMaint({ ...maint, dateRemiseEnService: e.target.value })} /></label>
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 disabled:opacity-50">{saving ? 'Enregistrement…' : 'Créer le ticket'}</button>
        </form>
      </Modal>

      <Modal open={incOpen} title="Déclarer un incident" onClose={() => setIncOpen(false)}>
        <form onSubmit={submitInc} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <select className={INPUT} value={inc.type} onChange={(e) => setInc({ ...inc, type: e.target.value })}>
            <option value="PANNE">Panne</option><option value="PERTE">Perte</option>
            <option value="VOL">Vol</option><option value="DEGRADATION">Dégradation</option>
          </select>
          <textarea required className={INPUT} rows={3} placeholder="Description" value={inc.description} onChange={(e) => setInc({ ...inc, description: e.target.value })} />
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 disabled:opacity-50">{saving ? 'Enregistrement…' : 'Déclarer'}</button>
        </form>
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="font-semibold mb-2">{title}</h2>
      <div className="bg-white rounded-xl shadow-sm px-4 py-1">{children}</div>
    </div>
  );
}
function Empty() { return <p className="text-gray-400 text-sm py-2">Aucun.</p>; }
