import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

const Reports = () => {
  const { apiRequest, hasPermission } = useAuth();
  const { formatCurrency, formatNumber, formatPercentage } = useAdmin();
  
  const [activeTab, setActiveTab] = useState('financial');
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState({
    financial: {},
    operational: {},
    customer: {},
    technician: {}
  });

  const tabs = [
    { id: 'financial', name: 'Financial', icon: '💰' },
    { id: 'operational', name: 'Operational', icon: '⚙️' },
    { id: 'customer', name: 'Customer', icon: '👥' },
    { id: 'technician', name: 'Technician', icon: '🔧' }
  ];

  useEffect(() => {
    fetchReportData();
  }, [timeRange, activeTab]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/admin/reports/${activeTab}?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(prev => ({
          ...prev,
          [activeTab]: data.data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      // Set mock data for demonstration
      setReportData(prev => ({
        ...prev,
        [activeTab]: getMockData(activeTab)
      }));
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (tab) => {
    switch (tab) {
      case 'financial':
        return {
          revenue: {
            total: 485000,
            recurring: 320000,
            oneTime: 165000,
            growth: 12.5,
            projectedAnnual: 5820000
          },
          expenses: {
            total: 285000,
            labor: 180000,
            materials: 65000,
            fuel: 25000,
            overhead: 15000
          },
          profit: {
            gross: 200000,
            net: 145000,
            margin: 29.9
          },
          trends: {
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            revenue: [35000, 38000, 42000, 45000, 48000, 52000],
            profit: [8000, 9500, 11000, 12500, 14000, 15500]
          }
        };
      case 'operational':
        return {
          efficiency: {
            jobCompletionRate: 94.5,
            onTimePerformance: 87.2,
            firstTimeFixRate: 82.1,
            technicianUtilization: 78.5
          },
          jobs: {
            total: 1250,
            completed: 1180,
            cancelled: 45,
            rescheduled: 25,
            avgDuration: 2.5
          },
          routes: {
            totalMiles: 15420,
            fuelSavings: 3250,
            efficiencyImprovement: 22.8,
            avgJobsPerRoute: 4.2
          }
        };
      case 'customer':
        return {
          satisfaction: {
            overall: 4.6,
            responseTime: 4.3,
            workQuality: 4.8,
            communication: 4.4,
            pricing: 4.1
          },
          retention: {
            rate: 89.2,
            newCustomers: 145,
            returningCustomers: 820,
            churnRate: 10.8
          },
          feedback: {
            totalReviews: 485,
            fiveStars: 325,
            fourStars: 110,
            threeStars: 35,
            twoStars: 10,
            oneStars: 5
          }
        };
      case 'technician':
        return {
          performance: {
            avgJobsPerDay: 4.2,
            avgJobDuration: 145,
            completionRate: 96.8,
            customerRating: 4.7
          },
          productivity: {
            billableHours: 1650,
            utilization: 78.5,
            overtime: 125,
            efficiency: 92.3
          },
          topPerformers: [
            { name: 'John Smith', jobs: 145, rating: 4.9, efficiency: 95 },
            { name: 'Sarah Johnson', jobs: 138, rating: 4.8, efficiency: 93 },
            { name: 'Mike Wilson', jobs: 132, rating: 4.7, efficiency: 91 }
          ]
        };
      default:
        return {};
    }
  };

  const generateReport = async (format) => {
    try {
      setGenerating(true);
      const response = await apiRequest('/admin/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: activeTab,
          timeRange,
          format
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}-report-${timeRange}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const renderFinancialReport = () => {
    const data = reportData.financial;
    if (!data || !data.revenue) return null;

    return (
      <div className="space-y-6">
        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-semibold">{formatCurrency(data.revenue.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recurring</span>
                <span>{formatCurrency(data.revenue.recurring)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">One-time</span>
                <span>{formatCurrency(data.revenue.oneTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Growth Rate</span>
                <span className="text-green-600">+{formatPercentage(data.revenue.growth)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Expenses</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Expenses</span>
                <span className="font-semibold">{formatCurrency(data.expenses.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Labor</span>
                <span>{formatCurrency(data.expenses.labor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Materials</span>
                <span>{formatCurrency(data.expenses.materials)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fuel</span>
                <span>{formatCurrency(data.expenses.fuel)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Profitability</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Gross Profit</span>
                <span className="font-semibold text-green-600">{formatCurrency(data.profit.gross)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Net Profit</span>
                <span className="text-green-600">{formatCurrency(data.profit.net)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profit Margin</span>
                <span className="text-green-600">{formatPercentage(data.profit.margin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Projected Annual</span>
                <span>{formatCurrency(data.revenue.projectedAnnual)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Profit Trends</h4>
          <div className="h-64 flex items-end justify-between space-x-2">
            {data.trends.months.map((month, index) => (
              <div key={month} className="flex flex-col items-center flex-1">
                <div className="flex flex-col items-center space-y-1 w-full">
                  <div 
                    className="bg-blue-500 w-8 rounded-t"
                    style={{ 
                      height: `${(data.trends.revenue[index] / Math.max(...data.trends.revenue)) * 180}px` 
                    }}
                  ></div>
                  <div 
                    className="bg-green-500 w-6 rounded-t"
                    style={{ 
                      height: `${(data.trends.profit[index] / Math.max(...data.trends.profit)) * 100}px` 
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{month}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Profit</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOperationalReport = () => {
    const data = reportData.operational;
    if (!data || !data.efficiency) return null;

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{formatPercentage(data.efficiency.jobCompletionRate)}</div>
            <div className="text-sm text-gray-600">Job Completion Rate</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{formatPercentage(data.efficiency.onTimePerformance)}</div>
            <div className="text-sm text-gray-600">On-Time Performance</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{formatPercentage(data.efficiency.firstTimeFixRate)}</div>
            <div className="text-sm text-gray-600">First-Time Fix Rate</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{formatPercentage(data.efficiency.technicianUtilization)}</div>
            <div className="text-sm text-gray-600">Technician Utilization</div>
          </div>
        </div>

        {/* Job Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Job Statistics</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Jobs</span>
                <span className="font-semibold">{formatNumber(data.jobs.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(data.jobs.completed / data.jobs.total * 100)}%` }}
                    ></div>
                  </div>
                  <span>{formatNumber(data.jobs.completed)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cancelled</span>
                <span className="text-red-600">{formatNumber(data.jobs.cancelled)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Duration</span>
                <span>{data.jobs.avgDuration}h</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Route Efficiency</h4>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Miles</span>
                <span className="font-semibold">{formatNumber(data.routes.totalMiles)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fuel Savings</span>
                <span className="text-green-600">{formatCurrency(data.routes.fuelSavings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Efficiency Improvement</span>
                <span className="text-green-600">+{formatPercentage(data.routes.efficiencyImprovement)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Jobs per Route</span>
                <span>{data.routes.avgJobsPerRoute}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerReport = () => {
    const data = reportData.customer;
    if (!data || !data.satisfaction) return null;

    return (
      <div className="space-y-6">
        {/* Satisfaction Metrics */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Satisfaction</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {Object.entries(data.satisfaction).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{value}/5</div>
                <div className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention & Growth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Retention</h4>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Retention Rate</span>
                <span className="font-semibold text-green-600">{formatPercentage(data.retention.rate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New Customers</span>
                <span>{formatNumber(data.retention.newCustomers)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Returning Customers</span>
                <span>{formatNumber(data.retention.returningCustomers)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Churn Rate</span>
                <span className="text-red-600">{formatPercentage(data.retention.churnRate)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Review Distribution</h4>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = data.feedback[`${['', 'one', 'two', 'three', 'four', 'five'][stars]}Stars`];
                const percentage = (count / data.feedback.totalReviews) * 100;
                return (
                  <div key={stars} className="flex items-center space-x-3">
                    <span className="text-sm w-8">{stars}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm w-12">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTechnicianReport = () => {
    const data = reportData.technician;
    if (!data || !data.performance) return null;

    return (
      <div className="space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{data.performance.avgJobsPerDay}</div>
            <div className="text-sm text-gray-600">Avg Jobs/Day</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{data.performance.avgJobDuration}m</div>
            <div className="text-sm text-gray-600">Avg Duration</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{formatPercentage(data.performance.completionRate)}</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{data.performance.customerRating}/5</div>
            <div className="text-sm text-gray-600">Customer Rating</div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Technician</th>
                  <th className="text-center py-2">Jobs Completed</th>
                  <th className="text-center py-2">Customer Rating</th>
                  <th className="text-center py-2">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {data.topPerformers.map((tech, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <span className="font-medium">{tech.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3">{tech.jobs}</td>
                    <td className="text-center py-3">{tech.rating}/5</td>
                    <td className="text-center py-3">{formatPercentage(tech.efficiency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'financial':
        return renderFinancialReport();
      case 'operational':
        return renderOperationalReport();
      case 'customer':
        return renderCustomerReport();
      case 'technician':
        return renderTechnicianReport();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Comprehensive business intelligence and analytics</p>
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
          
          {hasPermission('reports.export') && (
            <div className="flex space-x-2">
              <button
                onClick={() => generateReport('pdf')}
                disabled={generating}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 transition-colors text-sm"
              >
                Export PDF
              </button>
              <button
                onClick={() => generateReport('excel')}
                disabled={generating}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 transition-colors text-sm"
              >
                Export Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;