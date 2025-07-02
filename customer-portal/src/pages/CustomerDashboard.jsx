import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Section, Grid } from '../../../shared/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, JobCard } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useResponsiveContext } from '../../../shared/components/ResponsiveProvider';
import { useNotifications } from '../../../shared/components/NotificationHub';
import { API_ENDPOINTS } from '../../../shared/types/index.js';

/**
 * Customer Dashboard
 * Overview of jobs, requests, and quick actions
 */

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, apiRequest } = useAuth();
  const { responsive } = useResponsiveContext();
  const { showError } = useNotifications();
  
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeJobs: 0,
      completedJobs: 0,
      pendingRequests: 0,
      totalSpent: 0,
    },
    recentJobs: [],
    upcomingJobs: [],
    loading: true,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.DASHBOARD.STATS);
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(prev => ({
          ...prev,
          ...data.data,
          loading: false,
        }));
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      showError('Error', 'Failed to load dashboard data. Please refresh the page.');
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', onClick }) => (
    <Card
      variant="elevated"
      interactive={!!onClick}
      onClick={onClick}
      className="h-full"
    >
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-st-text-secondary">{title}</p>
            <p className={`text-2xl font-bold text-st-${color}-600 mt-1`}>
              {typeof value === 'number' && title.includes('$') ? `$${value.toLocaleString()}` : value}
            </p>
          </div>
          <div className={`w-12 h-12 bg-st-${color}-100 rounded-lg flex items-center justify-center`}>
            <div className={`text-st-${color}-600 text-xl`}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ title, description, icon, onClick, color = 'primary' }) => (
    <Card
      variant="default"
      interactive
      onClick={onClick}
      className="h-full hover:border-st-primary-300 transition-colors"
    >
      <CardContent>
        <div className="text-center space-y-3">
          <div className={`w-12 h-12 bg-st-${color}-100 rounded-lg flex items-center justify-center mx-auto`}>
            <div className={`text-st-${color}-600 text-xl`}>
              {icon}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-st-text-primary">{title}</h3>
            <p className="text-sm text-st-text-secondary mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (dashboardData.loading) {
    return (
      <Page title="Dashboard" variant={responsive.getLayoutVariant()}>
        <div className="space-y-6">
          {/* Loading skeleton */}
          <Grid cols={responsive.isMobile ? 2 : 4} gap={4}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-st-gray-200 animate-pulse rounded-lg h-24"></div>
            ))}
          </Grid>
          <div className="bg-st-gray-200 animate-pulse rounded-lg h-64"></div>
        </div>
      </Page>
    );
  }

  return (
    <Page 
      title={`Welcome back, ${user?.name?.split(' ')[0] || 'Customer'}!`}
      subtitle="Here's what's happening with your service requests"
      variant={responsive.getLayoutVariant()}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <Section title="Overview">
          <Grid cols={responsive.isMobile ? 2 : 4} gap={4}>
            <StatCard
              title="Active Jobs"
              value={dashboardData.stats.activeJobs}
              icon="🔧"
              color="info"
              onClick={() => navigate('/jobs?status=active')}
            />
            <StatCard
              title="Completed"
              value={dashboardData.stats.completedJobs}
              icon="✅"
              color="success"
              onClick={() => navigate('/jobs?status=completed')}
            />
            <StatCard
              title="Pending Requests"
              value={dashboardData.stats.pendingRequests}
              icon="⏳"
              color="warning"
              onClick={() => navigate('/jobs?status=pending')}
            />
            <StatCard
              title="Total Spent"
              value={dashboardData.stats.totalSpent}
              icon="💰"
              color="primary"
            />
          </Grid>
        </Section>

        {/* Quick Actions */}
        <Section title="Quick Actions">
          <Grid cols={responsive.isMobile ? 1 : 3} gap={4}>
            <QuickActionCard
              title="New Service Request"
              description="Request a new service or repair"
              icon="➕"
              onClick={() => navigate('/new-request')}
              color="primary"
            />
            <QuickActionCard
              title="View All Jobs"
              description="See all your service history"
              icon="📋"
              onClick={() => navigate('/jobs')}
              color="info"
            />
            <QuickActionCard
              title="Contact Support"
              description="Get help or ask questions"
              icon="💬"
              onClick={() => navigate('/support')}
              color="accent"
            />
          </Grid>
        </Section>

        {/* Recent Jobs */}
        {dashboardData.recentJobs && dashboardData.recentJobs.length > 0 && (
          <Section 
            title="Recent Jobs"
            headerContent={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/jobs')}
              >
                View All
              </Button>
            }
          >
            <div className="space-y-4">
              {dashboardData.recentJobs.slice(0, responsive.isMobile ? 3 : 5).map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  showTechnician={true}
                  showCustomer={false}
                  compact={responsive.isMobile}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Upcoming Jobs */}
        {dashboardData.upcomingJobs && dashboardData.upcomingJobs.length > 0 && (
          <Section title="Upcoming Appointments">
            <div className="space-y-4">
              {dashboardData.upcomingJobs.map((job) => (
                <Card key={job.id} variant="outlined" className="border-st-info-200 bg-st-info-50">
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-st-text-primary">{job.title}</h4>
                        <p className="text-sm text-st-text-secondary mt-1">
                          {new Date(job.scheduled_date).toLocaleDateString()} at {job.scheduled_time}
                        </p>
                        {job.technician_name && (
                          <p className="text-sm text-st-text-secondary">
                            Technician: {job.technician_name}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Empty State */}
        {(!dashboardData.recentJobs || dashboardData.recentJobs.length === 0) && (
          <Section>
            <Card variant="default" className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-st-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-st-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-st-text-primary mb-2">
                  No Service Requests Yet
                </h3>
                <p className="text-st-text-secondary mb-6">
                  Ready to get started? Create your first service request.
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/new-request')}
                >
                  Create Service Request
                </Button>
              </CardContent>
            </Card>
          </Section>
        )}
      </div>
    </Page>
  );
};

export default CustomerDashboard;