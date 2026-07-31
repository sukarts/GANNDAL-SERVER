'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { getUser, clearSession, type AuthUser } from '@/lib/api';
import CurrencySelector from '@/components/CurrencySelector';
import NotificationBell from '@/components/NotificationBell';
import LangSelector from '@/components/LangSelector';
import ThemeToggle from '@/components/ThemeToggle';
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
  { href: '/dashboard/finance', label: 'Finance', en: 'Finance', roles: ['ADMIN', 'COMPTABLE'] },
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
        <div className="px-4 h-14 flex items-center gap-2 border-b border-white/15">
          <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-sm font-bold">G</span>
          <span className="text-lg font-semibold tracking-tight">GANNDAL</span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-auto">
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => {
            const actif = n.href === '/dashboard' ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  actif ? 'bg-white/15 font-medium' : 'text-white/85 hover:bg-white/10'
                }`}
              >
                {t(n.label, n.en)}
              </Link>
            );
          })}
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
        <header className="h-14 bg-surface border-b border-line flex items-center px-4 md:px-6 gap-3">
          <button className="md:hidden p-2 -ml-2 text-muted hover:text-content" onClick={() => setMenuOpen(true)} aria-label="Menu"><Menu size={20} /></button>
          <div className="flex-1" />
          <LangSelector />
          <CurrencySelector />
          <ThemeToggle />
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
