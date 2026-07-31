'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';

interface Activite { periode: string; crees: number; livres: number; valides: number; rejetes: number }
interface Classement { jriId: string; nom: string; sujets: number; minutes: number }
interface Evolution { annee: number; parMois: { mois: number; montant: number; fiches: number }[] }
interface Sla { enRetard: number; respectParJri: { jriId: string; nom: string; aTemps: number; enRetard: number; total: number; taux: number }[] }

const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export default function RapportsPage() {
  const [periode, setPeriode] = useState('mois');
  const [act, setAct] = useState<Activite | null>(null);
  const [classement, setClassement] = useState<Classement[]>([]);
  const [evo, setEvo] = useState<Evolution | null>(null);
  const [sla, setSla] = useState<Sla | null>(null);

  useEffect(() => {
    api<Activite>(`/rapports/activite?periode=${periode}`).then(setAct).catch(() => {});
    api<Classement[]>(`/rapports/classement-jri?periode=${periode}`).then(setClassement).catch(() => {});
  }, [periode]);

  useEffect(() => {
    api<Evolution>('/rapports/evolution-piges').then(setEvo).catch(() => {});
    api<Sla>('/rapports/sla').then(setSla).catch(() => {});
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Rapports</h1>
        <div className="flex items-center gap-2">
          <select value={periode} onChange={(e) => setPeriode(e.target.value)} className="border rounded px-3 py-1">
            <option value="jour">Journalier</option>
            <option value="semaine">Hebdomadaire</option>
            <option value="mois">Mensuel</option>
          </select>
          <button onClick={() => window.print()} className="border rounded px-3 py-1 text-sm hover:bg-surface-2">Imprimer / PDF</button>
        </div>
      </div>

      {act && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface rounded-xl p-4 shadow-sm"><div className="text-xs text-muted">Créés</div><div className="text-2xl font-bold">{act.crees}</div></div>
          <div className="bg-surface rounded-xl p-4 shadow-sm"><div className="text-xs text-muted">Livrés</div><div className="text-2xl font-bold">{act.livres}</div></div>
          <div className="bg-surface rounded-xl p-4 shadow-sm"><div className="text-xs text-muted">Validés</div><div className="text-2xl font-bold">{act.valides}</div></div>
          <div className="bg-surface rounded-xl p-4 shadow-sm"><div className="text-xs text-muted">Rejetés</div><div className="text-2xl font-bold">{act.rejetes}</div></div>
        </div>
      )}

      {sla && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Respect des délais (SLA)</h2>
          <div className="bg-surface rounded-xl shadow-sm p-4">
            <div className="mb-3 text-sm">
              Sujets <b>en retard</b> (échéance dépassée, non livrés) :{' '}
              <span className={sla.enRetard > 0 ? 'text-red-600 font-bold text-lg' : 'text-green-700 font-bold'}>{sla.enRetard}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-muted"><tr><th className="py-1">JRI</th><th className="py-1">À l’heure</th><th className="py-1">En retard</th><th className="py-1">Taux</th></tr></thead>
              <tbody>
                {sla.respectParJri.map((r) => (
                  <tr key={r.jriId} className="border-t">
                    <td className="py-1.5">{r.nom}</td>
                    <td className="py-1.5">{r.aTemps}</td>
                    <td className="py-1.5">{r.enRetard}</td>
                    <td className="py-1.5">
                      <span className={`font-medium ${r.taux >= 80 ? 'text-green-700' : r.taux >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{r.taux}%</span>
                    </td>
                  </tr>
                ))}
                {sla.respectParJri.length === 0 && <tr><td className="py-3 text-muted" colSpan={4}>Pas encore de livraison mesurable.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {evo && evo.parMois.some((m) => m.montant > 0) && (
        <div className="bg-surface rounded-xl shadow-sm p-4 mb-6">
          <h2 className="font-semibold text-sm mb-3">Évolution des piges — {evo.annee}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={evo.parMois.map((m) => ({ ...m, label: MOIS[m.mois - 1] }))} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={70}
                tickFormatter={(v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : String(v))} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                formatter={(v: number) => [formatMoney(v), 'Montant']}
              />
              <Line type="monotone" dataKey="montant" stroke="#1a7f37" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <h2 className="font-semibold mb-2">Classement des JRI (sujets validés)</h2>
      {classement.length > 0 && (
        <div className="bg-surface rounded-xl shadow-sm p-4 mb-4">
          <ResponsiveContainer width="100%" height={Math.max(120, classement.slice(0, 8).length * 36)}>
            <BarChart data={classement.slice(0, 8)} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nom" width={120} tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(26,127,55,0.06)' }} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="sujets" fill="#1a7f37" radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="bg-surface rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-muted"><tr><th className="p-3">#</th><th className="p-3">JRI</th><th className="p-3">Sujets</th><th className="p-3">Minutes</th></tr></thead>
          <tbody>
            {classement.map((c, i) => (
              <tr key={c.jriId} className="border-t"><td className="p-3">{i + 1}</td><td className="p-3">{c.nom}</td><td className="p-3">{c.sujets}</td><td className="p-3">{c.minutes}</td></tr>
            ))}
            {classement.length === 0 && <tr><td className="p-6 text-center text-muted" colSpan={4}>Aucune donnée</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
