import React, { useState, ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Edit, Trash2, Eye, FileText, Calendar, User, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Job, JobStatus, JobPriority, User as UserType, JobQueryParams } from '@/shared/types/business';
import { jobService } from '@/shared/services/wrappers/jobServiceWrapper';
import { userService } from '@/shared/services/wrappers/userServiceWrapper';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Modal } from '@/shared/components/ui/Modal';
import { JobForm } from '@/app/components/business/JobForm';
import { JobLogs as JobLogsComponent } from '@/app/components/business/JobLogs';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';

interface JobsData {
  jobs: Job[];
  pagination: {
    page: number;
    pages: number;
    total: number;
  };
}

interface UsersData {
  users: UserType[];
}

interface MutationVariables {
  id: string;
  data: Partial<Job>;
}

type TabType = 'details' | 'logs';

export function Jobs() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [viewJob, setViewJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  
  const { hasRole, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: jobsData, isLoading } = useQuery<JobsData>(
    ['jobs', { 
      page: currentPage, 
      status: statusFilter, 
      assignedTo: assignedToFilter,
      search: searchTerm 
    }],
    () => jobService.getJobs({ 
      page: currentPage, 
      status: statusFilter, 
      assignedTo: assignedToFilter,
      search: searchTerm 
    } as JobQueryParams),
    { keepPreviousData: true }
  );

  const { data: usersData } = useQuery<UsersData>('users-list', () => userService.getUsers());

  const createMutation = useMutation<Job, Error, Partial<Job>>(
    jobService.createJob,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
        queryClient.invalidateQueries('dashboard-stats');
        setIsModalOpen(false);
        setSelectedJob(null);
        toast.success('Job created successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create job');
      },
    }
  );

  const updateMutation = useMutation<Job, Error, MutationVariables>(
    ({ id, data }) => jobService.updateJob(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
        queryClient.invalidateQueries('dashboard-stats');
        setIsModalOpen(false);
        setSelectedJob(null);
        toast.success('Job updated successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update job');
      },
    }
  );

  const deleteMutation = useMutation<void, Error, string>(
    jobService.deleteJob,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobs');
        queryClient.invalidateQueries('dashboard-stats');
        setIsDeleteModalOpen(false);
        setJobToDelete(null);
        toast.success('Job deleted successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete job');
      },
    }
  );

  const handleCreateJob = (): void => {
    setSelectedJob(null);
    setIsModalOpen(true);
  };

  const handleEditJob = (job: Job): void => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleViewJob = (job: Job): void => {
    setViewJob(job);
    setActiveTab('details');
    setIsViewModalOpen(true);
  };

  const handleDeleteJob = (job: Job): void => {
    setJobToDelete(job);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitJob = (data: Partial<Job>): void => {
    if (selectedJob) {
      updateMutation.mutate({ id: selectedJob.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConfirmDelete = (): void => {
    if (jobToDelete) {
      deleteMutation.mutate(jobToDelete.id);
    }
  };

  const getStatusColor = (status: JobStatus): string => {
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

  const getPriorityColor = (priority: JobPriority): string => {
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

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setStatusFilter(e.target.value);
  };

  const handleAssignedToFilterChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setAssignedToFilter(e.target.value);
  };

  const handlePreviousPage = (): void => {
    setCurrentPage(Math.max(1, currentPage - 1));
  };

  const handleNextPage = (): void => {
    if (jobsData?.pagination) {
      setCurrentPage(Math.min(jobsData.pagination.pages, currentPage + 1));
    }
  };

  const handleTabChange = (tab: TabType): void => {
    setActiveTab(tab);
  };

  const handleCloseModals = (): void => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsViewModalOpen(false);
  };

  const technicians = usersData?.users?.filter(u => 
    ['technician', 'admin', 'manager'].includes(u.role)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
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
              onChange={handleSearchChange}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
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
            onChange={handleAssignedToFilterChange}
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
              {jobsData?.jobs?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon="jobs"
                      title="No jobs found"
                      description="No jobs match your current filters. Try adjusting your search criteria or create a new job to get started."
                      actionLabel="Create New Job"
                      onAction={handleCreateJob}
                      className="py-8"
                    />
                  </td>
                </tr>
              ) : jobsData?.jobs?.map((job) => (
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status || 'Pending')}`}>
                      {job.status || 'Pending'}
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
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
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
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
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
        onClose={handleCloseModals}
        title={selectedJob ? 'Edit Job' : 'Create Job'}
      >
        <JobForm
          job={selectedJob}
          onSubmit={handleSubmitJob}
          onCancel={handleCloseModals}
          loading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      {/* View Job Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseModals}
        title={`Job: ${viewJob?.jobName || ''}`}
        size="large"
      >
        {viewJob && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => handleTabChange('details')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'details'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Job Details
                </button>
                <button
                  onClick={() => handleTabChange('logs')}
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewJob.status || 'Pending')}`}>
                      {viewJob.status || 'Pending'}
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
                <JobLogsComponent jobId={viewJob.id} jobStatus={viewJob.status || 'Pending'} />
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleCloseModals}
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
        onClose={handleCloseModals}
        title="Delete Job"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete the job <strong>{jobToDelete?.jobName}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCloseModals}
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
}