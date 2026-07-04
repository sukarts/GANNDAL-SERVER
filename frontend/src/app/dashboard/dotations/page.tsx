'use client';
import { useEffect, useRef, useState } from 'react';
import { api, apiUpload, getUser } from '@/lib/api';
import Modal from '@/components/Modal';
import SignaturePad, { type SignatureHandle } from '@/components/SignaturePad';

interface Dotation {
  id: string; dateRemise: string; statut: string; etatRemise: string;
  materiel: { reference: string; categorie: { nom: string } };
  jri: { nom: string; prenom: string };
}
interface Materiel { id: string; reference: string; statut: string }
interface Jri { id: string; nom: string; prenom: string }

const INPUT = 'w-full border rounded px-3 py-2 text-sm';

export default function DotationsPage() {
  const [list, setList] = useState<Dotation[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [jris, setJris] = useState<Jri[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ materielId: '', jriId: '', etatRemise: 'BON_ETAT', observations: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [restit, setRestit] = useState<Dotation | null>(null);
  const [rForm, setRForm] = useState({ etatRetour: 'BON_ETAT', observationsRetour: '' });
  const [photosRetour, setPhotosRetour] = useState<FileList | null>(null);
  const sigRef = useRef<SignatureHandle>(null);

  async function uploadPhotos(dotationId: string, files: FileList | null, kind: string) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append('fichier', f);
      fd.append('kind', kind);
      await apiUpload(`/dotations/${dotationId}/fichier`, fd).catch(() => {});
    }
  }
  const user = typeof window !== 'undefined' ? getUser() : null;
  const peutCreer = user?.role === 'ADMIN' || user?.role === 'REDACTEUR';

  async function restituer(e: React.FormEvent) {
    e.preventDefault();
    if (!restit) return;
    setSaving(true); setError('');
    try {
      await api(`/dotations/${restit.id}/restitution`, {
        method: 'POST',
        body: JSON.stringify({ etatRetour: rForm.etatRetour, observationsRetour: rForm.observationsRetour || undefined }),
      });
      await uploadPhotos(restit.id, photosRetour, 'photoRetour');
      setRestit(null); setPhotosRetour(null); load();
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }

  function load() { api<Dotation[]>('/dotations').then(setList).catch(() => {}); }
  useEffect(load, []);

  function openForm() {
    setForm({ materielId: '', jriId: '', etatRemise: 'BON_ETAT', observations: '' });
    setError('');
    api<Materiel[]>('/materiel?statut=DISPONIBLE').then(setMateriels).catch(() => {});
    api<Jri[]>('/users?role=JRI').then(setJris).catch(() => {});
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const dotation = await api<{ id: string }>('/dotations', {
        method: 'POST',
        body: JSON.stringify({
          materielId: form.materielId, jriId: form.jriId,
          etatRemise: form.etatRemise, observations: form.observations || undefined,
        }),
      });
      // Signature électronique du JRI (si dessinée)
      if (sigRef.current && !sigRef.current.isEmpty()) {
        const blob = await sigRef.current.toBlob();
        if (blob) {
          const fd = new FormData();
          fd.append('fichier', new File([blob], 'signature.png', { type: 'image/png' }));
          fd.append('kind', 'signature');
          await apiUpload(`/dotations/${dotation.id}/fichier`, fd);
        }
      }
      await uploadPhotos(dotation.id, photos, 'photo');
      setOpen(false); setPhotos(null); load();
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dotations</h1>
        {peutCreer && <button onClick={openForm} className="bg-brand text-white rounded px-4 py-2 text-sm hover:bg-brand-dark">+ Nouvelle dotation</button>}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Matériel</th><th className="p-3">Catégorie</th><th className="p-3">JRI</th><th className="p-3">Remise</th><th className="p-3">État remise</th><th className="p-3">Statut</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3 font-mono text-xs">{d.materiel.reference}</td>
                <td className="p-3">{d.materiel.categorie?.nom}</td>
                <td className="p-3">{d.jri.prenom} {d.jri.nom}</td>
                <td className="p-3">{new Date(d.dateRemise).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">{d.etatRemise}</td>
                <td className="p-3">{d.statut}</td>
                <td className="p-3 text-right">
                  {peutCreer && d.statut === 'EN_COURS' && (
                    <button onClick={() => { setRForm({ etatRetour: 'BON_ETAT', observationsRetour: '' }); setError(''); setRestit(d); }} className="text-xs underline text-brand">Restituer</button>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td className="p-6 text-center text-gray-400" colSpan={7}>Aucune dotation</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Nouvelle dotation" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <select required className={INPUT} value={form.materielId} onChange={(e) => setForm({ ...form, materielId: e.target.value })}>
            <option value="">— Matériel disponible —</option>
            {materiels.map((m) => <option key={m.id} value={m.id}>{m.reference}</option>)}
          </select>
          {materiels.length === 0 && <p className="text-xs text-gray-400">Aucun matériel disponible.</p>}
          <select required className={INPUT} value={form.jriId} onChange={(e) => setForm({ ...form, jriId: e.target.value })}>
            <option value="">— JRI bénéficiaire —</option>
            {jris.map((j) => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
          </select>
          <label className="text-sm block">État à la remise
            <select className={INPUT} value={form.etatRemise} onChange={(e) => setForm({ ...form, etatRemise: e.target.value })}>
              <option value="NEUF">Neuf</option><option value="BON_ETAT">Bon état</option><option value="A_REPARER">À réparer</option>
            </select>
          </label>
          <textarea className={INPUT} rows={2} placeholder="Observations" value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
          <label className="text-sm block text-gray-600">Photos du matériel
            <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} className="block text-sm mt-1" />
          </label>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-600">Signature du JRI</label>
              <button type="button" onClick={() => sigRef.current?.clear()} className="text-xs underline text-gray-500">Effacer</button>
            </div>
            <SignaturePad ref={sigRef} />
          </div>
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 hover:bg-brand-dark disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Valider la remise'}
          </button>
        </form>
      </Modal>

      <Modal open={!!restit} title={`Restitution — ${restit?.materiel.reference ?? ''}`} onClose={() => setRestit(null)}>
        <form onSubmit={restituer} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <label className="text-sm block">État au retour
            <select className={INPUT} value={rForm.etatRetour} onChange={(e) => setRForm({ ...rForm, etatRetour: e.target.value })}>
              <option value="NEUF">Neuf</option><option value="BON_ETAT">Bon état</option>
              <option value="A_REPARER">À réparer</option><option value="HORS_SERVICE">Hors service</option>
              <option value="PERDU">Perdu</option><option value="VOLE">Volé</option>
            </select>
          </label>
          <textarea className={INPUT} rows={2} placeholder="Observations retour" value={rForm.observationsRetour} onChange={(e) => setRForm({ ...rForm, observationsRetour: e.target.value })} />
          <label className="text-sm block text-gray-600">Photos au retour
            <input type="file" accept="image/*" multiple onChange={(e) => setPhotosRetour(e.target.files)} className="block text-sm mt-1" />
          </label>
          <p className="text-xs text-gray-400">Dégradation calculée automatiquement selon l’état (% du coût d’acquisition).</p>
          <button disabled={saving} className="w-full bg-brand text-white rounded py-2 hover:bg-brand-dark disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Valider la restitution'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
