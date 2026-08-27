import { LayoutDashboard, Layers, Database, FileText, Cog } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@esg/ui';
import { useAuth } from '../auth/AuthContext';

// Sidebar matches the dashboard-overview/work-order-mes Figma frames
// exactly (plan Context section) — same icon set (lucide-react, confirmed
// against the Figma file's own icon names), same navy palette.
const NAV_ITEMS = [
  { to: '/dashboard', key: 'dashboard' as const, icon: LayoutDashboard },
  { to: '/work-orders', key: 'workOrders' as const, icon: Layers },
  { to: '/data-collection', key: 'dataCollection' as const, icon: Database },
  { to: '/reports', key: 'reports' as const, icon: FileText },
  // Settings is Auditor-only in practice (SettingsPage itself also gates
  // on role — this hides the nav item too, not just the page content).
  { to: '/settings', key: 'settings' as const, icon: Cog, auditorOnly: true },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isAuditor = user?.memberships.some((m) => m.role === 'AUDITOR') ?? false;
  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'HK';

  return (
    <div className="flex min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <nav
        aria-label="Main navigation"
        className="flex w-[240px] shrink-0 flex-col bg-[#0a1628] py-8 text-white"
      >
        <div className="flex flex-col gap-1.5 px-6 pb-8">
          <span className="text-xl font-bold">Wing Kai Recycle</span>
          <span className="text-xs font-medium text-white/70">{t('appName')}</span>
        </div>
        <ul className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.filter((item) => !item.auditorOnly || isAuditor).map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 border-l-4 px-[22px] py-3 text-sm transition-colors ${
                      isActive
                        ? 'border-[#00a878] bg-[#10233d] font-semibold text-white'
                        : // text-[#748297] (mutedOnDark), not the raw Figma
                          // #64748b — that measures 3.81:1 against this navy
                          // background, below the 4.5:1 AA minimum (found by
                          // the automated axe pass, see tokens.ts).
                          'border-transparent font-normal text-[#748297] hover:bg-[#10233d]/50 hover:text-white'
                    }`
                  }
                >
                  <Icon className="size-[18px]" aria-hidden="true" />
                  {t(`nav.${item.key}`)}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="px-6 pb-4">
          <span id="lang-switch-label" className="mb-1.5 block text-[11px] text-white/60">
            Language / 語言
          </span>
          <div role="group" aria-labelledby="lang-switch-label" className="flex gap-1.5">
            {(['en', 'zh-HK'] as const).map((lng) => (
              <button
                key={lng}
                type="button"
                aria-pressed={i18n.language === lng}
                onClick={() => i18n.changeLanguage(lng)}
                className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
                  i18n.language === lng ? 'bg-[#008660] text-white' : 'bg-[#1b355a] text-white/80'
                }`}
              >
                {lng === 'en' ? 'English' : '繁中'}
              </button>
            ))}
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3 border-t border-[#10233d] px-6 pt-4">
            <Avatar className="size-9 bg-[#1b355a]">
              <AvatarFallback className="bg-[#1b355a] text-sm font-semibold text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{user.displayName}</p>
              <p className="truncate text-[11px] text-white/70">{user.memberships[0]?.role ?? ''}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="shrink-0 rounded bg-[#1b355a] px-3 py-1.5 text-xs font-medium hover:bg-[#22436e]"
            >
              Log out
            </button>
          </div>
        )}
      </nav>
      <main id="main-content" className="flex-1 bg-[#f4f6f9] p-8">
        <Outlet />
      </main>
    </div>
  );
}
