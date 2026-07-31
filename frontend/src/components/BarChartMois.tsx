'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

// Recharts ne lit pas les variables CSS : on résout les couleurs selon le thème actif.
export function useThemeColors() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.getAttribute('data-theme') === 'dark');
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return dark
    ? { grid: '#2a2f3a', tick: '#9ca3af', bar: '#2f9e4f', surface: '#171a21', border: '#2a2f3a', text: '#e5e7eb' }
    : { grid: '#e5e7eb', tick: '#6b7280', bar: '#1a7f37', surface: '#ffffff', border: '#e5e7eb', text: '#111827' };
}

// Graphique magnitude à série unique (vert brand). Une échelle, grille discrète, tooltip.
export default function BarChartMois({ data, dataKey = 'sujets', height = 220 }: {
  data: { mois: number; [k: string]: number }[];
  dataKey?: string;
  height?: number;
}) {
  const c = useThemeColors();
  const rows = data.map((d) => ({ ...d, label: MOIS[d.mois - 1] ?? String(d.mois) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: c.tick }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: c.tick }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          cursor={{ fill: 'rgba(26,127,55,0.06)' }}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${c.border}`, background: c.surface, color: c.text }}
          labelFormatter={(l) => `Mois ${l}`}
        />
        <Bar dataKey={dataKey} fill={c.bar} radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
