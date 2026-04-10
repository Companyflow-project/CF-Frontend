import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { adminRoutes } from '../routes';
import logoUrl from '/assets/Logo.svg';

export const AdminTopNav: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const switchRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('admin');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switchRef.current && !switchRef.current.contains(e.target as Node)) {
        setIsSwitchOpen(false);
      }
    };
    if (isSwitchOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSwitchOpen]);

  const navItems = [
    { path: adminRoutes.dashboard, label: t('nav.console'), enabled: true },
    { path: adminRoutes.companies, label: t('nav.companies'), enabled: true },
    { path: '/admin/crm', label: t('nav.crm'), enabled: false },
    { path: '/admin/invoices', label: t('nav.invoices'), enabled: false },
    { path: '/admin/newsletters', label: t('nav.newsletters'), enabled: false },
    { path: '/admin/support', label: t('nav.support'), enabled: false },
    { path: '/admin/help', label: t('nav.help'), enabled: false },
  ];

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const isActive = (path: string) =>
    path === adminRoutes.dashboard
      ? location.pathname === adminRoutes.dashboard
      : location.pathname.startsWith(path);

  return (
    <nav className="px-4 sm:px-6 lg:px-8 py-4 bg-black text-white">
      <div className="relative flex items-center justify-between max-w-[1600px] mx-auto">
        <Link to={adminRoutes.dashboard} className="flex items-center gap-2.5">
          <img src={logoUrl} alt="CompanyFlow" className="h-8 w-auto max-w-[160px] object-contain" />
        </Link>

        <div className="hidden lg:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
          {navItems.map((item) => (
            item.enabled ? (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'px-3 py-2 rounded-[10px] text-sm font-medium transition-colors',
                  isActive(item.path) ? '' : 'hover:opacity-80'
                )}
                style={{ background: isActive(item.path) ? 'rgba(255,255,255,0.06)' : undefined }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.path}
                className="px-3 py-2 rounded-[10px] text-sm font-medium opacity-40 cursor-not-allowed"
              >
                {item.label}
              </span>
            )
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex lg:hidden">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-transparent hover:opacity-80 text-white border-white/20"
              onClick={() => setIsMenuOpen(prev => !prev)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              {/* Switch to dropdown */}
              <div className="relative" ref={switchRef}>
                <button
                  type="button"
                  onClick={() => setIsSwitchOpen(prev => !prev)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                  title="Switch to"
                >
                  🇩🇰
                </button>
                {isSwitchOpen && (
                  <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 text-sm font-semibold text-gray-900">{t('switchTo')}</div>
                    <Link
                      to="/"
                      onClick={() => setIsSwitchOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      User Console
                    </Link>
                    <Link
                      to={adminRoutes.users}
                      onClick={() => setIsSwitchOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      People
                    </Link>
                    <Link
                      to={adminRoutes.settings}
                      onClick={() => setIsSwitchOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Settings
                    </Link>
                    <Link
                      to={adminRoutes.activity}
                      onClick={() => setIsSwitchOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Activity
                    </Link>
                  </div>
                )}
              </div>

              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-[#3d997d] text-white"
              >
                {getInitials(user.name)}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-transparent hover:opacity-80 text-sm text-white border-white/20"
                onClick={() => logout()}
              >
                Log out
              </Button>
            </div>
          )}
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden border-t border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
            {navItems.filter(i => i.enabled).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-[10px] text-sm font-medium transition-colors w-full text-left',
                  isActive(item.path) ? 'bg-white/10' : 'hover:opacity-80'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
