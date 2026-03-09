import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import logoUrl from '/assets/Logo.svg';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Console' },
    { path: '/employees', label: 'Employees' },
    { path: '/handbook', label: 'Manage Handbook' },
    { path: '/contacts', label: 'Contacts' },
    { path: '/account', label: 'Account' },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="bg-black text-white px-4 sm:px-6 lg:px-8 py-4">
      <div className="relative flex items-center justify-between max-w-[1360px] mx-auto">
        <Link to="/" className="flex items-center">
          <img
            src={logoUrl}
            alt="CompanyFlow"
            className="h-6 w-auto"
          />
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
                      ? 'text-white'
                      : 'text-white hover:bg-white/5'
                  )}
                  style={isActive ? { background: 'rgba(255, 255, 255, 0.06)' } : undefined}
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
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-sm font-medium text-white">
                {getInitials(user.name)}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/20 bg-transparent text-white hover:bg-white/10 text-sm"
                onClick={() => logout()}
              >
                Log ud
              </Button>
            </div>
          )}
        </div>
      </div>
      {isMenuOpen && (
        <div className="lg:hidden border-t border-white/10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
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
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white hover:bg-white/5'
                  )}
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

