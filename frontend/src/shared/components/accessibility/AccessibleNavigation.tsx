import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Briefcase, 
  MapPin, 
  FileText, 
  Settings, 
  Menu, 
  X,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useFocusManagement } from '@/shared/hooks/useFocusManagement';
import { useScreenReaderAnnouncements } from './ScreenReaderAnnouncements';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  children?: NavigationItem[];
}

interface AccessibleNavigationProps {
  user?: {
    name: string;
    role: string;
  };
  onLogout?: () => void;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="w-5 h-5" />,
    description: 'View overview and analytics'
  },
  {
    id: 'jobs',
    label: 'Jobs',
    href: '/jobs',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Manage service jobs and assignments'
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/customers',
    icon: <Users className="w-5 h-5" />,
    description: 'Customer information and contacts'
  },
  {
    id: 'routes',
    label: 'Routes',
    href: '/routes',
    icon: <MapPin className="w-5 h-5" />,
    description: 'Plan and optimize service routes'
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/reports',
    icon: <FileText className="w-5 h-5" />,
    description: 'Generate and view reports'
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
    description: 'Application settings and preferences'
  }
];

export function AccessibleNavigation({ user, onLogout }: AccessibleNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { setupFocusTrap, removeFocusTrap } = useFocusManagement();
  const { announce } = useScreenReaderAnnouncements();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Setup focus trap for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen && mobileMenuRef.current) {
      const cleanup = setupFocusTrap(mobileMenuRef.current);
      return cleanup;
    } else {
      removeFocusTrap();
    }
  }, [isMobileMenuOpen, setupFocusTrap, removeFocusTrap]);

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    announce(newState ? 'Navigation menu opened' : 'Navigation menu closed');
  };

  const toggleSubmenu = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const NavigationLink: React.FC<{ item: NavigationItem; isMobile?: boolean }> = ({ 
    item, 
    isMobile = false 
  }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.href);
    const isExpanded = expandedItems.includes(item.id);

    if (hasChildren) {
      return (
        <div className="relative">
          <button
            onClick={() => toggleSubmenu(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors group ${
              isMobile ? 'text-base' : 'text-sm'
            } ${
              isItemActive
                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-expanded={isExpanded}
            aria-controls={`submenu-${item.id}`}
            aria-describedby={item.description ? `desc-${item.id}` : undefined}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <ChevronDown 
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {item.description && (
            <div id={`desc-${item.id}`} className="sr-only">
              {item.description}
            </div>
          )}

          {isExpanded && (
            <div id={`submenu-${item.id}`} className="ml-6 mt-1 space-y-1" role="group">
              {item.children?.map((child) => (
                <NavigationLink key={child.id} item={child} isMobile={isMobile} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        to={item.href}
        className={({ isActive }) => `
          flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group ${
            isMobile ? 'text-base' : 'text-sm'
          } ${
            isActive
              ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
          }
        `}
        aria-describedby={item.description ? `desc-${item.id}` : undefined}
        aria-current={isItemActive ? 'page' : undefined}
      >
        {item.icon}
        <span>{item.label}</span>
        {item.description && (
          <div id={`desc-${item.id}`} className="sr-only">
            {item.description}
          </div>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <nav 
        className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex-1 flex flex-col p-6">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              SwiftTiger
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Field Service Management
            </p>
          </div>

          {/* Navigation Items */}
          <div className="space-y-1 flex-1">
            {navigationItems.map((item) => (
              <NavigationLink key={item.id} item={item} />
            ))}
          </div>

          {/* User Section */}
          {user && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.role}
                  </p>
                </div>
              </div>
              
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Sign out of your account"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black opacity-50"
            onClick={toggleMobileMenu}
            aria-hidden="true"
          />

          {/* Mobile Menu */}
          <div
            ref={mobileMenuRef}
            id="mobile-navigation"
            className="relative flex flex-col w-full max-w-sm bg-white dark:bg-gray-800"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex-1 flex flex-col p-6 pt-16">
              {/* Logo/Brand */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  SwiftTiger
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Field Service Management
                </p>
              </div>

              {/* Navigation Items */}
              <div className="space-y-2 flex-1">
                {navigationItems.map((item) => (
                  <NavigationLink key={item.id} item={item} isMobile />
                ))}
              </div>

              {/* User Section */}
              {user && (
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-900 dark:text-blue-100">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.role}
                      </p>
                    </div>
                  </div>
                  
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center space-x-3 px-3 py-3 text-base text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      aria-label="Sign out of your account"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}