'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, clearSession, type AuthUser } from '@/lib/api';
import CurrencySelector from '@/components/CurrencySelector';
import NotificationBell from '@/components/NotificationBell';

const NAV: { href: string; label: string; roles: AuthUser['role'][] }[] = [
  { href: '/dashboard', label: 'Tableau de bord', roles: ['ADMIN', 'REDACTEUR', 'JRI', 'COMPTABLE'] },
  { href: '/dashboard/sujets', label: 'Sujets', roles: ['ADMIN', 'REDACTEUR', 'JRI'] },
  { href: '/dashboard/jri', label: 'JRI / Pigistes', roles: ['ADMIN', 'REDACTEUR', 'COMPTABLE'] },
  { href: '/dashboard/paiements', label: 'Piges & paiements', roles: ['ADMIN', 'COMPTABLE', 'JRI'] },
  { href: '/dashboard/materiel', label: 'Équipements', roles: ['ADMIN', 'REDACTEUR', 'COMPTABLE'] },
  { href: '/dashboard/dotations', label: 'Dotations', roles: ['ADMIN', 'REDACTEUR', 'JRI'] },
  { href: '/dashboard/rapports', label: 'Rapports', roles: ['ADMIN', 'REDACTEUR', 'COMPTABLE'] },
  { href: '/dashboard/devises', label: 'Devises', roles: ['ADMIN'] },
  { href: '/dashboard/audit', label: 'Audit', roles: ['ADMIN'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) router.replace('/login');
    else setUser(u);
  }, [router]);

  if (!user) return null;

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-brand-dark text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-white/20">GANNDAL</div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
            <Link key={n.href} href={n.href} className="block px-3 py-2 rounded hover:bg-white/10 text-sm">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/20 text-sm">
          <div className="font-medium">{user.prenom} {user.nom}</div>
          <div className="text-white/60 text-xs mb-2">{user.role}</div>
          <div className="flex gap-3">
            <Link href="/dashboard/compte" className="text-xs underline">Mon compte</Link>
            <button onClick={logout} className="text-xs underline">Déconnexion</button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b flex items-center justify-end px-6 gap-4">
          <CurrencySelector />
          <NotificationBell />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
