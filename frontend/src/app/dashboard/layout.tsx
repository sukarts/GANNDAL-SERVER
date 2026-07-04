'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) router.replace('/login');
    else setUser(u);
  }, [router]);

  // Ferme le menu mobile à chaque navigation
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (!user) return null;

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Overlay mobile */}
      {menuOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMenuOpen(false)} />}

      <aside
        className={`w-60 bg-brand-dark text-white flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform md:static md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 text-xl font-bold border-b border-white/20">GANNDAL</div>
        <nav className="flex-1 p-2 space-y-1 overflow-auto">
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

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b flex items-center px-4 md:px-6 gap-4">
          <button className="md:hidden p-2 -ml-2" onClick={() => setMenuOpen(true)} aria-label="Menu">☰</button>
          <div className="flex-1" />
          <CurrencySelector />
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
