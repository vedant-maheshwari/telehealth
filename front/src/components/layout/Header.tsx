import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onMenuClick: () => void;
}

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/appointments': 'Appointments',
    '/messages': 'Messages',
    '/health-records': 'Health Records',
    '/vitals': 'Vitals',
    '/family': 'Family Management',
    '/analytics': 'Analytics',
    '/users': 'User Management',
    '/settings': 'Settings',
  };

  for (const [route, title] of Object.entries(routes)) {
    if (pathname.startsWith(route)) {
      return title;
    }
  }

  return 'TeleHealth';
};

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="bg-white shadow-sm border-b border-medical-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </Button>
          
          <div>
            <h1 className="text-xl font-semibold text-medical-900">
              {pageTitle}
            </h1>
            {user && (
              <p className="text-sm text-medical-500">
                Welcome back, {user.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <BellIcon className="h-6 w-6" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          <div className="text-right">
            <p className="text-sm font-medium text-medical-900">
              {user?.name}
            </p>
            <p className="text-xs text-medical-500">
              {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
            </p>
          </div>

          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-medium text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};