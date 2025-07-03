import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Shared components
import { MobileHeader, MobileCard, MobileListItem, MobileActionSheet } from '../../shared/components/MobileLayout';
import { useNotifications } from '../../shared/components/NotificationHub';

// Local components and contexts
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useOffline } from '../contexts/OfflineContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, apiRequest, updateUser } = useAuth();
  const { isTracking, stopTracking, clearLocationHistory } = useLocation();
  const { clearPendingActions, getOfflineStats } = useOffline();
  const { showSuccess, showError, showInfo } = useNotifications();
  const queryClient = useQueryClient();
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Password change mutation
  const passwordMutation = useMutation({
    mutationFn: async (passwords) => {
      const response = await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(passwords),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      return response.json();
    },
    onSuccess: () => {
      showSuccess('Password Changed', 'Your password has been updated successfully');
      setShowPasswordChange(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      showError('Password Change Failed', error.message);
    },
  });

  const handlePasswordChange = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showError('Invalid Input', 'Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Password Mismatch', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showError('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    passwordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleLogout = async () => {
    try {
      if (isTracking) {
        stopTracking();
      }
      
      clearLocationHistory();
      queryClient.clear();
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearOfflineData = () => {
    clearPendingActions();
    clearLocationHistory();
    queryClient.clear();
    showSuccess('Data Cleared', 'All offline data has been cleared');
  };

  const offlineStats = getOfflineStats();

  const profileSections = [
    {
      title: 'Account Information',
      items: [
        {
          label: 'Name',
          value: user?.name || 'Unknown',
          icon: '👤',
        },
        {
          label: 'Email',
          value: user?.email || 'No email',
          icon: '📧',
        },
        {
          label: 'Role',
          value: user?.role || 'Unknown',
          icon: '🔧',
        },
        {
          label: 'Employee ID',
          value: user?.employee_id || 'Not set',
          icon: '🆔',
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          label: 'Change Password',
          action: () => setShowPasswordChange(true),
          icon: '🔒',
          showArrow: true,
        },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          label: 'Location Tracking',
          value: isTracking ? 'Enabled' : 'Disabled',
          icon: '📍',
          action: () => navigate('/'),
        },
        {
          label: 'Offline Data',
          value: `${offlineStats.totalPending} pending items`,
          icon: '💾',
          action: offlineStats.totalPending > 0 ? clearOfflineData : null,
        },
      ],
    },
    {
      title: 'App Information',
      items: [
        {
          label: 'Version',
          value: '1.0.0',
          icon: 'ℹ️',
        },
        {
          label: 'Build',
          value: process.env.NODE_ENV || 'development',
          icon: '🔧',
        },
      ],
    },
  ];

  return (
    <div className="profile-page">
      <MobileHeader
        title="Profile"
        rightAction={
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Profile Header */}
        <MobileCard variant="elevated" className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👤</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name || 'Unknown User'}</h2>
          <p className="text-gray-600 mb-2">{user?.email || 'No email'}</p>
          <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            <span className="mr-1">🔧</span>
            {user?.role || 'Unknown Role'}
          </div>
        </MobileCard>

        {/* Profile Sections */}
        {profileSections.map((section, sectionIndex) => (
          <MobileCard key={sectionIndex}>
            <h3 className="font-semibold text-gray-900 mb-3">{section.title}</h3>
            <div className="space-y-0">
              {section.items.map((item, itemIndex) => (
                <MobileListItem
                  key={itemIndex}
                  onClick={item.action}
                  divider={itemIndex < section.items.length - 1}
                  leftContent={<span className="text-lg">{item.icon}</span>}
                  rightContent={
                    <div className="flex items-center space-x-2">
                      {item.value && (
                        <span className="text-gray-600">{item.value}</span>
                      )}
                      {item.showArrow && (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  }
                >
                  {item.label}
                </MobileListItem>
              ))}
            </div>
          </MobileCard>
        ))}

        {/* Emergency Contact */}
        <MobileCard>
          <h3 className="font-semibold text-gray-900 mb-3">Emergency</h3>
          <MobileListItem
            onClick={() => navigate('/emergency')}
            leftContent={<span className="text-lg">🚨</span>}
            rightContent={
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            }
          >
            Emergency Assistance
          </MobileListItem>
        </MobileCard>
      </div>

      {/* Logout Confirmation */}
      <MobileActionSheet
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Confirm Logout"
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-4xl mb-4">👋</div>
            <h3 className="font-semibold text-gray-900 mb-2">Ready to leave?</h3>
            <p className="text-gray-600">
              Any unsaved offline data will remain on this device for sync when you return.
            </p>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Yes, Logout
            </button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </MobileActionSheet>

      {/* Password Change Modal */}
      <MobileActionSheet
        open={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
        title="Change Password"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter current password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handlePasswordChange}
              disabled={passwordMutation.isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
            >
              {passwordMutation.isLoading ? 'Changing...' : 'Change Password'}
            </button>
            <button
              onClick={() => setShowPasswordChange(false)}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Password must be at least 6 characters long
          </div>
        </div>
      </MobileActionSheet>
    </div>
  );
};

export default ProfilePage;