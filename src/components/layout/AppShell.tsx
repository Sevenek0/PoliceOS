import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useOfficerProfile } from '../../store/useOfficerProfile';
import { useDiscordAuth } from '../../store/useDiscordAuth';
import { useDocumentHistory } from '../../store/useDocumentHistory';
import { getAtlasById } from '../../data/atlases';
import { GENERATORS } from '../../data/generators';
import { CALCULATORS } from '../../data/calculators';

function resolveTitle(pathname: string): string {
  if (pathname === '/panel') return 'Pulpit';
  if (pathname.startsWith('/panel/atlasy/')) {
    const id = pathname.split('/')[3];
    return getAtlasById(id)?.title ?? 'Baza wiedzy';
  }
  if (pathname.startsWith('/panel/generatory/')) {
    const id = pathname.split('/')[3];
    return GENERATORS.find((g) => g.id === id)?.title ?? 'Generator';
  }
  if (pathname.startsWith('/panel/kalkulatory/')) {
    const id = pathname.split('/')[3];
    return CALCULATORS.find((c) => c.id === id)?.title ?? 'Kalkulator';
  }
  if (pathname.startsWith('/panel/ustawienia')) return 'Ustawienia';
  if (pathname.startsWith('/panel/dokumenty')) return 'Moje dokumenty';
  if (pathname.startsWith('/panel/serwery')) return 'Serwery';
  return 'PoliceOS';
}

export function AppShell() {
  const location = useLocation();
  const onboarded = useOfficerProfile((s) => s.onboarded);
  const discordUser = useDiscordAuth((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Pull the account's documents from the server (and push anything saved offline).
  const discordUserId = discordUser?.id;
  useEffect(() => {
    if (discordUserId) void useDocumentHistory.getState().sync();
  }, [discordUserId]);

  if (!onboarded || !discordUser) return <Navigate to="/start" replace />;

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-bg text-ink font-sans">
      <div className="hidden md:block h-full">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col h-full">
        <Topbar title={resolveTitle(location.pathname)} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
