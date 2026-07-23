'use client';
import { useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import BarChartMois from '@/components/BarChartMois';

interface AdminStats {
  nbJri: number;
  sujetsLivres: number;
  sujetsValides: number;
  montantAPayer: number;
  statistiquesMensuelles: { mois: number; sujets: number }[];
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-bold text-brand mt-1">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
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
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      {!isJri ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card label="JRI actifs" value={stats.nbJri} />
          <Card label="Sujets livrés" value={stats.sujetsLivres} />
          <Card label="Sujets validés" value={stats.sujetsValides} />
          <Card label="Piges à payer" value={formatMoney(stats.montantAPayer)} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* @ts-expect-error JRI stats shape */}
          <Card label="Assignés" value={stats.assignes ?? 0} />
          {/* @ts-expect-error */}
          <Card label="En cours" value={stats.enCours ?? 0} />
          {/* @ts-expect-error */}
          <Card label="Validés" value={stats.valides ?? 0} />
          {/* @ts-expect-error */}
          <Card label="Matériel détenu" value={stats.materielsDetenus ?? 0} />
        </div>
      )}

      {!isJri && (
        <div className="bg-white rounded-xl p-5 shadow-sm mt-6">
          <h2 className="font-semibold mb-3">Sujets validés par mois</h2>
          <BarChartMois data={stats.statistiquesMensuelles} />
        </div>
      )}
    </div>
  );
}
