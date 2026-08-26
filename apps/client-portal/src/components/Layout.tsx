import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Topbar, not sidebar — matches the client-view Figma frame exactly (plan
// Context section: the client portal is deliberately a different visual
// language from the staff ops-portal, read-only by construction).
export function Layout() {
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-page)' }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header
        style={{
          background: 'var(--color-navy-950)',
          color: 'var(--color-text-on-dark)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.9rem 2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-action-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>W</div>
          <div>
            <div style={{ fontWeight: 700 }}>Wing Kai Recycle</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>ESG Client Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div role="group" aria-label="Language" style={{ display: 'flex', gap: '0.35rem' }}>
            {(['en', 'zh-HK'] as const).map((lng) => (
              <button
                key={lng}
                type="button"
                aria-pressed={i18n.language === lng}
                onClick={() => i18n.changeLanguage(lng)}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: 4, border: 'none', cursor: 'pointer', background: i18n.language === lng ? 'var(--color-action-green)' : 'var(--color-navy-700)', color: 'var(--color-text-on-dark)' }}
              >
                {lng === 'en' ? 'EN' : '繁'}
              </button>
            ))}
          </div>
          <span>{user?.displayName}</span>
          <button
            type="button"
            onClick={logout}
            style={{ background: 'var(--color-navy-700)', color: 'inherit', border: 'none', borderRadius: 4, padding: '0.4rem 0.9rem', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </header>
      <main id="main-content" style={{ padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
