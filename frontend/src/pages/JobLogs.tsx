import React, { useState, ChangeEvent } from 'react';
import { useQuery } from 'react-query';
import { Search, Filter, User, MessageSquare, Calendar, MapPin, Briefcase } from 'lucide-react';
import { Job, JobLog, JobStatus, User as UserType } from '../types';
import { jobService } from '../services/jobServiceWrapper';
import { jobLogServiceWrapper } from '../services/jobLogServiceWrapper';
import LoadingSpinner from '../components/LoadingSpinner';

interface JobsData {
  jobs: Job[];
}

interface EnhancedJobLog extends JobLog {
  job?: {
    id: string;
    title: string;
    status?: JobStatus;
    Customer?: {
      name: string;
    };
  };
  Technician?: UserType;
}

interface PhotoItem {
  filename: string;
  originalName: string;
}

const JobLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [technicianFilter, setTechnicianFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Fetch all jobs to get job logs
  const { data: jobsData, isLoading: jobsLoading } = useQuery<Job[]>(
    ['jobs', { limit: 1000 }], // Get all jobs
    async () => {
      const response = await jobService.getJobs({ limit: 1000 });
      return response.jobs || [];
    }
  );

  // Fetch job logs for each job
  const { data: allJobLogs, isLoading: logsLoading } = useQuery<EnhancedJobLog[]>(
    ['all-job-logs', jobsData],
    async (): Promise<EnhancedJobLog[]> => {
      if (!jobsData || jobsData.length === 0) return [];
      
      const logsPromises = jobsData.map(async (job): Promise<EnhancedJobLog[]> => {
        try {
          const logs = await jobLogServiceWrapper.getJobLogs(job.id);
          return logs.map(log => ({
            ...log,
            job: {
              id: job.id,
              title: job.jobName, // Assuming jobName is the title field
              status: job.status,
              Customer: job.Customer
            }
          }));
        } catch (error) {
          console.error(`Error fetching logs for job ${job.id}:`, error);
          return [];
        }
      });
      
      const logsArrays = await Promise.all(logsPromises);
      const flatLogs = logsArrays.flat();
      return flatLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    {
      enabled: !!jobsData && jobsData.length > 0
    }
  );

  const isLoading = jobsLoading || logsLoading;

  // Filter logs based on search and filters
  const filteredLogs = allJobLogs?.filter(log => {
    const matchesSearch = !searchTerm || 
      log.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.Technician?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.job?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.job?.Customer?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || log.statusUpdate === statusFilter;
    const matchesTechnician = !technicianFilter || log.jobId === technicianFilter; // Assuming technicianId should be compared differently
    const matchesDate = !dateFilter || new Date(log.createdAt).toDateString() === new Date(dateFilter).toDateString();

    return matchesSearch && matchesStatus && matchesTechnician && matchesDate;
  }) || [];

  // Get unique technicians for filter
  const technicians = [...new Map(
    allJobLogs?.map(log => [log.jobId, log.Technician]).filter(([_, tech]) => tech) || []
  ).values()] as UserType[];

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Pending':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setStatusFilter(e.target.value);
  };

  const handleTechnicianFilterChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setTechnicianFilter(e.target.value);
  };

  const handleDateFilterChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDateFilter(e.target.value);
  };

  const handleClearAllFilters = (): void => {
    setSearchTerm('');
    setStatusFilter('');
    setTechnicianFilter('');
    setDateFilter('');
  };

  const handlePhotoClick = (filename: string): void => {
    window.open(`/api/uploads/${filename}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Logs</h1>
          <p className="text-gray-600">View all job activity and progress logs</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs, technicians, jobs..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 input"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="input"
            >
              <option value="">All Status Updates</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Technician Filter */}
          <div>
            <select
              value={technicianFilter}
              onChange={handleTechnicianFilterChange}
              className="input"
            >
              <option value="">All Technicians</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={handleDateFilterChange}
              className="input"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || statusFilter || technicianFilter || dateFilter) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleClearAllFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Job Logs List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No job logs found</h3>
            <p className="text-gray-500">
              {allJobLogs?.length === 0 
                ? "No job logs have been created yet."
                : "Try adjusting your search or filters."
              }
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Log Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{log.Technician?.name}</h3>
                      {log.statusUpdate && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.statusUpdate)}`}>
                          {log.statusUpdate}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(log.createdAt.toString())}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {log.job?.title}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {log.job?.Customer?.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Log Content */}
              <div className="mb-4 ml-14">
                <p className="text-gray-900 whitespace-pre-wrap">{log.notes}</p>
              </div>

              {/* Photos */}
              {log.photos && log.photos.length > 0 && (
                <div className="ml-14">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {log.photos.length} photo{log.photos.length !== 1 ? 's' : ''}:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(log.photos as string[]).slice(0, 4).map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={`/api/uploads/${photo}`}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded border hover:opacity-75 cursor-pointer"
                          onClick={() => handlePhotoClick(photo)}
                        />
                      </div>
                    ))}
                    {log.photos.length > 4 && (
                      <div className="w-full h-20 bg-gray-100 rounded border flex items-center justify-center text-sm text-gray-500">
                        +{log.photos.length - 4} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobLogs;