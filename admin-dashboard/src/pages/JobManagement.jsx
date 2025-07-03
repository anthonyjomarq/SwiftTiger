import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

const JobManagement = () => {
  const { apiRequest, hasPermission } = useAuth();
  const { formatCurrency, formatNumber } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Check if we should show create modal from URL params
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowCreateModal(true);
      setSearchParams({}); // Clear the param
    }
  }, [searchParams, setSearchParams]);

  // Fetch data
  useEffect(() => {
    fetchJobs();
    fetchTechnicians();
    fetchCustomers();
  }, [selectedStatus, selectedPriority, selectedTechnician, dateRange, sortBy, sortOrder]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedPriority !== 'all') params.append('priority', selectedPriority);
      if (selectedTechnician !== 'all') params.append('technician', selectedTechnician);
      if (dateRange !== 'all') params.append('dateRange', dateRange);
      params.append('sortBy', sortBy);
      params.append('order', sortOrder);
      params.append('limit', '100');
      
      const response = await apiRequest(`/jobs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await apiRequest('/users?role=technician&status=active');
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await apiRequest('/users?role=customer&limit=50');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  // Filter jobs based on search term
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.technician_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleCreateJob = () => {
    setSelectedJob(null);
    setShowCreateModal(true);
  };

  const handleEditJob = (job) => {
    setSelectedJob(job);
    setShowEditModal(true);
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const response = await apiRequest(`/jobs/${jobId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setJobs(prev => prev.filter(job => job.id !== jobId));
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleUpdateJobStatus = async (jobId, newStatus) => {
    try {
      const response = await apiRequest(`/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: newStatus } : job
        ));
      }
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  const handleAssignTechnician = async (jobId, technicianId) => {
    try {
      const response = await apiRequest(`/jobs/${jobId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ technicianId }),
      });
      
      if (response.ok) {
        const technician = technicians.find(t => t.id == technicianId);
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { 
            ...job, 
            assigned_technician: technicianId,
            technician_name: technician?.name 
          } : job
        ));
      }
    } catch (error) {
      console.error('Failed to assign technician:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      on_hold: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.pending;
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Job statistics
  const jobStats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    scheduled: jobs.filter(j => j.status === 'scheduled').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    unassigned: jobs.filter(j => !j.assigned_technician).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
          <p className="text-gray-600">Manage service jobs, assignments, and scheduling</p>
        </div>
        
        {hasPermission('jobs.create') && (
          <button
            onClick={handleCreateJob}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Job
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-gray-900">{formatNumber(jobStats.total)}</div>
          <div className="text-sm text-gray-600">Total Jobs</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-yellow-600">{formatNumber(jobStats.pending)}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-blue-600">{formatNumber(jobStats.scheduled)}</div>
          <div className="text-sm text-gray-600">Scheduled</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-purple-600">{formatNumber(jobStats.inProgress)}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-green-600">{formatNumber(jobStats.completed)}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-red-600">{formatNumber(jobStats.unassigned)}</div>
          <div className="text-sm text-gray-600">Unassigned</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Jobs</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs, customers..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Technician</label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Technicians</option>
              <option value="unassigned">Unassigned</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="scheduled_date-asc">Schedule Date</option>
              <option value="priority-desc">Priority High-Low</option>
              <option value="status-asc">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Jobs ({filteredJobs.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedStatus !== 'all' ? 
                  'Try adjusting your filters to see more results.' : 
                  'Get started by creating your first job.'}
              </p>
              {hasPermission('jobs.create') && (
                <button
                  onClick={handleCreateJob}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Job
                </button>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Technician
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{job.id} - {job.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {job.description}
                        </div>
                        {job.address && (
                          <div className="text-xs text-gray-400 mt-1">
                            📍 {job.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {job.customer_name || 'No customer'}
                      </div>
                      {job.customer_phone && (
                        <div className="text-sm text-gray-500">{job.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {job.assigned_technician ? (
                        <div className="text-sm font-medium text-gray-900">
                          {job.technician_name}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Unassigned</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatDate(job.scheduled_date)}</div>
                      {job.scheduled_time && (
                        <div className="text-xs text-gray-500">
                          {formatTime(job.scheduled_time)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {hasPermission('jobs.edit') && (
                          <button
                            onClick={() => handleEditJob(job)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        )}
                        
                        {hasPermission('jobs.assign') && !job.assigned_technician && (
                          <select
                            onChange={(e) => handleAssignTechnician(job.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                            defaultValue=""
                          >
                            <option value="">Assign</option>
                            {technicians.map((tech) => (
                              <option key={tech.id} value={tech.id}>
                                {tech.name}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {hasPermission('jobs.delete') && job.status !== 'completed' && (
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit Job Modals would go here */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Create New Job
                </h3>
                {/* Job creation form would go here */}
                <p className="text-gray-600">Job creation form would be implemented here...</p>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagement;