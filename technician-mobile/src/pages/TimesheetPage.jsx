import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Shared components
import { MobileHeader, MobileCard, MobileListItem, MobileFAB, MobileActionSheet } from '../../shared/components/MobileLayout';
import { useNotifications } from '../../shared/components/NotificationHub';

// Local components and contexts
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useOffline } from '../contexts/OfflineContext';

const TimesheetPage = () => {
  const { user, apiRequest } = useAuth();
  const { currentLocation } = useLocation();
  const { isOnline, addPendingAction } = useOffline();
  const { showSuccess, showError, showInfo } = useNotifications();
  const queryClient = useQueryClient();
  
  const [selectedWeek, setSelectedWeek] = useState(getWeekDates(new Date()));
  const [showClockActions, setShowClockActions] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch timesheet data
  const { data: timesheetData, isLoading } = useQuery({
    queryKey: ['timesheet', user?.id, selectedWeek.start.toISOString().split('T')[0]],
    queryFn: async () => {
      const startDate = selectedWeek.start.toISOString().split('T')[0];
      const endDate = selectedWeek.end.toISOString().split('T')[0];
      
      const response = await apiRequest(`/timesheet?start=${startDate}&end=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      throw new Error('Failed to fetch timesheet');
    },
    enabled: !!user && isOnline,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Clock in/out mutation
  const clockMutation = useMutation({
    mutationFn: async ({ type, jobId }) => {
      const response = await apiRequest('/timesheet/clock', {
        method: 'POST',
        body: JSON.stringify({
          type,
          jobId,
          location: currentLocation ? {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            accuracy: currentLocation.accuracy,
          } : null,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to clock in/out');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['timesheet']);
      queryClient.invalidateQueries(['dashboard']);
      
      const message = variables.type === 'clock_in' ? 'Clocked in successfully' : 'Clocked out successfully';
      showSuccess('Time Recorded', message);
      setShowClockActions(false);
    },
    onError: (error, variables) => {
      if (!isOnline) {
        addPendingAction({
          type: 'CLOCK_IN_OUT',
          data: {
            type: variables.type,
            jobId: variables.jobId,
            location: currentLocation,
            timestamp: Date.now(),
          },
        });
        showInfo('Saved Offline', 'Time entry will sync when online');
        setShowClockActions(false);
      } else {
        showError('Error', error.message);
      }
    },
  });

  function getWeekDates(date) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day; // First day is Sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedWeek.start);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setSelectedWeek(getWeekDates(newDate));
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateDayHours = (entries) => {
    if (!entries || entries.length === 0) return 0;
    
    let totalMinutes = 0;
    let clockInTime = null;
    
    entries.forEach(entry => {
      if (entry.type === 'clock_in') {
        clockInTime = new Date(entry.timestamp);
      } else if (entry.type === 'clock_out' && clockInTime) {
        const clockOutTime = new Date(entry.timestamp);
        totalMinutes += (clockOutTime - clockInTime) / 60000;
        clockInTime = null;
      }
    });
    
    return totalMinutes;
  };

  const getTodaysEntries = () => {
    if (!timesheetData) return [];
    const today = new Date().toDateString();
    return timesheetData.filter(entry => 
      new Date(entry.timestamp).toDateString() === today
    );
  };

  const isCurrentlyClockedIn = () => {
    const todaysEntries = getTodaysEntries();
    if (todaysEntries.length === 0) return false;
    
    const lastEntry = todaysEntries[todaysEntries.length - 1];
    return lastEntry.type === 'clock_in';
  };

  const getCurrentJobId = () => {
    const todaysEntries = getTodaysEntries();
    if (todaysEntries.length === 0) return null;
    
    const lastEntry = todaysEntries[todaysEntries.length - 1];
    return lastEntry.type === 'clock_in' ? lastEntry.job_id : null;
  };

  const handleClockAction = (type, jobId = null) => {
    clockMutation.mutate({ type, jobId });
  };

  const getWeeklyTotal = () => {
    if (!timesheetData) return 0;
    
    const dailyTotals = {};
    timesheetData.forEach(entry => {
      const date = new Date(entry.timestamp).toDateString();
      if (!dailyTotals[date]) {
        dailyTotals[date] = [];
      }
      dailyTotals[date].push(entry);
    });
    
    let weeklyMinutes = 0;
    Object.values(dailyTotals).forEach(dayEntries => {
      weeklyMinutes += calculateDayHours(dayEntries);
    });
    
    return weeklyMinutes;
  };

  const groupEntriesByDate = () => {
    if (!timesheetData) return {};
    
    const grouped = {};
    timesheetData.forEach(entry => {
      const date = new Date(entry.timestamp).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });
    
    return grouped;
  };

  const formatWeekRange = () => {
    const start = selectedWeek.start.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
    const end = selectedWeek.end.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    return `${start} - ${end}`;
  };

  const isCurrentWeek = () => {
    const now = new Date();
    return now >= selectedWeek.start && now <= selectedWeek.end;
  };

  const clockActions = [
    {
      id: 'clock_in',
      label: 'Clock In',
      icon: '🕐',
      color: 'text-green-600',
      disabled: isCurrentlyClockedIn(),
    },
    {
      id: 'clock_out',
      label: 'Clock Out',
      icon: '🕐',
      color: 'text-red-600',
      disabled: !isCurrentlyClockedIn(),
    },
  ];

  const groupedEntries = groupEntriesByDate();

  return (
    <div className="timesheet-page">
      <MobileHeader
        title="Timesheet"
        subtitle={formatWeekRange()}
        rightAction={
          <div className="text-right">
            <div className="text-lg font-bold">{formatDuration(getWeeklyTotal())}</div>
            <div className="text-xs text-gray-500">This Week</div>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Week Navigation */}
        <MobileCard>
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="font-semibold">{formatWeekRange()}</div>
              {isCurrentWeek() && (
                <div className="text-sm text-blue-600">Current Week</div>
              )}
            </div>
            
            <button
              onClick={() => navigateWeek(1)}
              disabled={isCurrentWeek() && selectedWeek.end > new Date()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </MobileCard>

        {/* Current Status */}
        {isCurrentWeek() && (
          <MobileCard variant="elevated" className={`${
            isCurrentlyClockedIn() ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">CURRENT STATUS</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isCurrentlyClockedIn() 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {isCurrentlyClockedIn() ? 'Clocked In' : 'Clocked Out'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{formatTime(currentTime)}</div>
                <div className="text-sm text-gray-600">
                  {isCurrentlyClockedIn() ? 'Working' : 'Off duty'}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold">{formatDuration(calculateDayHours(getTodaysEntries()))}</div>
                <div className="text-sm text-gray-600">Today</div>
              </div>
            </div>
          </MobileCard>
        )}

        {/* Time Entries */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <MobileCard key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </MobileCard>
            ))}
          </div>
        ) : Object.keys(groupedEntries).length === 0 ? (
          <MobileCard className="text-center py-8">
            <div className="text-4xl mb-4">🕐</div>
            <h3 className="font-semibold text-gray-900 mb-2">No Time Entries</h3>
            <p className="text-gray-600">
              No time entries found for this week
            </p>
          </MobileCard>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedEntries)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([date, entries]) => {
                const dayHours = calculateDayHours(entries);
                const dateObj = new Date(date);
                const isToday = dateObj.toDateString() === new Date().toDateString();
                
                return (
                  <MobileCard key={date}>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                      <div>
                        <div className="font-semibold">
                          {isToday ? 'Today' : dateObj.toLocaleDateString([], { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-sm text-gray-600">{formatDuration(dayHours)}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-0">
                      {entries
                        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                        .map((entry, index) => (
                          <MobileListItem
                            key={index}
                            divider={index < entries.length - 1}
                            leftContent={
                              <div className={`w-3 h-3 rounded-full ${
                                entry.type === 'clock_in' ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                            }
                            rightContent={
                              <div className="text-right">
                                <div className="font-medium">{formatTime(entry.timestamp)}</div>
                                {entry.location && (
                                  <div className="text-xs text-gray-500">📍 GPS</div>
                                )}
                              </div>
                            }
                          >
                            <div>
                              <div className="font-medium">
                                {entry.type === 'clock_in' ? 'Clock In' : 'Clock Out'}
                              </div>
                              {entry.job_title && (
                                <div className="text-sm text-gray-600">{entry.job_title}</div>
                              )}
                            </div>
                          </MobileListItem>
                        ))}
                    </div>
                  </MobileCard>
                );
              })}
          </div>
        )}

        {!isOnline && (
          <MobileCard className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <div className="font-medium text-yellow-800">Offline Mode</div>
                <div className="text-sm text-yellow-700">Time entries will sync when online</div>
              </div>
            </div>
          </MobileCard>
        )}
      </div>

      {/* Clock In/Out FAB */}
      {isCurrentWeek() && (
        <MobileFAB
          onClick={() => setShowClockActions(true)}
          position="bottom-right"
          variant="primary"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </MobileFAB>
      )}

      {/* Clock Actions Sheet */}
      <MobileActionSheet
        open={showClockActions}
        onClose={() => setShowClockActions(false)}
        title="Time Clock"
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-2xl font-bold mb-2">{formatTime(currentTime)}</div>
            <div className="text-sm text-gray-600">
              Status: {isCurrentlyClockedIn() ? 'Clocked In' : 'Clocked Out'}
            </div>
          </div>
          
          <div className="space-y-2">
            {clockActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleClockAction(action.id, getCurrentJobId())}
                disabled={action.disabled || clockMutation.isLoading}
                className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
              >
                <span className="text-lg">{action.icon}</span>
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
          
          {!currentLocation && (
            <div className="text-xs text-gray-500 text-center">
              Enable location tracking for accurate time records
            </div>
          )}
        </div>
      </MobileActionSheet>
    </div>
  );
};

export default TimesheetPage;