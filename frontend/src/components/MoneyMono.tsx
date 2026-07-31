'use client';
import { formatMoney } from '@/lib/money';

// Montant en police mono, chiffres tabulaires — pour alignement à droite dans les tables.
export default function MoneyMono({ value, className = '' }: { value: number; className?: string }) {
  return <span className={`font-mono tabular-nums ${className}`}>{formatMoney(value)}</span>;
}
