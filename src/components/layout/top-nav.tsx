import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks';
import { cn, isAdminRole } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, Lock } from 'lucide-react';
import { useViewAsEmployee } from '@/context/view-as-employee-context';
import logoUrl from '/assets/Logo.svg';

/** All languages that can be purchased as add-ons. */
const ALL_LANGUAGES: readonly { code: string; label: string; flag: string; isDefault?: boolean }[] = [
  { code: 'da', label: 'Danish', flag: '🇩🇰', isDefault: true },
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
  { code: 'en-uk', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
];

interface TopNavProps {
  companyLogoUrl?: string | null;
  companyName?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ companyLogoUrl, companyName }) => {
  const location = useLocation();
  const { user, logout, updateLanguage } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const switchRef = useRef<HTMLDivElement>(null);
  const { viewAsEmployee } = useViewAsEmployee();
  const { t, i18n } = useTranslation('common');
  const isAdmin = isAdminRole(user?.role);
  const isSenior = user?.role === 'senior_employee';
  const rawLangs = user?.employeeLanguages ?? ['da'];
  const employeeLanguages = rawLangs.includes('da') ? rawLangs : ['da', ...rawLangs];
  const currentLang = i18n.language || 'da';
  const currentFlag = ALL_LANGUAGES.find(l => l.code === currentLang)?.flag ?? '🇩🇰';
  const showEmployeeView = (!isAdmin && !isSenior) || viewAsEmployee;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (switchRef.current && !switchRef.current.contains(e.target as Node)) {
        setIsSwitchOpen(false);
      }
    };
    if (isLangOpen || isSwitchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangOpen, isSwitchOpen]);

  const getNavItems = () => {
    if (showEmployeeView) {
      return [{ path: '/', label: t('nav.console') }];
    }
    if (isSenior) {
      return [
        { path: '/', label: t('nav.console') },
        { path: '/handbook', label: t('nav.manageHandbook') },
      ];
    }
    // administrator / company_admin — full nav
    return [
      { path: '/', label: t('nav.console') },
      { path: '/employees', label: t('nav.employees') },
      { path: '/handbook', label: t('nav.manageHandbook') },
      { path: '/contacts', label: t('nav.contacts') },
      { path: '/account', label: t('nav.account') },
    ];
  };

  const navItems = getNavItems();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="px-4 sm:px-6 lg:px-8 py-4" style={{ backgroundColor: 'var(--cf-nav-bg, #000000)', color: 'var(--cf-nav-text, #ffffff)' }}>
      <div className="relative flex items-center justify-between max-w-[1600px] mx-auto">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={companyLogoUrl || logoUrl}
            alt={companyName || 'CompanyFlow'}
            className="h-8 w-auto max-w-[160px] object-contain"
          />
          {companyName && (
            <span className="text-sm font-semibold truncate max-w-[180px]" style={{ color: 'inherit' }}>
              {companyName}
            </span>
          )}
        </Link>
        <div className="hidden lg:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/' && location.pathname === '/') ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-3 py-2 rounded-[10px] text-sm font-medium transition-colors',
                    isActive
                      ? ''
                      : 'hover:opacity-80'
                  )}
                  style={{ color: 'inherit', background: isActive ? 'rgba(255, 255, 255, 0.06)' : undefined }}
                >
                  {item.label}
                </Link>
              );
          })}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex lg:hidden">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-transparent hover:opacity-80"
              style={{ color: 'inherit', border: '1px solid rgba(255,255,255,0.2)' }}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              {/* Language switcher dropdown */}
              <div className="relative hidden sm:block" ref={langRef}>
                <button
                  type="button"
                  onClick={() => setIsLangOpen(prev => !prev)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'inherit' }}
                  title={t('nav.language', 'Language')}
                >
                  {currentFlag}
                </button>
                {isLangOpen && (
                  <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
                    {ALL_LANGUAGES.map((lang) => {
                      const isEnabled = employeeLanguages.includes(lang.code);
                      const isActive = currentLang === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          disabled={!isEnabled}
                          onClick={() => {
                            if (isEnabled) {
                              updateLanguage(lang.code);
                              setIsLangOpen(false);
                            }
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left',
                            isEnabled && isActive && 'bg-gray-50 font-medium text-gray-900',
                            isEnabled && !isActive && 'text-gray-700 hover:bg-gray-50',
                            !isEnabled && 'text-gray-400 cursor-not-allowed'
                          )}
                        >
                          <span className="text-lg leading-none">{lang.flag}</span>
                          <span className="flex-1">
                            {lang.label}
                            {lang.isDefault && isEnabled && (
                              <span className="text-gray-400 text-xs ml-1">(default)</span>
                            )}
                          </span>
                          {!isEnabled && (
                            <Lock className="h-3.5 w-3.5 text-gray-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {user.role === 'administrator' ? (
                <div className="relative" ref={switchRef}>
                  <button
                    type="button"
                    onClick={() => setIsSwitchOpen((prev) => !prev)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                    title={t('nav.switchTo', 'Switch to')}
                    aria-haspopup="menu"
                    aria-expanded={isSwitchOpen}
                  >
                    {getInitials(user.name)}
                  </button>
                  {isSwitchOpen && (
                    <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 text-sm font-semibold text-gray-900">
                        {t('nav.switchTo', 'Switch to')}
                      </div>
                      <Link
                        to="/admin"
                        onClick={() => setIsSwitchOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {t('nav.adminAccount', 'Admin Account')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setIsSwitchOpen(false); logout(); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {t('logOut')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}>
                    {getInitials(user.name)}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-transparent hover:opacity-80 text-sm"
                    style={{ color: 'inherit', border: '1px solid rgba(255,255,255,0.2)' }}
                    onClick={() => logout()}
                  >
                    {t('logOut')}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {isMenuOpen && (
        <div className="lg:hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path === '/' && location.pathname === '/') ||
                (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'px-3 py-2 rounded-[10px] text-sm font-medium transition-colors w-full text-left',
                    isActive ? 'opacity-100' : 'hover:opacity-80'
                  )}
                  style={{ color: 'inherit', background: isActive ? 'rgba(255,255,255,0.1)' : undefined }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};
