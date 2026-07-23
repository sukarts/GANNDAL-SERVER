'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Inventaire {
  disponible: number; affecte: number; maintenance: number; perdu: number; vole: number;
}

// Couleurs de STATUT (réservées) : bon / info / avertissement / critique.
// Toujours accompagnées d'une légende + libellés — jamais la couleur seule.
const SEGMENTS = [
  { cle: 'disponible', label: 'Disponible', couleur: '#1a7f37' },
  { cle: 'affecte', label: 'Affecté', couleur: '#185fa5' },
  { cle: 'maintenance', label: 'Maintenance', couleur: '#ba7517' },
  { cle: 'perduVole', label: 'Perdu / Volé', couleur: '#a32d2d' },
] as const;

export default function PieParcMateriel({ inv }: { inv: Inventaire }) {
  const data = [
    { label: 'Disponible', value: inv.disponible, couleur: SEGMENTS[0].couleur },
    { label: 'Affecté', value: inv.affecte, couleur: SEGMENTS[1].couleur },
    { label: 'Maintenance', value: inv.maintenance, couleur: SEGMENTS[2].couleur },
    { label: 'Perdu / Volé', value: inv.perdu + inv.vole, couleur: SEGMENTS[3].couleur },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return <p className="text-sm text-gray-400">Aucun équipement.</p>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={52}
          outerRadius={84}
          paddingAngle={2}
          stroke="#fff"
          strokeWidth={2}
          label={(e: { label: string; value: number }) => `${e.label} : ${e.value}`}
          labelLine={false}
        >
          {data.map((d) => <Cell key={d.label} fill={d.couleur} />)}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
        <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
