'use client';
import { useEffect, useState } from 'react';
import { loadCurrencies, getCurrencies, getSelectedCurrency, setSelectedCurrency, type Devise } from '@/lib/money';

export default function CurrencySelector() {
  const [devises, setDevises] = useState<Devise[]>([]);
  const [sel, setSel] = useState('GNF');

  useEffect(() => {
    loadCurrencies()
      .then((list) => {
        setDevises(list);
        setSel(getSelectedCurrency());
      })
      .catch(() => {
        setDevises(getCurrencies());
        setSel(getSelectedCurrency());
      });
  }, []);

  function change(code: string) {
    setSelectedCurrency(code);
    setSel(code);
    // Recharge pour reformater tous les montants affichés
    window.location.reload();
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">Devise</span>
      <select
        value={sel}
        onChange={(e) => change(e.target.value)}
        className="border rounded px-2 py-1 bg-white"
      >
        {devises.map((d) => (
          <option key={d.code} value={d.code}>
            {d.code} — {d.symbole}
          </option>
        ))}
      </select>
    </label>
  );
}
