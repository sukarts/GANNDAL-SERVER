'use client';
import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { api, getUser } from '@/lib/api';
import { formatMoney } from '@/lib/money';

interface Ligne { rubrique: string; prevu: number; reel: number; ecart: number }
interface Comparatif { annee: number; mois: number; lignes: Ligne[] }

const now = new Date();

export default function BudgetPage() {
  const [annee, setAnnee] = useState(String(now.getFullYear()));
  const [mois, setMois] = useState(String(now.getMonth() + 1));
  const [data, setData] = useState<Comparatif | null>(null);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [nouvelle, setNouvelle] = useState({ rubrique: '', montant: '' });
  const [msg, setMsg] = useState('');
  const user = typeof window !== 'undefined' ? getUser() : null;
  const peutEditer = user?.role === 'ADMIN' || user?.role === 'COMPTABLE';

  const load = useCallback(() => {
    api<Comparatif>(`/budgets/comparatif?annee=${annee}&mois=${mois}`).then((d) => {
      setData(d);
      setEdit(Object.fromEntries(d.lignes.map((l) => [l.rubrique, String(l.prevu)])));
    }).catch(() => {});
  }, [annee, mois]);
  useEffect(load, [load]);

  async function save(rubrique: string, montant: string) {
    setMsg('');
    try {
      await api('/budgets', { method: 'POST', body: JSON.stringify({ rubrique, annee: Number(annee), mois: Number(mois), montantPrevu: Number(montant) || 0 }) });
      setMsg(`Budget ${rubrique} enregistré.`); load();
    } catch (e) { setMsg((e as Error).message); }
  }

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!nouvelle.rubrique) return;
    await save(nouvelle.rubrique, nouvelle.montant);
    setNouvelle({ rubrique: '', montant: '' });
  }

  const totalPrevu = data?.lignes.reduce((s, l) => s + l.prevu, 0) ?? 0;
  const totalReel = data?.lignes.reduce((s, l) => s + l.reel, 0) ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Budget par rubrique</h1>
        <div className="flex items-center gap-2">
          <input type="number" value={annee} onChange={(e) => setAnnee(e.target.value)} className="border rounded px-2 py-1 text-sm w-24" />
          <input type="number" min={1} max={12} value={mois} onChange={(e) => setMois(e.target.value)} className="border rounded px-2 py-1 text-sm w-16" />
        </div>
      </div>
      {msg && <p className="text-sm bg-gray-50 p-2 rounded mb-3">{msg}</p>}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-xs text-gray-500">Prévu total</div><div className="text-2xl font-bold text-brand">{formatMoney(totalPrevu)}</div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-xs text-gray-500">Réel (piges validées)</div><div className="text-2xl font-bold">{formatMoney(totalReel)}</div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-xs text-gray-500">Écart</div><div className={`text-2xl font-bold ${totalPrevu - totalReel < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatMoney(totalPrevu - totalReel)}</div></div>
      </div>

      {data && data.lignes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <ResponsiveContainer width="100%" height={Math.max(140, data.lignes.length * 44)}>
            <BarChart data={data.lignes} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : String(v))} />
              <YAxis type="category" dataKey="rubrique" width={110} tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v: number) => formatMoney(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="prevu" name="Prévu" fill="#185fa5" radius={[0, 4, 4, 0]} maxBarSize={14} />
              <Bar dataKey="reel" name="Réel" fill="#1a7f37" radius={[0, 4, 4, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Rubrique</th><th className="p-3">Prévu</th><th className="p-3">Réel</th><th className="p-3">Écart</th></tr></thead>
          <tbody>
            {data?.lignes.map((l) => (
              <tr key={l.rubrique} className="border-t">
                <td className="p-3">{l.rubrique}</td>
                <td className="p-3">
                  {peutEditer ? (
                    <span className="flex items-center gap-1">
                      <input type="number" value={edit[l.rubrique] ?? ''} onChange={(e) => setEdit({ ...edit, [l.rubrique]: e.target.value })} className="border rounded px-2 py-1 w-28 text-xs" />
                      {edit[l.rubrique] !== String(l.prevu) && <button onClick={() => save(l.rubrique, edit[l.rubrique])} className="text-xs bg-brand text-white rounded px-2 py-1">OK</button>}
                    </span>
                  ) : formatMoney(l.prevu)}
                </td>
                <td className="p-3">{formatMoney(l.reel)}</td>
                <td className="p-3"><span className={l.ecart < 0 ? 'text-red-600' : 'text-green-700'}>{formatMoney(l.ecart)}</span></td>
              </tr>
            ))}
            {(!data || data.lignes.length === 0) && <tr><td className="p-6 text-center text-gray-400" colSpan={4}>Aucune rubrique.</td></tr>}
          </tbody>
        </table>
      </div>

      {peutEditer && (
        <form onSubmit={ajouter} className="flex flex-wrap items-end gap-2 bg-white p-4 rounded-xl shadow-sm mt-4">
          <input placeholder="Nouvelle rubrique" value={nouvelle.rubrique} onChange={(e) => setNouvelle({ ...nouvelle, rubrique: e.target.value })} className="border rounded px-2 py-1 text-sm" />
          <input type="number" min={0} placeholder="Budget prévu (GNF)" value={nouvelle.montant} onChange={(e) => setNouvelle({ ...nouvelle, montant: e.target.value })} className="border rounded px-2 py-1 text-sm w-40" />
          <button className="bg-brand text-white rounded px-4 py-1.5 text-sm">Ajouter</button>
        </form>
      )}
    </div>
  );
}
