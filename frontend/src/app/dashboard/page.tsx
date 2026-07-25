'use client';
import { useEffect, useState } from 'react';
import { api, apiDownload, getUser } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { useLang } from '@/lib/i18n';
import BarChartMois from '@/components/BarChartMois';

interface AdminStats {
  nbJri: number;
  sujetsLivres: number;
  sujetsValides: number;
  sujetsEnRetard: number;
  montantAPayer: number;
  statistiquesMensuelles: { mois: number; sujets: number }[];
}

interface JriFiche { id: string; reference: string; annee: number; mois: number; montantTotal: string; statut: string }
interface JriStats {
  assignes: number; enCours: number; valides: number; materielsDetenus: number; sujetsEnRetard: number;
  revenusCumules: number; revenusEnAttente: number; fiches: JriFiche[];
}

function JriVue({ stats }: { stats: JriStats }) {
  const { t } = useLang();
  async function pdf(id: string) {
    try {
      const r = await api<{ pdfUrl: string }>(`/paiements/${id}/pdf`, { method: 'POST' });
      window.open(r.pdfUrl, '_blank');
    } catch (e) { alert((e as Error).message); }
  }
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card label={t('Assignés', 'Assigned')} value={stats.assignes} />
        <Card label={t('En cours', 'In progress')} value={stats.enCours} />
        <Card label={t('Validés', 'Approved')} value={stats.valides} />
        <Card label={t('En retard', 'Overdue')} value={stats.sujetsEnRetard} alerte={stats.sujetsEnRetard > 0} />
        <Card label={t('Matériel détenu', 'Equipment held')} value={stats.materielsDetenus} />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500">{t('Revenus perçus (cumulés)', 'Total earnings (paid)')}</div>
          <div className="text-3xl font-bold text-brand mt-1">{formatMoney(stats.revenusCumules)}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500">{t('En attente de paiement', 'Awaiting payment')}</div>
          <div className="text-3xl font-bold text-amber-600 mt-1">{formatMoney(stats.revenusEnAttente)}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">{t('Mes fiches de pige', 'My payment slips')}</h2>
        <button
          onClick={() => apiDownload(`/paiements/attestation?annee=${new Date().getFullYear()}`, `attestation-${new Date().getFullYear()}.pdf`).catch((e) => alert((e as Error).message))}
          className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          {t('Attestation', 'Statement')} {new Date().getFullYear()}
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">{t('Référence', 'Reference')}</th><th className="p-3">{t('Période', 'Period')}</th><th className="p-3">{t('Montant', 'Amount')}</th><th className="p-3">{t('Statut', 'Status')}</th><th className="p-3"></th></tr></thead>
          <tbody>
            {stats.fiches.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3 font-mono text-xs">{f.reference}</td>
                <td className="p-3">{String(f.mois).padStart(2, '0')}/{f.annee}</td>
                <td className="p-3 font-medium">{formatMoney(Number(f.montantTotal))}</td>
                <td className="p-3">{f.statut === 'PAYEE' ? <span className="text-green-700">{t('Payée', 'Paid')}</span> : f.statut === 'GENEREE' ? <span className="text-amber-600">{t('En attente', 'Pending')}</span> : f.statut}</td>
                <td className="p-3 text-right"><button onClick={() => pdf(f.id)} className="text-xs underline text-brand">{t('Télécharger PDF', 'Download PDF')}</button></td>
              </tr>
            ))}
            {stats.fiches.length === 0 && <tr><td className="p-6 text-center text-gray-400" colSpan={5}>{t('Aucune fiche', 'No slips')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value, alerte }: { label: string; value: string | number; alerte?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${alerte ? 'text-red-600' : 'text-brand'}`}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useLang();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const user = typeof window !== 'undefined' ? getUser() : null;
  const isJri = user?.role === 'JRI';

  useEffect(() => {
    api<AdminStats>(isJri ? '/dashboard/jri' : '/dashboard/admin')
      .then((d) => setStats(d as unknown as AdminStats))
      .catch((e) => setError((e as Error).message));
  }, [isJri]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p>Chargement…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('Tableau de bord', 'Dashboard')}</h1>
      {!isJri ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card label={t('JRI actifs', 'Active contributors')} value={stats.nbJri} />
          <Card label={t('Sujets livrés', 'Delivered')} value={stats.sujetsLivres} />
          <Card label={t('Sujets validés', 'Approved')} value={stats.sujetsValides} />
          <Card label={t('En retard', 'Overdue')} value={stats.sujetsEnRetard} alerte={stats.sujetsEnRetard > 0} />
          <Card label={t('Piges à payer', 'Fees to pay')} value={formatMoney(stats.montantAPayer)} />
        </div>
      ) : (
        <JriVue stats={stats as unknown as JriStats} />
      )}

      {!isJri && (
        <div className="bg-white rounded-xl p-5 shadow-sm mt-6">
          <h2 className="font-semibold mb-3">{t('Sujets validés par mois', 'Approved assignments per month')}</h2>
          <BarChartMois data={stats.statistiquesMensuelles} />
        </div>
      )}
    </div>
  );
}
