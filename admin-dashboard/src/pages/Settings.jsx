import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

const Settings = () => {
  const { apiRequest, hasPermission } = useAuth();
  const { formatCurrency } = useAdmin();
  
  const [settings, setSettings] = useState({
    company: {
      name: 'SwiftTiger Service Co.',
      address: '123 Business St, City, ST 12345',
      phone: '(555) 123-4567',
      email: 'info@swifttiger.com',
      website: 'https://swifttiger.com'
    },
    operational: {
      businessHours: {
        start: '08:00',
        end: '17:00'
      },
      workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timeZone: 'America/New_York',
      defaultJobDuration: 60,
      maxJobsPerTechnician: 8
    },
    pricing: {
      baseFuelRate: 0.56,
      emergencyJobMultiplier: 2.0,
      overtimeRate: 1.5,
      defaultServiceFee: 50
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      customerUpdates: true,
      technicianAssignments: true,
      adminAlerts: true
    },
    integrations: {
      googleMapsApiKey: '',
      twilioEnabled: false,
      stripeEnabled: false,
      quickbooksEnabled: false
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiRequest('/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prevSettings => ({
          ...prevSettings,
          ...data.data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (category, newSettings) => {
    try {
      setSaving(true);
      const response = await apiRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          category,
          settings: newSettings
        })
      });

      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          [category]: newSettings
        }));
        // Show success message
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCompanyChange = (field, value) => {
    const newCompany = { ...settings.company, [field]: value };
    setSettings(prev => ({ ...prev, company: newCompany }));
  };

  const handleOperationalChange = (field, value) => {
    const newOperational = { ...settings.operational, [field]: value };
    setSettings(prev => ({ ...prev, operational: newOperational }));
  };

  const handlePricingChange = (field, value) => {
    const newPricing = { ...settings.pricing, [field]: parseFloat(value) || 0 };
    setSettings(prev => ({ ...prev, pricing: newPricing }));
  };

  const handleNotificationChange = (field, value) => {
    const newNotifications = { ...settings.notifications, [field]: value };
    setSettings(prev => ({ ...prev, notifications: newNotifications }));
  };

  const handleWorkDaysChange = (day, checked) => {
    const newWorkDays = checked 
      ? [...settings.operational.workDays, day]
      : settings.operational.workDays.filter(d => d !== day);
    
    handleOperationalChange('workDays', newWorkDays);
  };

  const saveCurrentTab = () => {
    updateSettings(activeTab, settings[activeTab]);
  };

  const tabs = [
    { id: 'company', name: 'Company Info', icon: '🏢' },
    { id: 'operational', name: 'Operations', icon: '⚙️' },
    { id: 'pricing', name: 'Pricing', icon: '💰' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'integrations', name: 'Integrations', icon: '🔗' }
  ];

  const workDayOptions = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage system configuration and preferences</p>
        </div>
        
        <button
          onClick={saveCurrentTab}
          disabled={saving || !hasPermission('settings.manage')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Company Info Tab */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.company.name}
                    onChange={(e) => handleCompanyChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.company.phone}
                    onChange={(e) => handleCompanyChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.company.email}
                    onChange={(e) => handleCompanyChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={settings.company.website}
                    onChange={(e) => handleCompanyChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address
                  </label>
                  <textarea
                    value={settings.company.address}
                    onChange={(e) => handleCompanyChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Operational Tab */}
          {activeTab === 'operational' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Operational Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Hours Start
                  </label>
                  <input
                    type="time"
                    value={settings.operational.businessHours.start}
                    onChange={(e) => handleOperationalChange('businessHours', {
                      ...settings.operational.businessHours,
                      start: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Hours End
                  </label>
                  <input
                    type="time"
                    value={settings.operational.businessHours.end}
                    onChange={(e) => handleOperationalChange('businessHours', {
                      ...settings.operational.businessHours,
                      end: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Job Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.operational.defaultJobDuration}
                    onChange={(e) => handleOperationalChange('defaultJobDuration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Jobs per Technician
                  </label>
                  <input
                    type="number"
                    value={settings.operational.maxJobsPerTechnician}
                    onChange={(e) => handleOperationalChange('maxJobsPerTechnician', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Working Days
                </label>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
                  {workDayOptions.map((day) => (
                    <label key={day.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.operational.workDays.includes(day.id)}
                        onChange={(e) => handleWorkDaysChange(day.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                      />
                      <span className="ml-2 text-sm text-gray-600">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Pricing Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Fuel Rate (per mile)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.pricing.baseFuelRate}
                      onChange={(e) => handlePricingChange('baseFuelRate', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Job Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.pricing.emergencyJobMultiplier}
                    onChange={(e) => handlePricingChange('emergencyJobMultiplier', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overtime Rate Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.pricing.overtimeRate}
                    onChange={(e) => handlePricingChange('overtimeRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Service Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={settings.pricing.defaultServiceFee}
                      onChange={(e) => handlePricingChange('defaultServiceFee', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-500">Send notifications via email</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailEnabled}
                      onChange={(e) => handleNotificationChange('emailEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">SMS Notifications</div>
                    <div className="text-sm text-gray-500">Send notifications via SMS</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.smsEnabled}
                      onChange={(e) => handleNotificationChange('smsEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Customer Updates</div>
                    <div className="text-sm text-gray-500">Notify customers of job progress</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.customerUpdates}
                      onChange={(e) => handleNotificationChange('customerUpdates', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Technician Assignments</div>
                    <div className="text-sm text-gray-500">Notify technicians of new jobs</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.technicianAssignments}
                      onChange={(e) => handleNotificationChange('technicianAssignments', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Third-party Integrations</h3>
              
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Google Maps</h4>
                      <p className="text-sm text-gray-500">Required for route optimization and mapping</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      settings.integrations.googleMapsApiKey ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {settings.integrations.googleMapsApiKey ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  <input
                    type="password"
                    placeholder="Google Maps API Key"
                    value={settings.integrations.googleMapsApiKey}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      integrations: { ...prev.integrations, googleMapsApiKey: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">💬</div>
                      <h4 className="font-medium text-gray-900">Twilio SMS</h4>
                      <p className="text-sm text-gray-500 mb-3">SMS notifications</p>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Coming Soon
                      </span>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">💳</div>
                      <h4 className="font-medium text-gray-900">Stripe</h4>
                      <p className="text-sm text-gray-500 mb-3">Payment processing</p>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Coming Soon
                      </span>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">📊</div>
                      <h4 className="font-medium text-gray-900">QuickBooks</h4>
                      <p className="text-sm text-gray-500 mb-3">Accounting integration</p>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;