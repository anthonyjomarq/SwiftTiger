import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Calendar, User, AlertTriangle, Eye, Plus, Briefcase } from 'lucide-react';
import { jobService } from '../services/jobService';
import { useAuth } from '../contexts/AuthContext';

const CustomerJobs = ({ customerId, customerName, onCreateJob, onViewJob }) => {
  const { hasRole } = useAuth();

  const { data: jobsData, isLoading } = useQuery(
    ['customer-jobs', customerId],
    () => jobService.getJobsByCustomer(customerId),
    { enabled: !!customerId }
  );

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Job History</h3>
          <p className="text-sm text-gray-600">All jobs for {customerName}</p>
        </div>
        {hasRole(['admin', 'manager', 'dispatcher']) && (
          <button
            onClick={onCreateJob}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Job
          </button>
        )}
      </div>

      {/* Jobs List */}
      {jobsData?.jobs?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
          <p className="text-gray-500 mb-4">This customer doesn't have any jobs scheduled.</p>
          {hasRole(['admin', 'manager', 'dispatcher']) && (
            <button
              onClick={onCreateJob}
              className="btn btn-primary"
            >
              Create First Job
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {jobsData?.jobs?.map((job) => (
            <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Job Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{job.jobName}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{job.description}</p>
                </div>
                <button
                  onClick={() => onViewJob(job)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">{job.serviceType}</span>
                </div>

                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${getPriorityColor(job.priority)}`} />
                  <span className="text-gray-600">Priority:</span>
                  <span className={`font-medium ${getPriorityColor(job.priority)}`}>{job.priority}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Assigned:</span>
                  <span className="font-medium">{job.AssignedTechnician?.name || 'Unassigned'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Scheduled:</span>
                  <span className="font-medium">
                    {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                  </span>
                </div>
              </div>

              {/* Job Progress */}
              {job.status !== 'Pending' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">Progress</span>
                    <span className="text-xs text-gray-500">
                      {job.status === 'Completed' ? '100%' : job.status === 'In Progress' ? '50%' : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        job.status === 'Completed' ? 'bg-green-500' : 
                        job.status === 'In Progress' ? 'bg-blue-500' : 
                        job.status === 'Cancelled' ? 'bg-red-500' : 'bg-gray-400'
                      }`}
                      style={{ 
                        width: `${
                          job.status === 'Completed' ? '100' : 
                          job.status === 'In Progress' ? '50' : '0'
                        }%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Job Statistics */}
      {jobsData?.jobs?.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Job Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {jobsData.jobs.length}
              </div>
              <div className="text-xs text-gray-500">Total Jobs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {jobsData.jobs.filter(job => job.status === 'Completed').length}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {jobsData.jobs.filter(job => job.status === 'In Progress').length}
              </div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {jobsData.jobs.filter(job => job.status === 'Pending').length}
              </div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerJobs;