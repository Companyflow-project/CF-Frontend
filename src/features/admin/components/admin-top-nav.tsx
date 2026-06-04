import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, Lock } from 'lucide-react';
import { adminRoutes } from '../routes';
import { resolveRbacRole, can, canAccessAccountDashboard, type RbacModule } from '@/lib/rbac';
import { ChangeUserViewDialog } from './change-user-view-dialog';
import logoUrl from '/assets/Logo.svg';

const ALL_LANGUAGES: readonly { code: string; label: string; flag: string; isDefault?: boolean }[] = [
  { code: 'da', label: 'Danish', flag: '🇩🇰', isDefault: true },
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
  { code: 'en-uk', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
];

export const AdminTopNav: React.FC = () => {
  const location = useLocation();
  const { user, logout, updateLanguage } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isChangeViewOpen, setIsChangeViewOpen] = useState(false);
  const switchRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation('admin');

  const rawLangs = user?.employeeLanguages ?? ['da'];
  const employeeLanguages = rawLangs.includes('da') ? rawLangs : ['da', ...rawLangs];
  const currentLang = i18n.language || 'da';
  const currentFlag = ALL_LANGUAGES.find(l => l.code === currentLang)?.flag ?? '🇩🇰';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switchRef.current && !switchRef.current.contains(e.target as Node)) {
        setIsSwitchOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    if (isSwitchOpen || isLangOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSwitchOpen, isLangOpen]);

  const viewerRole = resolveRbacRole(user?.role);
  const allNavItems: { path: string; label: string; enabled: boolean; module?: RbacModule }[] = [
    { path: adminRoutes.dashboard, label: t('nav.console'), enabled: true, module: 'dashboard' },
    { path: adminRoutes.companies, label: t('nav.companies'), enabled: true, module: 'companies' },
    { path: adminRoutes.crm, label: t('nav.crm'), enabled: true, module: 'crm' },
    { path: adminRoutes.crmActivities, label: t('nav.todo', 'TO DO'), enabled: true, module: 'crm' },
    { path: adminRoutes.invoices, label: t('nav.invoices'), enabled: true, module: 'invoices' },
    { path: adminRoutes.newsletters, label: t('nav.newsletters'), enabled: true, module: 'newsletters' },
    { path: adminRoutes.tickets, label: t('nav.support'), enabled: true, module: 'tickets' },
  ];
  const navItems = allNavItems.filter((item) => !item.module || can(viewerRole, item.module, 'read'));

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const isActive = (path: string) => {
    // Dashboard and CRM hub need exact-match (or `startsWith` would swallow nested routes
    // — e.g. `/admin/crm/activities` would activate BOTH CRM and TO DO).
    if (path === adminRoutes.dashboard) return location.pathname === adminRoutes.dashboard;
    if (path === adminRoutes.crm) {
      return location.pathname === adminRoutes.crm
        || (location.pathname.startsWith(adminRoutes.crm + '/')
            && !location.pathname.startsWith(adminRoutes.crmActivities));
    }
    return location.pathname.startsWith(path);
  };

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
              {/* Language switcher */}
              <div className="relative" ref={langRef}>
                <button
                  type="button"
                  onClick={() => setIsLangOpen(prev => !prev)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
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
                            !isEnabled && 'text-gray-400 cursor-not-allowed',
                          )}
                        >
                          <span className="text-lg leading-none">{lang.flag}</span>
                          <span className="flex-1">
                            {lang.label}
                            {lang.isDefault && isEnabled && (
                              <span className="text-gray-400 text-xs ml-1">(default)</span>
                            )}
                          </span>
                          {!isEnabled && <Lock className="h-3.5 w-3.5 text-gray-300" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Switch to dropdown — on avatar */}
              <div className="relative" ref={switchRef}>
                <button
                  type="button"
                  onClick={() => setIsSwitchOpen(prev => !prev)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-[#3d997d] text-white hover:opacity-80 transition-opacity"
                  title={t('switchTo', 'Switch to')}
                >
                  {getInitials(user.name)}
                </button>
                {isSwitchOpen && (
                  <div className="absolute right-0 top-12 w-60 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 text-sm font-semibold text-gray-900">{t('switchTo', 'Switch to')}</div>
                    <Link
                      to="/"
                      onClick={() => setIsSwitchOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t('nav.userAccount', 'User Console')}
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => { setIsSwitchOpen(false); setIsChangeViewOpen(true); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t('nav.changeUserView', 'Change user view')}
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <Link
                      to={adminRoutes.books}
                      onClick={() => setIsSwitchOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t('nav.books', 'Books')}
                    </Link>
                    <Link
                      to={adminRoutes.taxonomy}
                      onClick={() => setIsSwitchOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t('nav.taxonomy', 'Taxonomy')}
                    </Link>
                    <Link
                      to={adminRoutes.settings}
                      onClick={() => setIsSwitchOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t('nav.settings', 'Settings')}
                    </Link>
                    <Link
                      to={adminRoutes.users}
                      onClick={() => setIsSwitchOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t('nav.people', 'People')}
                    </Link>
                    {canAccessAccountDashboard(viewerRole) && (
                      <Link
                        to={adminRoutes.accountDashboard}
                        onClick={() => setIsSwitchOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {user.role === 'administrator'
                          ? t('nav.superadmin', 'Superadmin')
                          : t('nav.admin', 'Admin')}
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => { setIsSwitchOpen(false); logout(); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t('nav.logout', 'Log out')}
                    </button>
                  </div>
                )}
              </div>
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

      {isChangeViewOpen && (
        <ChangeUserViewDialog
          open={isChangeViewOpen}
          onClose={() => setIsChangeViewOpen(false)}
        />
      )}
    </nav>
  );
};
