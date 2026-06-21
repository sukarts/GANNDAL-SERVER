'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Devise {
  code: string;
  nom: string;
  symbole: string;
  tauxGnf: string;
  actif: boolean;
  parDefaut: boolean;
}

export default function DevisesPage() {
  const [list, setList] = useState<Devise[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ code: '', nom: '', symbole: '', tauxGnf: '' });

  function load() {
    api<Devise[]>('/currencies?all=true').then(setList).catch((e) => setMsg((e as Error).message));
  }
  useEffect(load, []);

  async function saveTaux(code: string, tauxGnf: string) {
    setMsg('');
    try {
      await api(`/currencies/${code}`, { method: 'PATCH', body: JSON.stringify({ tauxGnf: Number(tauxGnf) }) });
      setMsg(`Taux ${code} mis à jour.`);
      load();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function toggleActif(d: Devise) {
    await api(`/currencies/${d.code}`, { method: 'PATCH', body: JSON.stringify({ actif: !d.actif }) }).catch(() => {});
    load();
  }

  async function setDefaut(code: string) {
    await api(`/currencies/${code}/defaut`, { method: 'PATCH' }).catch(() => {});
    load();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await api('/currencies', {
        method: 'POST',
        body: JSON.stringify({ ...form, tauxGnf: Number(form.tauxGnf) }),
      });
      setForm({ code: '', nom: '', symbole: '', tauxGnf: '' });
      load();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Devises</h1>
      <p className="text-sm text-gray-500 mb-6">
        Devise de base : <b>GNF</b>. Taux = nombre de GNF pour 1 unité de la devise. Saisie manuelle.
      </p>
      {msg && <p className="text-sm mb-4 bg-amber-50 text-amber-800 p-2 rounded">{msg}</p>}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Code</th><th className="p-3">Nom</th><th className="p-3">Symbole</th><th className="p-3">Taux (GNF / unité)</th><th className="p-3">Défaut</th><th className="p-3">Actif</th></tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.code} className="border-t">
                <td className="p-3 font-mono">{d.code}</td>
                <td className="p-3">{d.nom}</td>
                <td className="p-3">{d.symbole}</td>
                <td className="p-3">
                  <TauxEditor
                    initial={d.tauxGnf}
                    disabled={d.code === 'GNF'}
                    onSave={(v) => saveTaux(d.code, v)}
                  />
                </td>
                <td className="p-3">
                  {d.parDefaut ? <span className="text-brand font-medium">✔ défaut</span>
                    : <button onClick={() => setDefaut(d.code)} className="text-xs underline">définir</button>}
                </td>
                <td className="p-3">
                  <button onClick={() => toggleActif(d)} className="text-xs underline">
                    {d.actif ? '✅ actif' : '❌ inactif'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="font-semibold mb-2">Ajouter une devise</h2>
      <form onSubmit={create} className="flex flex-wrap gap-2 items-end bg-white p-4 rounded-xl shadow-sm">
        <input required placeholder="Code (USD)" value={form.code} maxLength={4}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="border rounded px-2 py-1 w-28" />
        <input required placeholder="Nom" value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })} className="border rounded px-2 py-1" />
        <input required placeholder="Symbole" value={form.symbole}
          onChange={(e) => setForm({ ...form, symbole: e.target.value })} className="border rounded px-2 py-1 w-24" />
        <input required type="number" step="any" placeholder="Taux GNF" value={form.tauxGnf}
          onChange={(e) => setForm({ ...form, tauxGnf: e.target.value })} className="border rounded px-2 py-1 w-32" />
        <button className="bg-brand text-white rounded px-4 py-1.5 hover:bg-brand-dark">Ajouter</button>
      </form>
    </div>
  );
}

function TauxEditor({ initial, disabled, onSave }: { initial: string; disabled?: boolean; onSave: (v: string) => void }) {
  const [v, setV] = useState(initial);
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        step="any"
        value={v}
        disabled={disabled}
        onChange={(e) => setV(e.target.value)}
        className="border rounded px-2 py-1 w-32 disabled:bg-gray-100"
      />
      {!disabled && v !== initial && (
        <button onClick={() => onSave(v)} className="text-xs bg-brand text-white rounded px-2 py-1">OK</button>
      )}
    </div>
  );
}
