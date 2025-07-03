import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const RouteManager = ({ apiRequest, showNotification }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState(null);
  const [showRoutes, setShowRoutes] = useState(false);
  const queryClient = useQueryClient();

  // Fetch unassigned jobs for the selected date
  const { data: unassignedJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['unassigned-jobs', selectedDate],
    queryFn: async () => {
      const response = await apiRequest(`/jobs?date=${selectedDate}&status=pending,scheduled&unassigned=true`);
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      throw new Error('Failed to fetch jobs');
    },
    enabled: !!selectedDate,
  });

  // Fetch available technicians
  const { data: technicians, isLoading: techsLoading } = useQuery({
    queryKey: ['available-technicians', selectedDate],
    queryFn: async () => {
      const response = await apiRequest(`/users?role=technician&available=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      throw new Error('Failed to fetch technicians');
    },
    enabled: !!selectedDate,
  });

  // Fetch existing route assignments
  const { data: existingRoutes, isLoading: routesLoading } = useQuery({
    queryKey: ['route-assignments', selectedDate],
    queryFn: async () => {
      const response = await apiRequest(`/routes/assignments?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    },
    enabled: !!selectedDate,
  });

  // Route optimization mutation
  const optimizeMutation = useMutation({
    mutationFn: async (optimizeData) => {
      const response = await apiRequest('/routes/optimize', {
        method: 'POST',
        body: JSON.stringify(optimizeData),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize routes');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setOptimizedRoutes(data.data);
      setShowRoutes(true);
      showNotification('success', 'Routes Optimized', 'Route optimization completed successfully');
    },
    onError: (error) => {
      showNotification('error', 'Optimization Failed', error.message);
    },
  });

  // Save routes mutation
  const saveMutation = useMutation({
    mutationFn: async (saveData) => {
      const response = await apiRequest('/routes/save', {
        method: 'POST',
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        throw new Error('Failed to save routes');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['route-assignments', selectedDate]);
      queryClient.invalidateQueries(['unassigned-jobs', selectedDate]);
      setOptimizedRoutes(null);
      setShowRoutes(false);
      showNotification('success', 'Routes Saved', 'Route assignments have been saved');
    },
    onError: (error) => {
      showNotification('error', 'Save Failed', error.message);
    },
  });

  const handleOptimizeRoutes = () => {
    if (!unassignedJobs || unassignedJobs.length === 0) {
      showNotification('info', 'No Jobs', 'No unassigned jobs found for this date');
      return;
    }

    optimizeMutation.mutate({
      date: selectedDate,
      options: {
        prioritizeSkillMatch: true,
        minimizeTravelTime: true,
        balanceWorkload: true,
      },
    });
  };

  const handleSaveRoutes = () => {
    if (!optimizedRoutes || !optimizedRoutes.routes) {
      return;
    }

    saveMutation.mutate({
      date: selectedDate,
      routes: optimizedRoutes.routes,
    });
  };

  const formatDistance = (miles) => {
    if (!miles) return '0 mi';
    return `${miles.toFixed(1)} mi`;
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getSkillMatchColor = (score) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
      emergency: 'bg-red-600 text-white',
    };
    return colors[priority] || colors.normal;
  };

  return (
    <div className="route-manager p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Route Planning & Management</h1>
        <p className="text-gray-600">Optimize technician routes to reduce travel time and fuel costs</p>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Unassigned Jobs</div>
            <div className="text-2xl font-bold text-blue-600">
              {unassignedJobs?.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">Available Technicians</div>
          <div className="text-xl font-semibold text-gray-900">
            {technicians?.length || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600">Assigned Routes</div>
          <div className="text-xl font-semibold text-gray-900">
            {existingRoutes?.length || 0}
          </div>
        </div>
        
        {optimizedRoutes && (
          <>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-sm text-gray-600">Est. Fuel Savings</div>
              <div className="text-xl font-semibold text-green-600">
                {formatCurrency(optimizedRoutes.summary?.estimatedSavings)}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-sm text-gray-600">Total Distance</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatDistance(optimizedRoutes.summary?.totalDistance)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Route Optimization</h3>
            <p className="text-gray-600">
              Automatically assign jobs to technicians based on skills, location, and efficiency
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleOptimizeRoutes}
              disabled={optimizeMutation.isLoading || !unassignedJobs?.length}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {optimizeMutation.isLoading ? 'Optimizing...' : 'Optimize Routes'}
            </button>
            
            {optimizedRoutes && (
              <button
                onClick={handleSaveRoutes}
                disabled={saveMutation.isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400"
              >
                {saveMutation.isLoading ? 'Saving...' : 'Save Routes'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Optimized Routes Display */}
      {showRoutes && optimizedRoutes && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Optimized Routes</h3>
            <div className="text-sm text-gray-600">
              {Object.keys(optimizedRoutes.routes).length} technicians, {optimizedRoutes.summary.totalJobs} jobs
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(optimizedRoutes.routes).map(([techId, route]) => (
              <div key={techId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{route.technician.name}</h4>
                    <div className="text-sm text-gray-600">
                      {route.jobs.length} jobs • {formatDistance(route.totalDistance)} • {formatTime(route.totalTime)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Fuel Cost</div>
                    <div className="font-medium">{formatCurrency(route.totalFuelCost)}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {route.jobs.map((job, index) => (
                    <div key={job.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{job.title}</div>
                          <div className="text-xs text-gray-600">{job.customer_name}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(job.priority)}`}>
                          {job.priority}
                        </span>
                        {job.assignmentScore && (
                          <span className={`text-xs font-medium ${getSkillMatchColor(job.assignmentScore)}`}>
                            {Math.round(job.assignmentScore * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {route.estimatedCompletionTime && (
                  <div className="mt-3 text-sm text-gray-600">
                    Estimated completion: {route.estimatedCompletionTime}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unassigned Jobs */}
      {unassignedJobs && unassignedJobs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Unassigned Jobs ({unassignedJobs.length})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Job</th>
                  <th className="text-left py-2 px-3">Customer</th>
                  <th className="text-left py-2 px-3">Priority</th>
                  <th className="text-left py-2 px-3">Skills Required</th>
                  <th className="text-left py-2 px-3">Duration</th>
                  <th className="text-left py-2 px-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {unassignedJobs.map((job) => (
                  <tr key={job.id} className="border-b">
                    <td className="py-2 px-3">
                      <div className="font-medium">{job.title}</div>
                      <div className="text-sm text-gray-600">{job.address}</div>
                    </td>
                    <td className="py-2 px-3">{job.customer_name}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {job.required_skills?.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {skill}
                          </span>
                        )) || <span className="text-gray-400 text-xs">None</span>}
                      </div>
                    </td>
                    <td className="py-2 px-3">{formatTime(job.estimated_duration)}</td>
                    <td className="py-2 px-3">{job.scheduled_time || 'Flexible'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading States */}
      {(jobsLoading || techsLoading || routesLoading) && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div className="mt-2 text-gray-600">Loading route data...</div>
        </div>
      )}
    </div>
  );
};

export default RouteManager;