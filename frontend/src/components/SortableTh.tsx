'use client';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface SortState { key: string; dir: 'asc' | 'desc' }

// Tri côté client sur une liste d'objets (stable, insensible à la casse pour les chaînes).
export function trier<T>(rows: T[], sort: SortState | null, accesseur?: (row: T, key: string) => unknown): T[] {
  if (!sort) return rows;
  const get = accesseur ?? ((row: T, key: string) => (row as Record<string, unknown>)[key]);
  return [...rows].sort((a, b) => {
    const va = get(a, sort.key);
    const vb = get(b, sort.key);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    let cmp: number;
    if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
    else cmp = String(va).localeCompare(String(vb), 'fr', { numeric: true, sensitivity: 'base' });
    return sort.dir === 'asc' ? cmp : -cmp;
  });
}

// En-tête de colonne cliquable (tri) — accessible au clavier via <button>.
export default function SortableTh({
  label, sortKey, sort, onSort, align = 'left', className = '',
}: {
  label: string;
  sortKey: string;
  sort: SortState | null;
  onSort: (s: SortState) => void;
  align?: 'left' | 'right';
  className?: string;
}) {
  const actif = sort?.key === sortKey;
  const dir = actif ? sort.dir : undefined;
  return (
    <th
      scope="col"
      aria-sort={actif ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`p-3 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort({ key: sortKey, dir: actif && dir === 'asc' ? 'desc' : 'asc' })}
        className={`inline-flex items-center gap-1 hover:text-content transition-colors ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {label}
        {actif ? (dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ChevronsUpDown size={13} className="opacity-40" />}
      </button>
    </th>
  );
}
