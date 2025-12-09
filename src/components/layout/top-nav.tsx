import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

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
    <nav className="bg-black text-white px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="flex items-center">
          <img 
            src="/assets/Logo.svg" 
            alt="CompanyFlow" 
            className="h-6 w-auto"
          />
        </Link>
        <div className="flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
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
        <div className="flex items-center">
          {user && (
            <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-sm font-medium text-white">
              {getInitials(user.name)}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

