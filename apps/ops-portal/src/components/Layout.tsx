import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Sidebar structure matches the dashboard-overview/work-order-mes Figma
// frames (plan Context section) — Dashboard/Work Orders/Data
// Collection/Reports/Settings, all real screens as of Phase 5.
const NAV_ITEMS = [
  { to: '/dashboard', key: 'dashboard' as const },
  { to: '/work-orders', key: 'workOrders' as const },
  { to: '/data-collection', key: 'dataCollection' as const },
  { to: '/reports', key: 'reports' as const },
  // Settings is Auditor-only in practice (SettingsPage itself also gates
  // on role — this hides the nav item too, not just the page content).
  { to: '/settings', key: 'settings' as const, auditorOnly: true },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isAuditor = user?.memberships.some((m) => m.role === 'AUDITOR') ?? false;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <nav
        aria-label="Main navigation"
        style={{
          width: 240,
          flexShrink: 0,
          background: 'var(--color-navy-950)',
          color: 'var(--color-text-on-dark)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 0',
        }}
      >
        <div style={{ padding: '0 1.25rem 1.5rem' }}>
          <strong style={{ fontSize: '1.1rem' }}>Wing Kai Recycle</strong>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{t('appName')}</div>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1 }}>
          {NAV_ITEMS.filter((item) => !item.auditorOnly || isAuditor).map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '0.75rem 1.25rem',
                  color: 'inherit',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'var(--color-navy-800)' : 'transparent',
                })}
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            </li>
          ))}
        </ul>

        <div style={{ padding: '0 1.25rem 1rem' }}>
          <span id="lang-switch-label" style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7, marginBottom: '0.35rem' }}>
            Language / 語言
          </span>
          <div role="group" aria-labelledby="lang-switch-label" style={{ display: 'flex', gap: '0.4rem' }}>
            {(['en', 'zh-HK'] as const).map((lng) => (
              <button
                key={lng}
                type="button"
                aria-pressed={i18n.language === lng}
                onClick={() => i18n.changeLanguage(lng)}
                style={{
                  flex: 1,
                  padding: '0.3rem',
                  fontSize: '0.75rem',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: i18n.language === lng ? 'var(--color-action-green)' : 'var(--color-navy-700)',
                  color: 'var(--color-text-on-dark)',
                }}
              >
                {lng === 'en' ? 'English' : '繁中'}
              </button>
            ))}
          </div>
        </div>

        {user && (
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-navy-800)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.displayName}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.5rem' }}>
              {user.memberships[0]?.role ?? ''}
            </div>
            <button
              type="button"
              onClick={logout}
              style={{
                background: 'var(--color-navy-700)',
                color: 'inherit',
                border: 'none',
                borderRadius: 4,
                padding: '0.4rem 0.75rem',
                cursor: 'pointer',
              }}
            >
              Log out
            </button>
          </div>
        )}
      </nav>
      <main id="main-content" style={{ flex: 1, padding: '2rem', background: 'var(--color-surface-page)' }}>
        <Outlet />
      </main>
    </div>
  );
}
