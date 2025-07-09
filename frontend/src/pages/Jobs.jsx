import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Edit, Trash2, Eye, FileText, Calendar, User, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { jobService } from '../services/jobService';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import JobForm from '../components/JobForm';
import JobLogs from '../components/JobLogs';

const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewJob, setViewJob] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  
  const { hasRole, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: jobsData, isLoading } = useQuery(
    ['jobs', { 
      page: currentPage, 
      status: statusFilter, 
      assignedTo: assignedToFilter 
    }],
    () => jobService.getJobs({ 
      page: currentPage, 
      status: statusFilter, 
      assignedTo: assignedToFilter 
    }),
    { keepPreviousData: true }
  );

  const { data: users } = useQuery('users-list', () => userService.getUsers());

  const createMutation = useMutation(jobService.createJob, {
    onSuccess: () => {
      queryClient.invalidateQueries('jobs');
      queryClient.invalidateQueries('dashboard-stats');
      setIsModalOpen(false);
      setSelectedJob(null);
      toast.success('Job created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create job');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }) => jobService.updateJob(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
        queryClient.invalidateQueries('dashboard-stats');
        setIsModalOpen(false);
        setSelectedJob(null);
        toast.success('Job updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update job');
      },
    }
  );

  const deleteMutation = useMutation(jobService.deleteJob, {
    onSuccess: () => {
      queryClient.invalidateQueries('jobs');
      queryClient.invalidateQueries('dashboard-stats');
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
      toast.success('Job deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete job');
    },
  });

  const handleCreateJob = () => {
    setSelectedJob(null);
    setIsModalOpen(true);
  };

  const handleEditJob = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleViewJob = (job) => {
    setViewJob(job);
    setActiveTab('details');
    setIsViewModalOpen(true);
  };

  const handleDeleteJob = (job) => {
    setJobToDelete(job);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitJob = (data) => {
    if (selectedJob) {
      updateMutation.mutate({ id: selectedJob.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConfirmDelete = () => {
    if (jobToDelete) {
      deleteMutation.mutate(jobToDelete.id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'text-red-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const technicians = users?.filter(u => 
    ['technician', 'admin', 'manager'].includes(u.role)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-600">Manage service jobs and assignments</p>
        </div>
        <button
          onClick={handleCreateJob}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Job
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option key="all-status" value="">All Statuses</option>
            <option key="pending" value="Pending">Pending</option>
            <option key="in-progress" value="In Progress">In Progress</option>
            <option key="completed" value="Completed">Completed</option>
            <option key="cancelled" value="Cancelled">Cancelled</option>
          </select>
          <select
            value={assignedToFilter}
            onChange={(e) => setAssignedToFilter(e.target.value)}
            className="input"
          >
            <option key="all-techs" value="">All Technicians</option>
            {technicians?.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Job</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Service Type</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Assigned To</th>
                <th className="table-header">Status</th>
                <th className="table-header">Scheduled</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobsData?.jobs?.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {job.jobName}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {job.description}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {job.Customer?.name}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {job.serviceType}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <AlertTriangle className={`h-4 w-4 mr-1 ${getPriorityColor(job.priority)}`} />
                      <span className={`text-sm font-medium ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    {job.AssignedTechnician ? (
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {job.AssignedTechnician.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    {job.scheduledDate ? (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(job.scheduledDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not scheduled</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewJob(job)}
                        className="text-gray-600 hover:text-gray-800"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditJob(job)}
                        className="text-primary-600 hover:text-primary-800"
                        title="Edit Job"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {hasRole(['admin', 'manager']) && (
                        <button
                          onClick={() => handleDeleteJob(job)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Job"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {jobsData?.pagination && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(jobsData.pagination.pages, currentPage + 1))}
                disabled={currentPage === jobsData.pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page {jobsData.pagination.page} of {jobsData.pagination.pages}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(jobsData.pagination.pages, currentPage + 1))}
                    disabled={currentPage === jobsData.pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedJob ? 'Edit Job' : 'Create Job'}
      >
        <JobForm
          job={selectedJob}
          onSubmit={handleSubmitJob}
          onCancel={() => setIsModalOpen(false)}
          loading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      {/* View Job Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Job: ${viewJob?.jobName || ''}`}
        size="large"
      >
        {viewJob && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'details'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Job Details
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'logs'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Activity & Logs
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Job Name</label>
                    <p className="text-sm text-gray-900">{viewJob.jobName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewJob.status)}`}>
                      {viewJob.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{viewJob.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer</label>
                    <p className="text-sm text-gray-900">{viewJob.Customer?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service Type</label>
                    <p className="text-sm text-gray-900">{viewJob.serviceType}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <p className={`text-sm font-medium ${getPriorityColor(viewJob.priority)}`}>
                      {viewJob.priority}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <p className="text-sm text-gray-900">
                      {viewJob.AssignedTechnician?.name || 'Unassigned'}
                    </p>
                  </div>
                </div>
                {viewJob.scheduledDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(viewJob.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                <JobLogs jobId={viewJob.id} jobStatus={viewJob.status} />
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="btn btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Job"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete the job <strong>{jobToDelete?.jobName}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isLoading}
              className="btn btn-danger"
            >
              {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Jobs;