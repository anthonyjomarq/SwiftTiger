import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

// Shared components
import { MobileHeader, MobileCard } from '../../shared/components/MobileLayout';
import { useNotifications } from '../../shared/components/NotificationHub';

// Local components and contexts
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useOffline } from '../contexts/OfflineContext';

const EmergencyPage = () => {
  const navigate = useNavigate();
  const { user, apiRequest } = useAuth();
  const { currentLocation, getCurrentPosition } = useLocation();
  const { isOnline, addPendingAction } = useOffline();
  const { showSuccess, showError, showInfo } = useNotifications();
  
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [emergencyStartTime, setEmergencyStartTime] = useState(null);

  // Emergency alert mutation
  const emergencyMutation = useMutation({
    mutationFn: async (emergencyData) => {
      const response = await apiRequest('/emergency/alert', {
        method: 'POST',
        body: JSON.stringify(emergencyData),
      });

      if (!response.ok) {
        throw new Error('Failed to send emergency alert');
      }

      return response.json();
    },
    onSuccess: () => {
      showSuccess('Emergency Alert Sent', 'Help is on the way');
      setIsEmergencyActive(true);
      setEmergencyStartTime(new Date());
    },
    onError: (error) => {
      if (!isOnline) {
        addPendingAction({
          type: 'EMERGENCY_ALERT',
          data: emergencyData,
          timestamp: Date.now(),
        });
        showInfo('Alert Queued', 'Emergency alert will send when online');
        setIsEmergencyActive(true);
        setEmergencyStartTime(new Date());
      } else {
        showError('Alert Failed', error.message);
      }
    },
  });

  const emergencyTypes = [
    {
      id: 'medical',
      title: 'Medical Emergency',
      icon: '🚑',
      description: 'Injury, illness, or medical condition requiring immediate attention',
      color: 'bg-red-500',
      phone: '911',
    },
    {
      id: 'safety',
      title: 'Safety Emergency',
      icon: '⚠️',
      description: 'Dangerous situation, equipment failure, or safety hazard',
      color: 'bg-orange-500',
      phone: '911',
    },
    {
      id: 'security',
      title: 'Security Emergency',
      icon: '🚨',
      description: 'Theft, vandalism, or threatening situation',
      color: 'bg-red-600',
      phone: '911',
    },
    {
      id: 'environmental',
      title: 'Environmental Emergency',
      icon: '🌪️',
      description: 'Natural disaster, severe weather, or environmental hazard',
      color: 'bg-yellow-500',
      phone: '911',
    },
    {
      id: 'technical',
      title: 'Technical Emergency',
      icon: '🔧',
      description: 'Critical equipment failure requiring immediate support',
      color: 'bg-blue-500',
      phone: 'Support',
    },
  ];

  const handleEmergencySelect = async (emergency) => {
    setSelectedEmergency(emergency);
    
    // Get current location if available
    let location = currentLocation;
    if (!location) {
      try {
        location = await getCurrentPosition();
      } catch (error) {
        console.error('Could not get location:', error);
      }
    }

    const emergencyData = {
      type: emergency.id,
      title: emergency.title,
      description: emergency.description,
      location: location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      } : null,
      additionalInfo: additionalInfo.trim() || null,
      timestamp: new Date().toISOString(),
      technicianId: user?.id,
      technicianName: user?.name,
    };

    // Send emergency alert
    emergencyMutation.mutate(emergencyData);
  };

  const handleCallEmergency = (phoneNumber) => {
    if (phoneNumber === '911' || phoneNumber.startsWith('+')) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      showInfo('Contact Support', 'Please call your company support line');
    }
  };

  const handleCancelEmergency = () => {
    setIsEmergencyActive(false);
    setSelectedEmergency(null);
    setEmergencyStartTime(null);
    setAdditionalInfo('');
    showSuccess('Emergency Cancelled', 'Emergency alert has been cancelled');
  };

  const formatElapsedTime = () => {
    if (!emergencyStartTime) return '00:00';
    
    const now = new Date();
    const elapsed = Math.floor((now - emergencyStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update elapsed time display
  useEffect(() => {
    if (!isEmergencyActive) return;
    
    const timer = setInterval(() => {
      // Force re-render to update elapsed time
      setEmergencyStartTime(prev => prev);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isEmergencyActive]);

  if (isEmergencyActive) {
    return (
      <div className="emergency-page bg-red-50 min-h-screen">
        <MobileHeader
          title="Emergency Active"
          className="bg-red-600 text-white"
          showBack={false}
        />

        <div className="p-4 space-y-4">
          {/* Active Emergency Status */}
          <MobileCard variant="elevated" className="border-l-4 border-l-red-500">
            <div className="text-center mb-4">
              <div className="text-6xl mb-4">{selectedEmergency?.icon}</div>
              <h2 className="text-xl font-bold text-red-700 mb-2">
                {selectedEmergency?.title}
              </h2>
              <div className="text-2xl font-mono font-bold text-red-600 mb-2">
                {formatElapsedTime()}
              </div>
              <div className="text-sm text-gray-600">Emergency duration</div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <div className="font-medium text-red-800 mb-1">Emergency Alert Sent</div>
                <div className="text-sm text-red-700">
                  Your supervisor and emergency contacts have been notified
                </div>
              </div>

              {currentLocation && (
                <div className="p-3 bg-blue-100 rounded-lg">
                  <div className="font-medium text-blue-800 mb-1">Location Shared</div>
                  <div className="text-sm text-blue-700">
                    Your current location has been included in the alert
                  </div>
                </div>
              )}

              {!isOnline && (
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <div className="font-medium text-yellow-800 mb-1">Offline Mode</div>
                  <div className="text-sm text-yellow-700">
                    Alert will send when connection is restored
                  </div>
                </div>
              )}
            </div>
          </MobileCard>

          {/* Emergency Actions */}
          <MobileCard>
            <h3 className="font-semibold text-gray-900 mb-3">Emergency Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleCallEmergency('911')}
                className="w-full p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">📞</span>
                  <span className="font-semibold">Call 911</span>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/jobs')}
                className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Jobs
              </button>
              
              <button
                onClick={handleCancelEmergency}
                className="w-full p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel Emergency
              </button>
            </div>
          </MobileCard>

          {/* Instructions */}
          <MobileCard className="bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-2">What to do next:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Stay calm and ensure your safety</li>
              <li>• Wait for emergency response if needed</li>
              <li>• Follow any instructions from emergency personnel</li>
              <li>• Contact your supervisor when safe to do so</li>
            </ul>
          </MobileCard>
        </div>
      </div>
    );
  }

  return (
    <div className="emergency-page">
      <MobileHeader
        title="Emergency Assistance"
        subtitle="Get immediate help when you need it"
        showBack
      />

      <div className="p-4 space-y-4">
        {/* Warning Banner */}
        <MobileCard className="bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-semibold text-red-800 mb-1">Emergency Use Only</div>
              <div className="text-sm text-red-700">
                Use this feature only for genuine emergencies requiring immediate assistance.
                False alarms may result in unnecessary emergency response.
              </div>
            </div>
          </div>
        </MobileCard>

        {/* Additional Information */}
        <MobileCard>
          <h3 className="font-semibold text-gray-900 mb-3">Additional Information (Optional)</h3>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Describe the situation, injuries, or specific help needed..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows={3}
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            {additionalInfo.length}/500 characters
          </div>
        </MobileCard>

        {/* Emergency Types */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Select Emergency Type:</h3>
          
          {emergencyTypes.map((emergency) => (
            <MobileCard
              key={emergency.id}
              onClick={() => handleEmergencySelect(emergency)}
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-gray-300 hover:border-l-red-500"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 ${emergency.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                  {emergency.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{emergency.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{emergency.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>📞 {emergency.phone}</span>
                    <span>📍 Location will be shared</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </MobileCard>
          ))}
        </div>

        {/* Quick Call 911 */}
        <MobileCard className="bg-red-600 text-white">
          <button
            onClick={() => handleCallEmergency('911')}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <div className="font-semibold">Call 911 Now</div>
                  <div className="text-sm text-red-100">For immediate emergency response</div>
                </div>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </button>
        </MobileCard>

        {/* Location Status */}
        <MobileCard className="bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <span className="text-xl">📍</span>
            <div>
              <div className="font-medium text-blue-800">
                {currentLocation ? 'Location Available' : 'Location Not Available'}
              </div>
              <div className="text-sm text-blue-700">
                {currentLocation 
                  ? 'Your location will be included in emergency alerts'
                  : 'Enable location access for faster emergency response'
                }
              </div>
            </div>
          </div>
        </MobileCard>
      </div>
    </div>
  );
};

export default EmergencyPage;