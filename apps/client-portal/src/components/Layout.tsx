import { LogOut } from 'lucide-react';
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
    <div className="min-h-screen bg-[#f4f6f9]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="flex items-center justify-between bg-[#0a1628] px-12 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md bg-[#00a878] text-lg font-black">H</div>
          <div>
            <div className="text-lg font-bold">Hong Kong Recycling Co</div>
            <div className="text-[10px] opacity-80">ESG Client Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div role="group" aria-label="Language" className="flex gap-1.5">
            {(['en', 'zh-HK'] as const).map((lng) => (
              <button
                key={lng}
                type="button"
                aria-pressed={i18n.language === lng}
                onClick={() => i18n.changeLanguage(lng)}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  i18n.language === lng ? 'bg-[#008660] text-white' : 'bg-[#1b355a] text-white/80'
                }`}
              >
                {lng === 'en' ? 'EN' : '繁'}
              </button>
            ))}
          </div>
          <span className="text-sm">{user?.displayName}</span>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-md bg-[#1b355a] px-4 py-2 text-sm font-semibold hover:bg-[#22436e]"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Logout
          </button>
        </div>
      </header>
      <main id="main-content" className="p-8">
        <Outlet />
      </main>
    </div>
  );
}
