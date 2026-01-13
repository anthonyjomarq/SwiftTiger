import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, Clock, CheckCircle, AlertTriangle, Calendar, LucideIcon } from 'lucide-react';
import { Job, JobPriority, JobStatus } from '@/shared/types/business';
import { dashboardService } from '@/shared/services/wrappers/dashboardServiceWrapper';
import { JobStatusChart } from '@/app/components/charts/JobStatusChart';
import { TechnicianWorkloadChart } from '@/app/components/charts/TechnicianWorkloadChart';
import { JobTrendChart } from '@/app/components/charts/JobTrendChart';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

interface DashboardStats {
  totalCustomers: number;
  activeJobs: number;
  pendingJobs: number;
  completedToday: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  jobStatusDistribution: Array<{
    status: string;
    count: number;
  }>;
  technicianWorkload: Array<{
    name: string;
    assigned: number;
    completed: number;
    inProgress: number;
  }>;
  jobTrends: Array<{
    date: string;
    created: number;
    completed: number;
    cancelled: number;
  }>;
}

interface StatCard {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

interface PriorityStats {
  priority: JobPriority;
  count: number;
  color: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  
  const { data: stats, isLoading } = useQuery<DashboardStats>('dashboard-stats', async () => {
    return await dashboardService.getStats();
  });

  const { data: recentJobs } = useQuery<Job[]>('recent-jobs', async () => {
    return await dashboardService.getRecentJobs();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Jobs',
      value: stats?.activeJobs || 0,
      icon: Briefcase,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Jobs',
      value: stats?.pendingJobs || 0,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Completed Today',
      value: stats?.completedToday || 0,
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
  ];

  const priorityStats: PriorityStats[] = [
    { priority: 'High', count: stats?.highPriority || 0, color: 'text-red-600' },
    { priority: 'Medium', count: stats?.mediumPriority || 0, color: 'text-yellow-600' },
    { priority: 'Low', count: stats?.lowPriority || 0, color: 'text-green-600' },
  ];

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

  const handleNavigateToCustomers = (): void => {
    navigate('/customers');
  };

  const handleNavigateToJobs = (): void => {
    navigate('/jobs');
  };

  // Prepare chart data
  const jobStatusData = stats?.jobStatusDistribution?.map(item => ({
    status: item.status,
    count: item.count,
    color: item.status === 'completed' ? '#10b981' :
           item.status === 'in_progress' ? '#f59e0b' :
           item.status === 'pending' ? '#3b82f6' :
           item.status === 'assigned' ? '#8b5cf6' : '#ef4444'
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Visualization Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Job Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Status Distribution</h3>
          {jobStatusData.length > 0 ? (
            <JobStatusChart data={jobStatusData} />
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No data available
            </div>
          )}
        </div>

        {/* Technician Workload */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Technician Workload</h3>
          {stats?.technicianWorkload && stats.technicianWorkload.length > 0 ? (
            <TechnicianWorkloadChart data={stats.technicianWorkload} />
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Job Trends and Additional Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Job Trends */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Trends (Last 30 Days)</h3>
          {stats?.jobTrends && stats.jobTrends.length > 0 ? (
            <JobTrendChart data={stats.jobTrends} />
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No data available
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Priority Distribution</h3>
          <div className="space-y-4">
            {priorityStats.map((item) => (
              <div key={item.priority} className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className={`h-5 w-5 ${item.color} mr-2`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.priority} Priority</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Jobs and Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Jobs</h3>
            <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            {recentJobs?.map((job) => (
              <div key={job.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{job.jobName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{job.Customer?.name}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getStatusColor(job.status || 'Pending')
                  }`}>
                    {job.status || 'Pending'}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                  </p>
                </div>
              </div>
            ))}
            {!recentJobs?.length && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent jobs</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={handleNavigateToCustomers}
              className="text-left p-4 rounded-lg border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
            >
              <Users className="h-6 w-6 text-primary-600 dark:text-primary-400 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Add New Customer</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create a new customer profile</p>
            </button>
            <button 
              onClick={handleNavigateToJobs}
              className="text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Briefcase className="h-6 w-6 text-gray-600 dark:text-gray-400 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Create New Job</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Schedule a new service job</p>
            </button>
            <button 
              onClick={handleNavigateToJobs}
              className="text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Calendar className="h-6 w-6 text-gray-600 dark:text-gray-400 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">View Schedule</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check today's schedule</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}