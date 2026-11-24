import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PageRoute } from '../types';
import { useAuth } from '../context/AuthContext';
import { SageLogoMark } from './WhimsyAccents';

interface NavbarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
}

const NAV_ITEMS: Array<{ id: PageRoute; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'explainer', label: 'Explainer' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'chat', label: 'Chat' },
  { id: 'history', label: 'History' },
];

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: PageRoute) => {
    setMobileOpen(false);
    onNavigate(page);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E2DA] bg-[#FFFFFF]/95 backdrop-blur-sm shadow-[0_2px_12px_-4px_rgba(47,59,52,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="group inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-[#2F3B34] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9A83] rounded-xl cursor-pointer"
        >
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#E6E1F5]/75 border border-[#E7E2DA] group-hover:rotate-6 transition-transform duration-300">
            <SageLogoMark className="w-5 h-5" />
          </span>
          <span>SyntaxSage</span>
        </button>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9A83] ${
                  active
                    ? 'bg-[#E6E1F5] text-[#2F3B34] font-semibold'
                    : 'text-[#6B7280] hover:text-[#2F3B34] hover:bg-[#FAF7F2]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => handleNav('profile')}
              className="hidden md:inline-flex items-center px-4 py-2 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] transition-all whitespace-nowrap shrink-0 max-w-[180px] truncate shadow-[0_4px_14px_-4px_rgba(95,127,104,0.35)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9A83]"
            >
              {user?.name || 'Profile'}
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleNav('login')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-[#2F3B34] hover:bg-[#FAF7F2] border border-[#E7E2DA] transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => handleNav('signup')}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-xl bg-[#5F7F68] text-[#FFFFFF] hover:bg-[#506C58] transition-all whitespace-nowrap shrink-0 shadow-[0_4px_14px_-4px_rgba(95,127,104,0.35)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9A83]"
              >
                Get Started
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl text-[#2F3B34] hover:bg-[#FAF7F2] border border-transparent hover:border-[#E7E2DA] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#E7E2DA] bg-[#FFFFFF] px-4 py-3 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#E6E1F5] text-[#2F3B34] font-semibold'
                    : 'text-[#6B7280] hover:bg-[#FAF7F2] hover:text-[#2F3B34]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-[#E7E2DA] flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => handleNav('profile')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-[#5F7F68] text-[#FFFFFF] cursor-pointer"
              >
                Profile ({user?.name})
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('login')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium border border-[#E7E2DA] text-[#2F3B34] cursor-pointer"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('signup')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-[#5F7F68] text-[#FFFFFF] cursor-pointer"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
