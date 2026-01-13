import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Briefcase, FileText, MapIcon, Shield, Settings, Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useDemoMode } from '@/demo/contexts/DemoModeContext';
import { UserRole } from '@/shared/types/business';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import { DemoToggle } from '@/demo/components/DemoToggle';
import { DemoBanner } from '@/demo/components/DemoBanner';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current: boolean;
  roles?: UserRole[];
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, hasRole } = useAuth();
  const { isDemoMode } = useDemoMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async (): Promise<void> => {
    logout();
    navigate('/login');
  };

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: Home, current: location.pathname === '/' },
    { name: 'Customers', href: '/customers', icon: Users, current: location.pathname.startsWith('/customers') },
    { name: 'Jobs', href: '/jobs', icon: Briefcase, current: location.pathname.startsWith('/jobs') && !location.pathname.startsWith('/job-logs') },
    { name: 'Job Logs', href: '/job-logs', icon: FileText, current: location.pathname.startsWith('/job-logs') },
    // Hide Route Optimizer and Audit Logs in demo mode
    ...(isDemoMode ? [] : [
      { name: 'Route Optimizer', href: '/routes', icon: MapIcon, current: location.pathname.startsWith('/routes'), roles: ['admin', 'manager', 'dispatcher'] },
      { name: 'Audit Logs', href: '/audit', icon: Shield, current: location.pathname.startsWith('/audit'), roles: ['admin', 'manager'] },
    ]),
    { name: 'User Management', href: '/users', icon: Settings, current: location.pathname.startsWith('/users'), roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.roles || hasRole(item.roles)
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile menu */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-gray-800">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white text-white text-xl font-bold"
              onClick={() => setSidebarOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="flex flex-shrink-0 items-center px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">SwiftTiger</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  item.current
                    ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                onClick={() => setSidebarOpen(false)}
              >
                {React.createElement(item.icon, { className: "mr-3 h-5 w-5" })}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">SwiftTiger</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`${
                          item.current
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                            : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-primary-300 dark:hover:bg-gray-700'
                        } group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors`}
                      >
                        {React.createElement(item.icon, { className: "h-5 w-5 shrink-0" })}
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 w-full">
          <div className="flex h-20 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 shadow-md lg:px-8">
            <div className="flex items-center gap-x-4">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white lg:hidden text-xl font-bold flex items-center justify-center w-6 h-6"
                onClick={() => setSidebarOpen(true)}
              >
<Menu className="h-6 w-6" />
              </button>
              
              {/* Page title or breadcrumb area */}
              <div className="hidden lg:flex lg:items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Field Service Management System
                </h2>
              </div>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center gap-x-4">
              {/* Demo mode toggle */}
              <DemoToggle />
              {/* Theme toggle */}
              <ThemeToggle />
              {/* User profile section */}
              <div className="flex items-center gap-x-4">
                <div className="flex items-center gap-x-3">
                  {/* User avatar */}
                  <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* User info */}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</span>
                    <div className="flex items-center gap-x-2">
                      <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                        {user?.role}
                      </span>
                      {user?.isMainAdmin && (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          Main Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-x-2 rounded-md bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <DemoBanner />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}