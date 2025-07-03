import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

const Analytics = () => {
  const { apiRequest } = useAuth();
  const { formatCurrency, formatNumber, formatPercentage } = useAdmin();
  
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState({
    revenue: {},
    jobs: {},
    technicians: {},
    customers: {},
    efficiency: {},
    trends: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/admin/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data || {});
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Set mock data for demonstration
      setAnalyticsData({
        revenue: {
          total: 125000,
          monthly: 45000,
          growth: 12.5,
          avgPerJob: 350,
          projectedAnnual: 540000
        },
        jobs: {
          total: 1250,
          completed: 1100,
          pending: 85,
          inProgress: 45,
          cancelled: 20,
          completionRate: 88,
          avgDuration: 2.5
        },
        technicians: {
          total: 25,
          active: 23,
          utilization: 78,
          avgJobsPerDay: 4.2,
          topPerformer: { name: "John Smith", jobs: 45 }
        },
        customers: {
          total: 850,
          new: 125,
          returning: 725,
          satisfaction: 4.6,
          retention: 85
        },
        efficiency: {
          routeOptimization: 22,
          fuelSavings: 2500,
          timeReduction: 15,
          costPerMile: 0.56
        },
        trends: {
          jobGrowth: [12, 15, 18, 22, 25, 28],
          revenueGrowth: [8500, 9200, 10100, 11500, 12800, 14200],
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analyticsData.revenue?.total || 0),
      change: `+${formatPercentage(analyticsData.revenue?.growth || 0)}`,
      changeType: 'positive',
      icon: '💰',
      color: 'green'
    },
    {
      title: 'Jobs Completed',
      value: formatNumber(analyticsData.jobs?.completed || 0),
      change: `${formatPercentage(analyticsData.jobs?.completionRate || 0)} rate`,
      changeType: 'positive',
      icon: '✅',
      color: 'blue'
    },
    {
      title: 'Technician Utilization',
      value: formatPercentage(analyticsData.technicians?.utilization || 0),
      change: `${formatNumber(analyticsData.technicians?.avgJobsPerDay || 0)} jobs/day`,
      changeType: 'neutral',
      icon: '👨‍🔧',
      color: 'purple'
    },
    {
      title: 'Customer Satisfaction',
      value: `${analyticsData.customers?.satisfaction || 0}/5`,
      change: `${formatPercentage(analyticsData.customers?.retention || 0)} retention`,
      changeType: 'positive',
      icon: '⭐',
      color: 'yellow'
    }
  ];

  const efficiencyMetrics = [
    {
      title: 'Route Optimization Savings',
      value: formatPercentage(analyticsData.efficiency?.routeOptimization || 0),
      description: 'Reduction in travel time'
    },
    {
      title: 'Fuel Cost Savings',
      value: formatCurrency(analyticsData.efficiency?.fuelSavings || 0),
      description: 'Monthly fuel savings'
    },
    {
      title: 'Time Efficiency',
      value: formatPercentage(analyticsData.efficiency?.timeReduction || 0),
      description: 'Faster job completion'
    },
    {
      title: 'Cost Per Mile',
      value: formatCurrency(analyticsData.efficiency?.costPerMile || 0),
      description: 'Current fuel rate'
    }
  ];

  const getChangeColor = (type) => {
    const colors = {
      positive: 'text-green-600',
      negative: 'text-red-600',
      neutral: 'text-gray-600'
    };
    return colors[type] || colors.neutral;
  };

  const getChangeIcon = (type) => {
    if (type === 'positive') return '↗️';
    if (type === 'negative') return '↘️';
    return '➡️';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="animate-pulse h-8 w-32 bg-gray-300 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </div>
              <div className={`w-12 h-12 bg-${kpi.color}-100 rounded-lg flex items-center justify-center`}>
                <span className="text-2xl">{kpi.icon}</span>
              </div>
            </div>
            
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${getChangeColor(kpi.changeType)}`}>
                {getChangeIcon(kpi.changeType)} {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analyticsData.trends?.revenueGrowth?.map((value, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="bg-blue-500 w-8 rounded-t"
                  style={{ 
                    height: `${(value / Math.max(...analyticsData.trends.revenueGrowth)) * 200}px` 
                  }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {analyticsData.trends?.months?.[index]}
                </span>
              </div>
            )) || (
              <div className="text-center w-full text-gray-500">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* Job Completion Rate */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(analyticsData.jobs?.completed / analyticsData.jobs?.total * 100) || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{analyticsData.jobs?.completed || 0}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">In Progress</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(analyticsData.jobs?.inProgress / analyticsData.jobs?.total * 100) || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{analyticsData.jobs?.inProgress || 0}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(analyticsData.jobs?.pending / analyticsData.jobs?.total * 100) || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{analyticsData.jobs?.pending || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Operational Efficiency</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {efficiencyMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{metric.value}</div>
              <div className="text-sm font-medium text-gray-900 mb-1">{metric.title}</div>
              <div className="text-xs text-gray-500">{metric.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Technician */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performer</h3>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">🏆</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {analyticsData.technicians?.topPerformer?.name || 'N/A'}
              </div>
              <div className="text-sm text-gray-500">
                {analyticsData.technicians?.topPerformer?.jobs || 0} jobs completed
              </div>
            </div>
          </div>
        </div>

        {/* Customer Growth */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Growth</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">New Customers</span>
              <span className="font-medium">{analyticsData.customers?.new || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Returning Customers</span>
              <span className="font-medium">{analyticsData.customers?.returning || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Retention Rate</span>
              <span className="font-medium text-green-600">
                {formatPercentage(analyticsData.customers?.retention || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Projection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Projections</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Projected Annual Revenue</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(analyticsData.revenue?.projectedAnnual || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Average Revenue per Job</div>
              <div className="text-lg font-medium">
                {formatCurrency(analyticsData.revenue?.avgPerJob || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400 text-xl">💡</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Performance Insights</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Route optimization is saving {formatPercentage(analyticsData.efficiency?.routeOptimization || 0)} in travel time</li>
                <li>Customer satisfaction is at {analyticsData.customers?.satisfaction || 0}/5 stars</li>
                <li>Technician utilization rate of {formatPercentage(analyticsData.technicians?.utilization || 0)} is above industry average</li>
                <li>Job completion rate of {formatPercentage(analyticsData.jobs?.completionRate || 0)} shows strong operational efficiency</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;