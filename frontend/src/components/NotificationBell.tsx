'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Notif { id: string; titre: string; message: string; lien: string | null; lu: boolean; createdAt: string }

export default function NotificationBell() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    api<{ notifications: Notif[]; nonLues: number }>('/notifications')
      .then((d) => { setNotifs(d.notifications); setNonLues(d.nonLues); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // rafraîchit toutes les 30s
    return () => clearInterval(t);
  }, [load]);

  async function ouvrir(n: Notif) {
    if (!n.lu) { await api(`/notifications/${n.id}/lu`, { method: 'PATCH' }).catch(() => {}); }
    setOpen(false);
    load();
    if (n.lien) router.push(`/dashboard${n.lien.startsWith('/dashboard') ? n.lien.slice('/dashboard'.length) : n.lien}`);
  }

  async function toutLu() {
    await api('/notifications/tout-lu', { method: 'PATCH' }).catch(() => {});
    load();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 rounded hover:bg-gray-100" aria-label="Notifications">
        <span className="text-xl">🔔</span>
        {nonLues > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 max-h-96 overflow-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-medium text-sm">Notifications</span>
              {nonLues > 0 && <button onClick={toutLu} className="text-xs text-brand underline">Tout marquer lu</button>}
            </div>
            {notifs.length === 0 && <p className="p-4 text-sm text-gray-400 text-center">Aucune notification</p>}
            {notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => ouvrir(n)}
                className={`block w-full text-left px-4 py-2 border-b last:border-0 hover:bg-gray-50 ${n.lu ? '' : 'bg-brand/5'}`}
              >
                <div className="text-sm font-medium flex items-center gap-2">
                  {!n.lu && <span className="w-2 h-2 rounded-full bg-brand inline-block" />}
                  {n.titre}
                </div>
                <div className="text-xs text-gray-500">{n.message}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString('fr-FR')}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
