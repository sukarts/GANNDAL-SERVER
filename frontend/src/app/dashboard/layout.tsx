'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getUser, clearSession, type AuthUser } from '@/lib/api';
import CurrencySelector from '@/components/CurrencySelector';
import NotificationBell from '@/components/NotificationBell';
import LangSelector from '@/components/LangSelector';
import { useLang } from '@/lib/i18n';

const NAV: { href: string; label: string; en: string; roles: AuthUser['role'][] }[] = [
  { href: '/dashboard', label: 'Tableau de bord', en: 'Dashboard', roles: ['ADMIN', 'REDACTEUR', 'JRI', 'COMPTABLE'] },
  { href: '/dashboard/planning', label: 'Planning', en: 'Planning', roles: ['ADMIN', 'REDACTEUR', 'JRI'] },
  { href: '/dashboard/sujets', label: 'Sujets', en: 'Assignments', roles: ['ADMIN', 'REDACTEUR', 'JRI'] },
  { href: '/dashboard/medias', label: 'Médiathèque', en: 'Media library', roles: ['ADMIN', 'REDACTEUR', 'JRI'] },
  { href: '/dashboard/jri', label: 'JRI / Pigistes', en: 'Contributors', roles: ['ADMIN', 'REDACTEUR', 'COMPTABLE'] },
  { href: '/dashboard/paiements', label: 'Piges & paiements', en: 'Fees & payments', roles: ['ADMIN', 'COMPTABLE', 'JRI'] },
  { href: '/dashboard/materiel', label: 'Équipements', en: 'Equipment', roles: ['ADMIN', 'REDACTEUR', 'COMPTABLE'] },
  { href: '/dashboard/dotations', label: 'Dotations', en: 'Assignments (gear)', roles: ['ADMIN', 'REDACTEUR', 'JRI'] },
  { href: '/dashboard/budget', label: 'Budget', en: 'Budget', roles: ['ADMIN', 'COMPTABLE', 'REDACTEUR'] },
  { href: '/dashboard/rapports', label: 'Rapports', en: 'Reports', roles: ['ADMIN', 'REDACTEUR', 'COMPTABLE'] },
  { href: '/dashboard/utilisateurs', label: 'Utilisateurs', en: 'Users', roles: ['ADMIN'] },
  { href: '/dashboard/devises', label: 'Devises', en: 'Currencies', roles: ['ADMIN'] },
  { href: '/dashboard/audit', label: 'Audit', en: 'Audit log', roles: ['ADMIN'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLang();
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
              {t(n.label, n.en)}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/20 text-sm">
          <div className="font-medium">{user.prenom} {user.nom}</div>
          <div className="text-white/60 text-xs mb-2">{user.role}</div>
          <div className="flex gap-3">
            <Link href="/dashboard/compte" className="text-xs underline">{t('Mon compte', 'My account')}</Link>
            <button onClick={logout} className="text-xs underline">{t('Déconnexion', 'Sign out')}</button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b flex items-center px-4 md:px-6 gap-4">
          <button className="md:hidden p-2 -ml-2" onClick={() => setMenuOpen(true)} aria-label="Menu">☰</button>
          <div className="flex-1" />
          <LangSelector />
          <CurrencySelector />
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
