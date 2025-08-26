import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import api from '../utils/api.ts';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const { data: stats, isLoading } = useQuery('dashboard-stats', async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  });

  const { data: recentJobs } = useQuery('recent-jobs', async () => {
    const response = await api.get('/jobs?limit=5');
    return response.data.jobs;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
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

  const priorityStats = [
    { priority: 'High', count: stats?.highPriority || 0, color: 'text-red-600' },
    { priority: 'Medium', count: stats?.mediumPriority || 0, color: 'text-yellow-600' },
    { priority: 'Low', count: stats?.lowPriority || 0, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Priority Distribution</h3>
          <div className="space-y-4">
            {priorityStats.map((item) => (
              <div key={item.priority} className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className={`h-5 w-5 ${item.color} mr-2`} />
                  <span className="text-sm font-medium text-gray-900">{item.priority} Priority</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentJobs?.map((job) => (
              <div key={job.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{job.jobName}</p>
                  <p className="text-sm text-gray-500">{job.Customer?.name}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                  </p>
                </div>
              </div>
            ))}
            {!recentJobs?.length && (
              <p className="text-sm text-gray-500 text-center py-4">No recent jobs</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/customers')}
            className="btn btn-primary text-left p-4 rounded-lg border border-primary-200 hover:bg-primary-50"
          >
            <Users className="h-6 w-6 text-primary-600 mb-2" />
            <h4 className="font-medium text-gray-900">Add New Customer</h4>
            <p className="text-sm text-gray-500">Create a new customer profile</p>
          </button>
          <button 
            onClick={() => navigate('/jobs')}
            className="btn btn-secondary text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <Briefcase className="h-6 w-6 text-gray-600 mb-2" />
            <h4 className="font-medium text-gray-900">Create New Job</h4>
            <p className="text-sm text-gray-500">Schedule a new service job</p>
          </button>
          <button 
            onClick={() => navigate('/jobs')}
            className="btn btn-secondary text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <Calendar className="h-6 w-6 text-gray-600 mb-2" />
            <h4 className="font-medium text-gray-900">View Schedule</h4>
            <p className="text-sm text-gray-500">Check today's schedule</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;