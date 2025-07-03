import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { 
    dashboardStats, 
    systemHealth, 
    recentActivity, 
    loading, 
    refreshDashboard,
    formatCurrency,
    formatNumber,
    formatPercentage,
    getDerivedStats 
  } = useAdmin();

  const [timeRange, setTimeRange] = useState('today');
  const derivedStats = getDerivedStats();

  const statCards = [
    {
      name: 'Total Users',
      value: formatNumber(dashboardStats.totalUsers),
      change: '+12%',
      changeType: 'increase',
      icon: '👥',
      color: 'blue',
      action: () => navigate('/users'),
    },
    {
      name: 'Active Jobs',
      value: formatNumber(dashboardStats.activeJobs),
      change: '+8%',
      changeType: 'increase',
      icon: '🔧',
      color: 'green',
      action: () => navigate('/jobs'),
    },
    {
      name: 'Monthly Revenue',
      value: formatCurrency(dashboardStats.monthlyRevenue),
      change: derivedStats.revenueGrowth > 0 ? `+${formatPercentage(derivedStats.revenueGrowth)}` : 'N/A',
      changeType: derivedStats.revenueGrowth > 0 ? 'increase' : 'neutral',
      icon: '💰',
      color: 'emerald',
      action: () => navigate('/reports'),
    },
    {
      name: 'Completion Rate',
      value: formatPercentage(derivedStats.jobCompletionRate),
      change: '+5%',
      changeType: 'increase',
      icon: '✅',
      color: 'purple',
      action: () => navigate('/analytics'),
    },
  ];

  const quickActions = [
    {
      name: 'Create Job',
      description: 'Schedule a new service job',
      icon: '📋',
      color: 'blue',
      action: () => navigate('/jobs?action=create'),
    },
    {
      name: 'Add Technician',
      description: 'Register a new technician',
      icon: '👨‍🔧',
      color: 'green',
      action: () => navigate('/users?action=create&role=technician'),
    },
    {
      name: 'Optimize Routes',
      description: 'Plan efficient daily routes',
      icon: '🗺️',
      color: 'purple',
      action: () => navigate('/routes'),
    },
    {
      name: 'View Reports',
      description: 'Generate business reports',
      icon: '📊',
      color: 'orange',
      action: () => navigate('/reports'),
    },
  ];

  const getChangeColor = (changeType) => {
    const colors = {
      increase: 'text-green-600',
      decrease: 'text-red-600',
      neutral: 'text-gray-600',
    };
    return colors[changeType] || colors.neutral;
  };

  const getChangeIcon = (changeType) => {
    if (changeType === 'increase') return '↗️';
    if (changeType === 'decrease') return '↘️';
    return '➡️';
  };

  const formatActivityTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="animate-pulse h-8 w-24 bg-gray-300 rounded"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-300 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          
          <button
            onClick={refreshDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* System Health Alert */}
      {systemHealth.status !== 'healthy' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                System status: <span className="font-medium capitalize">{systemHealth.status}</span>
                {systemHealth.errors > 0 && ` • ${systemHealth.errors} recent errors`}
              </p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => navigate('/monitoring')}
                className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
              >
                View Details →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            onClick={stat.action}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
            
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                {getChangeIcon(stat.changeType)} {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action.name}
                  onClick={action.action}
                  className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className={`w-10 h-10 bg-${action.color}-100 rounded-lg flex items-center justify-center mr-3`}>
                    <span className="text-lg">{action.icon}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{action.name}</div>
                    <div className="text-sm text-gray-600">{action.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <button
                onClick={() => navigate('/monitoring')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-sm">
                        {activity.type === 'job' ? '📋' : 
                         activity.type === 'user' ? '👤' : 
                         activity.type === 'route' ? '🗺️' : '📊'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user_name}</span>
                        {' '}{activity.action}
                        {activity.target && (
                          <span className="font-medium"> {activity.target}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{formatActivityTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-2 block">📊</span>
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Technician Utilization</h4>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatPercentage(derivedStats.technicianUtilization * 20)} {/* Rough calculation */}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${Math.min(derivedStats.technicianUtilization * 20, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Avg Revenue per Job</h4>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(derivedStats.averageRevenuePerJob)}
          </div>
          <div className="text-sm text-green-600 mt-1">+15% from last month</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Fuel Costs</h4>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(dashboardStats.fuelCosts)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            {formatPercentage(dashboardStats.routeEfficiency)} efficiency
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;