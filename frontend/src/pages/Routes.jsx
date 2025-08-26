import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Calendar, MapPin, Users, Clock, Navigation, RefreshCw, Filter, Target, Database, Save, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { routeService } from '../services/routeService';
import { sampleDataService } from '../services/sampleDataService';
import { loadGoogleMapsScript } from '../utils/googleMaps.ts';
import RouteMap from '../components/RouteMap';
import TechnicianWorkload from '../components/TechnicianWorkload';

const Routes = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [clusters, setClusters] = useState([]);
  const [autoAssignments, setAutoAssignments] = useState(null);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [isClustering, setIsClustering] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);
  const [excludedTechnicians, setExcludedTechnicians] = useState([]);
  const [showTechnicianSelector, setShowTechnicianSelector] = useState(false);

  // Load Google Maps and saved routes on component mount
  useEffect(() => {
    const loadMaps = async () => {
      try {
        console.log('🔄 Loading Google Maps script...');
        await loadGoogleMapsScript();
        
        // Verify the Google Maps API is actually loaded
        if (window.google && window.google.maps) {
          console.log('✅ Google Maps loaded successfully');
          setGoogleMapsLoaded(true);
        } else {
          console.error('❌ Google Maps script loaded but API not available');
          toast.error('Google Maps API not available. Map features will be limited.');
        }
      } catch (error) {
        console.error('❌ Failed to load Google Maps:', error);
        toast.error(`Failed to load Google Maps: ${error.message}. Map features will be limited.`);
      }
    };
    loadMaps();
    
    // Load saved routes
    setSavedRoutes(routeService.getSavedRoutes());
  }, []);

  // Fetch jobs for selected date
  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery(
    ['route-jobs', selectedDate, selectedTechnician?.id],
    () => routeService.getJobsForDate(selectedDate, selectedTechnician?.id),
    {
      enabled: !!selectedDate,
      refetchOnWindowFocus: false
    }
  );

  // Fetch technician workload
  const { data: technicians, isLoading: techniciansLoading } = useQuery(
    ['technician-workload', selectedDate],
    () => routeService.getTechniciansWorkload(selectedDate),
    {
      enabled: !!selectedDate,
      refetchOnWindowFocus: false
    }
  );

  const jobs = jobsData?.jobs || [];

  const handleOptimizeRoute = async () => {
    if (filteredJobs.length === 0) {
      toast.error('No jobs available for route optimization. Please select a technician first.');
      return;
    }

    if (!selectedTechnician) {
      toast.error('Please select a technician from the workload panel to optimize their route.');
      return;
    }

    setIsOptimizing(true);
    try {
      console.log(`🗺️ Optimizing route for ${selectedTechnician.name} with ${filteredJobs.length} jobs`);
      const optimized = await routeService.optimizeRoute(filteredJobs);
      setOptimizedRoute(optimized);
      toast.success(`Route optimized for ${selectedTechnician.name}! ${optimized.route.length} jobs, ${optimized.totalDistance}km, ${Math.round(optimized.totalTime/60)} hours`);
    } catch (error) {
      console.error('Route optimization error:', error);
      toast.error('Failed to optimize route');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setOptimizedRoute(null);
    setSelectedTechnician(null);
  };

  const handleTechnicianSelect = (technician) => {
    setSelectedTechnician(technician);
    setOptimizedRoute(null);
  };

  const handleGenerateSampleData = async () => {
    setIsGeneratingData(true);
    try {
      const result = await sampleDataService.initializeAllSampleData(selectedDate);
      toast.success(`Generated ${result.summary.techniciansCreated} technicians, ${result.summary.customersCreated} customers, and ${result.summary.jobsCreated} jobs for Puerto Rico!`);
      refetchJobs();
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast.error('Failed to generate sample data');
    } finally {
      setIsGeneratingData(false);
    }
  };

  const handleGeographicClustering = async () => {
    console.log('🔵 Geographic clustering button clicked!', {
      jobsLength: jobs.length,
      jobsData: jobs
    });
    
    if (jobs.length === 0) {
      console.log('❌ No jobs available for clustering');
      toast.error('No jobs available for clustering');
      return;
    }

    setIsClustering(true);
    try {
      console.log('🎯 Calling routeService.performGeographicClustering...');
      const jobClusters = routeService.performGeographicClustering(jobs, 6);
      console.log('📊 Clustering result:', jobClusters);
      setClusters(jobClusters);
      toast.success(`Created ${jobClusters.length} geographic clusters with Puerto Rico regions`);
    } catch (error) {
      console.error('Clustering error:', error);
      toast.error('Failed to perform geographic clustering');
    } finally {
      setIsClustering(false);
    }
  };

  const handleAutoAssignment = async () => {
    if (clusters.length === 0) {
      toast.error('Please create geographic clusters first');
      return;
    }

    if (!technicians || technicians.length === 0) {
      toast.error('No technicians available for assignment');
      return;
    }

    setIsAutoAssigning(true);
    try {
      console.log('🚀 Starting auto-assignment with clusters:', clusters);
      const assignments = await routeService.autoAssignJobsToTechnicians(clusters, technicians, selectedDate, excludedTechnicians);
      setAutoAssignments(assignments);
      console.log('✅ Auto-assignment completed, refreshing job data...');
      
      // Force refresh of all job data to show updated assignments
      await refetchJobs();
      
      toast.success(`Auto-assigned ${assignments.assignments.length} clusters to technicians with ${assignments.balanceScore.toFixed(0)}% balance score`);
    } catch (error) {
      console.error('Auto-assignment error:', error);
      toast.error('Failed to auto-assign jobs to technicians');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleSaveRoute = async () => {
    if (!optimizedRoute) {
      toast.error('No optimized route to save');
      return;
    }

    try {
      const routeName = prompt('Enter a name for this route:', `Route ${new Date().toLocaleDateString()}`);
      if (routeName) {
        const savedRoute = routeService.saveOptimizedRoute(optimizedRoute, routeName);
        setSavedRoutes(routeService.getSavedRoutes());
        toast.success(`Route saved as "${routeName}"`);
      }
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error('Failed to save route');
    }
  };

  const handleLoadRoute = (routeId) => {
    try {
      const route = routeService.loadSavedRoute(routeId);
      if (route) {
        setOptimizedRoute(route);
        setShowSavedRoutes(false);
        toast.success(`Loaded route: ${route.routeName}`);
      }
    } catch (error) {
      console.error('Error loading route:', error);
      toast.error('Failed to load route');
    }
  };

  const handleDeleteRoute = (routeId) => {
    try {
      if (routeService.deleteSavedRoute(routeId)) {
        setSavedRoutes(routeService.getSavedRoutes());
        toast.success('Route deleted');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route');
    }
  };

  const filteredJobs = selectedTechnician 
    ? jobs.filter(job => job.assignedTo === selectedTechnician.id)
    : jobs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Optimizer</h1>
          <p className="text-gray-600">Optimize technician routes and schedules</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => refetchJobs()}
            className="btn btn-secondary flex items-center gap-2"
            disabled={jobsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${jobsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={handleGenerateSampleData}
            className="btn btn-accent flex items-center gap-2"
            disabled={isGeneratingData}
          >
            <Database className={`h-4 w-4 ${isGeneratingData ? 'animate-spin' : ''}`} />
            {isGeneratingData ? 'Generating...' : 'Generate Sample Data'}
          </button>
          
          <button
            onClick={handleGeographicClustering}
            className="btn btn-info flex items-center gap-2"
            disabled={isClustering || jobs.length === 0}
          >
            <Target className={`h-4 w-4 ${isClustering ? 'animate-spin' : ''}`} />
            {isClustering ? 'Clustering...' : 'Geographic Clustering'}
          </button>
          
          <button
            onClick={() => setShowTechnicianSelector(!showTechnicianSelector)}
            className="btn btn-outline flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Manage Technicians
            {excludedTechnicians.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {excludedTechnicians.length} excluded
              </span>
            )}
          </button>
          
          <button
            onClick={handleAutoAssignment}
            className="btn btn-warning flex items-center gap-2"
            disabled={isAutoAssigning || clusters.length === 0}
          >
            <Users className={`h-4 w-4 ${isAutoAssigning ? 'animate-spin' : ''}`} />
            {isAutoAssigning ? 'Assigning...' : 'Auto-Assign'}
          </button>
          
          <button
            onClick={handleOptimizeRoute}
            className="btn btn-primary flex items-center gap-2"
            disabled={isOptimizing || filteredJobs.length === 0}
          >
            <Navigation className={`h-4 w-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
          </button>
          
          {optimizedRoute && (
            <button
              onClick={handleSaveRoute}
              className="btn btn-success flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Route
            </button>
          )}
          
          <button
            onClick={() => setShowSavedRoutes(!showSavedRoutes)}
            className="btn btn-ghost flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Saved Routes ({savedRoutes.length})
          </button>
        </div>
      </div>

      {/* Date Selection and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Select Date:</label>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="input max-w-xs"
          />
          
          {selectedTechnician && (
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-700">
                Filtering for: <strong>{selectedTechnician.name}</strong>
              </span>
              <button
                onClick={() => setSelectedTechnician(null)}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Route Optimization Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs for Route Planning */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Jobs for {new Date(selectedDate + 'T12:00:00').toLocaleDateString()}
            </h3>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">{filteredJobs.length} jobs</span>
            </div>
          </div>
          
          {jobsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading jobs...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No jobs scheduled for this date</p>
              <p className="text-sm text-gray-500 mt-2">
                Jobs will appear here when they are scheduled for the selected date.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {(optimizedRoute?.route || filteredJobs).map((job, index) => (
                <div
                  key={job.id}
                  className={`p-3 rounded-lg border ${
                    optimizedRoute ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {optimizedRoute && (
                        <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      )}
                      <h4 className="font-medium text-gray-900">{job.jobName}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.priority === 'High' ? 'bg-red-100 text-red-800' :
                        job.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {job.priority}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Customer:</strong> {job.Customer?.name}</p>
                    <p><strong>Service:</strong> {job.serviceType}</p>
                    <p><strong>Duration:</strong> {job.estimatedDuration} minutes</p>
                    {job.AssignedTechnician && (
                      <p><strong>Assigned:</strong> {job.AssignedTechnician.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Route Summary */}
          {optimizedRoute && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Route Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-600">{optimizedRoute.route.length}</div>
                  <div className="text-gray-500">Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-600">{optimizedRoute.totalDistance} km</div>
                  <div className="text-gray-500">Distance</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-600">{Math.round(optimizedRoute.totalTime / 60)}h</div>
                  <div className="text-gray-500">Duration</div>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-sm text-gray-600">
                  Estimated completion: <strong>{optimizedRoute.estimatedCompletionTime}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Technician Workload */}
        <TechnicianWorkload
          technicians={technicians || []}
          isLoading={techniciansLoading}
          onTechnicianSelect={handleTechnicianSelect}
          selectedTechnician={selectedTechnician}
        />
      </div>

      {/* Geographic Clusters Display */}
      {clusters.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Clusters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clusters.map((cluster, index) => (
              <div key={cluster.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Cluster {index + 1}</h4>
                  <span className="text-sm text-gray-500">{cluster.region}</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Jobs:</strong> {cluster.totalJobs}</p>
                  <p><strong>Duration:</strong> {Math.round(cluster.totalDuration / 60)}h</p>
                  <p><strong>Priority:</strong> {cluster.averagePriority}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-Assignment Results */}
      {autoAssignments && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Assignment Results</h3>
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Workload Balance Score</span>
              <span className="text-lg font-bold text-primary-600">{autoAssignments.balanceScore.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-primary-600 h-2 rounded-full" 
                style={{ width: `${autoAssignments.balanceScore}%` }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {autoAssignments.assignments.map((assignment, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{assignment.technician.name}</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Regions:</strong> {assignment.regions.join(', ')}</p>
                  <p><strong>Jobs:</strong> {assignment.jobs.length}</p>
                  <p><strong>Total Duration:</strong> {Math.round(assignment.technician.totalDuration / 60)}h</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route Map */}
      {googleMapsLoaded ? (
        <RouteMap
          jobs={filteredJobs}
          optimizedRoute={optimizedRoute}
          isLoading={isOptimizing}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Map</h3>
          <div className="text-center py-24 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading Google Maps...</p>
            <p className="text-sm text-gray-500 mt-2">
              Map will appear once Google Maps API is ready
            </p>
          </div>
        </div>
      )}

      {/* Saved Routes Modal */}
      {showSavedRoutes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Saved Routes</h3>
                <button
                  onClick={() => setShowSavedRoutes(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              {savedRoutes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No saved routes yet</p>
              ) : (
                <div className="space-y-3">
                  {savedRoutes.map((route) => (
                    <div key={route.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{route.routeName}</h4>
                        <p className="text-sm text-gray-500">
                          {route.route?.length || 0} jobs • {route.totalDistance} km • 
                          Saved on {new Date(route.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadRoute(route.id)}
                          className="btn btn-sm btn-primary"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(route.id)}
                          className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Technician Selector Modal */}
      {showTechnicianSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Manage Technicians</h3>
                <button
                  onClick={() => setShowTechnicianSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Uncheck technicians who are off today to exclude them from auto-assignment.
              </p>
              
              {techniciansLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  <span className="text-sm text-gray-500 mt-2">Loading technicians...</span>
                </div>
              ) : technicians && technicians.length > 0 ? (
                <div className="space-y-3">
                  {technicians.map((tech) => {
                    const isExcluded = excludedTechnicians.includes(tech.id);
                    return (
                      <label key={tech.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Include technician (remove from excluded list)
                              setExcludedTechnicians(prev => prev.filter(id => id !== tech.id));
                            } else {
                              // Exclude technician (add to excluded list)
                              setExcludedTechnicians(prev => [...prev, tech.id]);
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{tech.name}</span>
                          <div className="text-xs text-gray-500">
                            {tech.jobCount || 0} jobs • {Math.round((tech.totalDuration || 0) / 60)}h
                          </div>
                        </div>
                        {!isExcluded && (
                          <span className="text-xs text-green-600 font-medium">Available</span>
                        )}
                        {isExcluded && (
                          <span className="text-xs text-red-600 font-medium">Off Today</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No technicians found</p>
              )}
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setExcludedTechnicians([])}
                  className="btn btn-ghost text-sm"
                >
                  Include All
                </button>
                <button
                  onClick={() => setShowTechnicianSelector(false)}
                  className="btn btn-primary text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routes;