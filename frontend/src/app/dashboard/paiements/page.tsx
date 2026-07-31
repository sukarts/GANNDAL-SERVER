'use client';
import { useEffect, useState } from 'react';
import { api, apiDownload, apiPaged, getUser } from '@/lib/api';
import Pagination from '@/components/Pagination';
import { formatMoney } from '@/lib/money';
import { useLang } from '@/lib/i18n';
import Modal from '@/components/Modal';
import MoneyMono from '@/components/MoneyMono';
import StatutBadge from '@/components/StatutBadge';

interface Fiche {
  id: string; reference: string; annee: number; mois: number;
  nbSujets: number; totalMinutes: number; montantTotal: string; statut: string;
  referencePaiement?: string | null; modePaiement?: string | null;
  jri?: { nom: string; prenom: string };
}
interface Jri { id: string; nom: string; prenom: string }

const INPUT = 'w-full border border-line rounded px-3 py-2 text-sm';
const LIMIT = 25;
const now = new Date();

export default function PaiementsPage() {
  const [list, setList] = useState<Fiche[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [jris, setJris] = useState<Jri[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ jriId: '', annee: String(now.getFullYear()), mois: String(now.getMonth() + 1), bonus: '', penalites: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [periode, setPeriode] = useState({ annee: String(now.getFullYear()), mois: String(now.getMonth() + 1) });
  const [payFiche, setPayFiche] = useState<Fiche | null>(null);
  const [payForm, setPayForm] = useState({ mode: 'Virement', ref: '', date: '' });
  const { t } = useLang();
  const user = typeof window !== 'undefined' ? getUser() : null;
  const peutCalculer = user?.role === 'ADMIN' || user?.role === 'COMPTABLE';

  async function exportExcel() {
    try {
      await apiDownload(`/paiements/export/excel?annee=${periode.annee}&mois=${periode.mois}`, `paie-${periode.annee}-${periode.mois}.xlsx`);
    } catch (e) { alert((e as Error).message); }
  }

  async function bordereau() {
    try {
      await apiDownload(`/paiements/bordereau?annee=${periode.annee}&mois=${periode.mois}`, `bordereau-${periode.annee}-${periode.mois}.pdf`);
    } catch (e) { alert((e as Error).message); }
  }

  async function exportComptable() {
    try {
      await apiDownload(`/paiements/export/comptable?annee=${periode.annee}`, `comptabilite-${periode.annee}.xlsx`);
    } catch (e) { alert((e as Error).message); }
  }

  function load() {
    apiPaged<Fiche>('/paiements', page, LIMIT)
      .then((r) => { setList(r.items); setTotal(r.total); })
      .catch(() => {});
  }
  useEffect(load, [page]);

  function openForm() {
    setError('');
    api<Jri[]>('/users?role=JRI').then(setJris).catch(() => {});
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api('/paiements/calculer', {
        method: 'POST',
        body: JSON.stringify({
          jriId: form.jriId, annee: Number(form.annee), mois: Number(form.mois),
          bonus: form.bonus ? Number(form.bonus) : undefined,
          penalites: form.penalites ? Number(form.penalites) : undefined,
        }),
      });
      setOpen(false); load();
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }

  async function genererPdf(id: string) {
    try {
      const r = await api<{ pdfUrl: string }>(`/paiements/${id}/pdf`, { method: 'POST' });
      window.open(r.pdfUrl, '_blank');
    } catch (err) { alert((err as Error).message); }
  }

  async function confirmerPaiement(e: React.FormEvent) {
    e.preventDefault();
    if (!payFiche) return;
    setSaving(true);
    try {
      await api(`/paiements/${payFiche.id}/payer`, {
        method: 'PATCH',
        body: JSON.stringify({ modePaiement: payForm.mode || undefined, referencePaiement: payForm.ref || undefined, payeeLe: payForm.date || undefined }),
      });
      setPayFiche(null); load();
    } catch (err) { alert((err as Error).message); } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('Piges & paiements', 'Fees & payments')}</h1>
        <div className="flex items-center gap-2">
          {peutCalculer && (
            <>
              <input type="number" className="border border-line rounded px-2 py-1 text-sm w-20 tabular-nums" value={periode.annee} onChange={(e) => setPeriode({ ...periode, annee: e.target.value })} />
              <input type="number" min={1} max={12} className="border border-line rounded px-2 py-1 text-sm w-16 tabular-nums" value={periode.mois} onChange={(e) => setPeriode({ ...periode, mois: e.target.value })} />
              <button onClick={bordereau} className="border border-line rounded px-3 py-2 text-sm hover:bg-surface-2">Bordereau PDF</button>
              <button onClick={exportExcel} className="border border-line rounded px-3 py-2 text-sm hover:bg-surface-2">Export mois</button>
              <button onClick={exportComptable} className="border border-line rounded px-3 py-2 text-sm hover:bg-surface-2">Compta {periode.annee}</button>
            </>
          )}
          {peutCalculer && <button onClick={openForm} className="bg-brand text-white rounded px-4 py-2 text-sm hover:bg-brand-dark">Calculer une pige</button>}
        </div>
      </div>
      <div className="bg-surface rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-muted">
            <tr><th className="p-3">{t('Référence', 'Reference')}</th><th className="p-3">{t('JRI', 'Contributor')}</th><th className="p-3">{t('Période', 'Period')}</th><th className="p-3 text-right">{t('Sujets', 'Items')}</th><th className="p-3 text-right">Minutes</th><th className="p-3 text-right">Total</th><th className="p-3">{t('Statut', 'Status')}</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.id} className="border-t border-line">
                <td className="p-3 font-mono text-xs">{f.reference}</td>
                <td className="p-3">{f.jri ? `${f.jri.prenom} ${f.jri.nom}` : '—'}</td>
                <td className="p-3 tabular-nums">{String(f.mois).padStart(2, '0')}/{f.annee}</td>
                <td className="p-3 text-right tabular-nums">{f.nbSujets}</td>
                <td className="p-3 text-right tabular-nums">{f.totalMinutes}</td>
                <td className="p-3 text-right font-medium"><MoneyMono value={Number(f.montantTotal)} /></td>
                <td className="p-3">
                  <StatutBadge kind="fiche" value={f.statut} />
                  {f.statut === 'PAYEE' && f.referencePaiement ? <span className="text-muted text-xs ml-1">· {f.referencePaiement}</span> : null}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => genererPdf(f.id)} className="text-xs underline mr-3">PDF</button>
                  {peutCalculer && f.statut !== 'PAYEE' && <button onClick={() => { setPayForm({ mode: 'Virement', ref: '', date: '' }); setPayFiche(f); }} className="text-xs underline text-brand">{t('Payer', 'Pay')}</button>}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td className="p-6 text-center text-muted" colSpan={8}>{t('Aucune fiche', 'No slips')}</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
      </div>

      <Modal open={!!payFiche} title={`Valider le paiement — ${payFiche?.reference ?? ''}`} onClose={() => setPayFiche(null)}>
        <form onSubmit={confirmerPaiement} className="space-y-3">
          <p className="text-sm text-muted">Montant : <b className="text-content">{payFiche && <MoneyMono value={Number(payFiche.montantTotal)} />}</b></p>
          <label className="text-sm block">Mode de paiement
            <select className={INPUT} value={payForm.mode} onChange={(e) => setPayForm({ ...payForm, mode: e.target.value })}>
              <option>Virement</option><option>Western Union</option><option>MoneyGram</option><option>Wave</option><option>Espèces</option><option>Autre</option>
            </select>
          </label>
          <input className={INPUT} placeholder="Référence (n° transaction / bordereau)" value={payForm.ref} onChange={(e) => setPayForm({ ...payForm, ref: e.target.value })} />
          <label className="text-sm block">Date de paiement<input type="date" className={INPUT} value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} /></label>
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 disabled:opacity-50">{saving ? 'Validation…' : 'Confirmer le paiement'}</button>
        </form>
      </Modal>

      <Modal open={open} title="Calculer une pige" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <select required className={INPUT} value={form.jriId} onChange={(e) => setForm({ ...form, jriId: e.target.value })}>
            <option value="">— JRI —</option>
            {jris.map((j) => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
          </select>
          <div className="flex gap-3">
            <label className="flex-1 text-sm">Année<input type="number" className={INPUT} value={form.annee} onChange={(e) => setForm({ ...form, annee: e.target.value })} /></label>
            <label className="flex-1 text-sm">Mois<input type="number" min={1} max={12} className={INPUT} value={form.mois} onChange={(e) => setForm({ ...form, mois: e.target.value })} /></label>
          </div>
          <div className="flex gap-3">
            <label className="flex-1 text-sm">Bonus (GNF)<input type="number" min={0} className={INPUT} value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} /></label>
            <label className="flex-1 text-sm">Pénalités (GNF)<input type="number" min={0} className={INPUT} value={form.penalites} onChange={(e) => setForm({ ...form, penalites: e.target.value })} /></label>
          </div>
          <p className="text-xs text-muted">Base = sujets validés du mois × tarif/sujet + minutes × tarif/minute.</p>
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 hover:bg-brand-dark disabled:opacity-50">
            {saving ? 'Calcul…' : 'Générer la fiche'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
