import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { cn, getRoleColor } from '@/lib/utils';
import {
  HomeIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: ('patient' | 'doctor' | 'family' | 'admin')[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    roles: ['patient', 'doctor', 'family', 'admin'],
  },
  {
    name: 'Appointments',
    href: '/appointments',
    icon: CalendarIcon,
    roles: ['patient', 'doctor', 'family'],
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: ChatBubbleLeftRightIcon,
    roles: ['patient', 'doctor', 'family'],
  },
  {
    name: 'Health Records',
    href: '/health-records',
    icon: ClipboardDocumentListIcon,
    roles: ['patient', 'doctor', 'family'],
  },
  {
    name: 'Vitals',
    href: '/vitals',
    icon: HeartIcon,
    roles: ['patient', 'doctor'],
  },
  {
    name: 'Family',
    href: '/family',
    icon: UserGroupIcon,
    roles: ['patient', 'family'],
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    roles: ['doctor', 'admin'],
  },
  {
    name: 'Users',
    href: '/users',
    icon: UsersIcon,
    roles: ['admin'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    roles: ['patient', 'doctor', 'family', 'admin'],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavigation = navigation.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-medical-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 bg-primary-600">
            <h1 className="text-xl font-bold text-white">TeleHealth</h1>
            <button
              onClick={onClose}
              className="lg:hidden text-white hover:text-medical-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-6 border-b border-medical-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-medical-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-medical-500 truncate">{user.email}</p>
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                    getRoleColor(user.role)
                  )}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-medical-600 hover:bg-medical-50 hover:text-medical-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-primary-700' : 'text-medical-400'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-medical-200">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-3 py-2 text-sm font-medium text-medical-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0 text-medical-400 group-hover:text-red-700" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};