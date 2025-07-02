import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useResponsiveContext } from '../../../shared/components/ResponsiveProvider';

/**
 * Customer Portal Header
 * Simplified navigation for customer interface
 */

const CustomerHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { responsive } = useResponsiveContext();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/jobs':
        return 'My Jobs';
      case '/new-request':
        return 'New Service Request';
      case '/profile':
        return 'My Profile';
      case '/support':
        return 'Support';
      default:
        if (path.startsWith('/jobs/')) {
          return 'Job Details';
        }
        return 'SwiftTiger';
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const UserMenu = () => (
    <div className="relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-st-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-st-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user?.name?.charAt(0).toUpperCase() || 'C'}
        </div>
        {!responsive.isMobile && (
          <>
            <span className="text-sm font-medium text-st-text-primary">
              {user?.name || 'Customer'}
            </span>
            <svg className="w-4 h-4 text-st-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {showUserMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowUserMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-st-border-primary z-20">
            <div className="p-3 border-b border-st-border-primary">
              <p className="text-sm font-medium text-st-text-primary">{user?.name}</p>
              <p className="text-xs text-st-text-secondary">{user?.email}</p>
            </div>
            
            <div className="py-1">
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowUserMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-st-text-primary hover:bg-st-gray-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>My Profile</span>
              </button>
              
              <button
                onClick={() => {
                  navigate('/support');
                  setShowUserMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-st-text-primary hover:bg-st-gray-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Support</span>
              </button>
              
              <hr className="my-1" />
              
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-left text-sm text-st-error-600 hover:bg-st-error-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const NavigationMenu = () => {
    if (responsive.isMobile) return null;
    
    return (
      <nav className="flex items-center space-x-1">
        <Button
          variant={location.pathname === '/dashboard' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </Button>
        
        <Button
          variant={location.pathname === '/jobs' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => navigate('/jobs')}
        >
          My Jobs
        </Button>
        
        <Button
          variant={location.pathname === '/new-request' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => navigate('/new-request')}
        >
          New Request
        </Button>
      </nav>
    );
  };

  const leftContent = responsive.isMobile ? (
    <button
      onClick={() => navigate('/dashboard')}
      className="flex items-center space-x-2"
    >
      <div className="w-8 h-8 bg-st-primary-500 rounded-lg flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>
      <span className="font-semibold text-st-text-primary">SwiftTiger</span>
    </button>
  ) : (
    <div className="flex items-center space-x-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center space-x-2"
      >
        <div className="w-8 h-8 bg-st-primary-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <span className="font-semibold text-st-text-primary">SwiftTiger</span>
      </button>
      
      <NavigationMenu />
    </div>
  );

  const rightContent = (
    <div className="flex items-center space-x-3">
      {responsive.isMobile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/new-request')}
          className="p-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      )}
      
      <UserMenu />
    </div>
  );

  return (
    <Header
      title={responsive.isMobile ? getPageTitle() : undefined}
      leftContent={leftContent}
      rightContent={rightContent}
      showNotifications={true}
      variant={responsive.isMobile ? 'mobile' : 'desktop'}
    />
  );
};

export default CustomerHeader;