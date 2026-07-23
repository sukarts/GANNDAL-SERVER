'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

// Graphique magnitude à série unique (vert brand). Une échelle, grille discrète, tooltip.
export default function BarChartMois({ data, dataKey = 'sujets', height = 220 }: {
  data: { mois: number; [k: string]: number }[];
  dataKey?: string;
  height?: number;
}) {
  const rows = data.map((d) => ({ ...d, label: MOIS[d.mois - 1] ?? String(d.mois) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          cursor={{ fill: 'rgba(26,127,55,0.06)' }}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          labelFormatter={(l) => `Mois ${l}`}
        />
        <Bar dataKey={dataKey} fill="#1a7f37" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
