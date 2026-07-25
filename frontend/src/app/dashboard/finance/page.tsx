'use client';
import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';

interface Fin {
  annee: number; total: number; paye: number; attente: number;
  parMois: { mois: number; total: number; paye: number; attente: number }[];
  topJri: { jriId: string; nom: string; montant: number }[];
}
const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const now = new Date();

function Kpi({ label, value, color = 'text-brand' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

export default function FinancePage() {
  const [annee, setAnnee] = useState(String(now.getFullYear()));
  const [d, setD] = useState<Fin | null>(null);

  const load = useCallback(() => {
    api<Fin>(`/rapports/financier?annee=${annee}`).then(setD).catch(() => {});
  }, [annee]);
  useEffect(load, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tableau financier</h1>
        <input type="number" value={annee} onChange={(e) => setAnnee(e.target.value)} className="border rounded px-2 py-1 text-sm w-24" />
      </div>

      {d && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Kpi label={`Masse salariale piges ${d.annee}`} value={formatMoney(d.total)} />
            <Kpi label="Payé" value={formatMoney(d.paye)} color="text-green-700" />
            <Kpi label="En attente" value={formatMoney(d.attente)} color="text-amber-600" />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <h2 className="font-semibold text-sm mb-3">Piges par mois (payé / en attente)</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={d.parMois.map((m) => ({ ...m, label: MOIS[m.mois - 1] }))} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={44}
                  tickFormatter={(v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : String(v))} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v: number) => formatMoney(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="paye" name="Payé" stackId="a" fill="#1a7f37" maxBarSize={30} />
                <Bar dataKey="attente" name="En attente" stackId="a" fill="#ba7517" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h2 className="font-semibold mb-2">Top JRI (rémunération {d.annee})</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">#</th><th className="p-3">JRI</th><th className="p-3">Rémunération</th></tr></thead>
              <tbody>
                {d.topJri.map((j, i) => (
                  <tr key={j.jriId} className="border-t"><td className="p-3">{i + 1}</td><td className="p-3">{j.nom}</td><td className="p-3 font-medium">{formatMoney(j.montant)}</td></tr>
                ))}
                {d.topJri.length === 0 && <tr><td className="p-6 text-center text-gray-400" colSpan={3}>Aucune donnée</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
