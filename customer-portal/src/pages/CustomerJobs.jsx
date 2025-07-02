import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Page, Section } from '../../../shared/components/Layout';
import { Card, CardContent, JobCard } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { SearchInput, FormGroup } from '../../../shared/components/Input';
import { useAuth } from '../contexts/AuthContext';
import { useResponsiveContext } from '../../../shared/components/ResponsiveProvider';
import { useNotifications } from '../../../shared/components/NotificationHub';
import { API_ENDPOINTS, JOB_STATUSES, STATUS_CONFIG } from '../../../shared/types/index.js';

/**
 * Customer Jobs Page
 * Complete job listing and filtering for customers
 */

const CustomerJobs = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, apiRequest } = useAuth();
  const { responsive } = useResponsiveContext();
  const { showError } = useNotifications();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, sortBy]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        customer_id: user.id,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sort: sortBy,
        limit: 50,
      });

      const response = await apiRequest(`${API_ENDPOINTS.JOBS.LIST}?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data.data || []);
      } else {
        throw new Error('Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showError('Error', 'Failed to load your jobs. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleSearchClear = () => {
    setSearchTerm('');
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    if (status === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
  };

  const handleJobClick = (job) => {
    navigate(`/jobs/${job.id}`);
  };

  const handleNewRequest = () => {
    navigate('/new-request');
  };

  // Filter jobs based on search term
  const filteredJobs = jobs.filter(job => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      job.title?.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower) ||
      job.technician_name?.toLowerCase().includes(searchLower) ||
      job.id?.toString().includes(searchLower)
    );
  });

  // Group jobs by status for better organization
  const groupedJobs = filteredJobs.reduce((groups, job) => {
    const status = job.status || 'pending';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(job);
    return groups;
  }, {});

  const StatusFilterButton = ({ status, label, count }) => (
    <Button
      variant={statusFilter === status ? 'primary' : 'outline'}
      size={responsive.isMobile ? 'sm' : 'md'}
      onClick={() => handleStatusFilter(status)}
      className={responsive.isMobile ? 'flex-1' : ''}
    >
      {label}
      {count > 0 && (
        <span className="ml-2 bg-white bg-opacity-20 rounded-full px-2 py-0.5 text-xs">
          {count}
        </span>
      )}
    </Button>
  );

  const JobGroup = ({ status, jobs, title }) => {
    if (jobs.length === 0) return null;

    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    return (
      <Section
        title={
          <div className="flex items-center space-x-2">
            <span className="text-lg">{statusConfig.icon}</span>
            <span>{title}</span>
            <span className="bg-st-gray-100 text-st-gray-600 px-2 py-1 rounded-full text-sm">
              {jobs.length}
            </span>
          </div>
        }
        variant="card"
      >
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => handleJobClick(job)}
              showCustomer={false}
              showTechnician={true}
              compact={responsive.isMobile}
            />
          ))}
        </div>
      </Section>
    );
  };

  const EmptyState = () => (
    <Card variant="default" className="text-center py-12">
      <CardContent>
        <div className="w-16 h-16 bg-st-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-st-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-st-text-primary mb-2">
          {searchTerm ? 'No Matching Jobs' : 'No Service Requests Yet'}
        </h3>
        <p className="text-st-text-secondary mb-6">
          {searchTerm 
            ? `No jobs found matching "${searchTerm}"`
            : 'Ready to get started? Create your first service request.'
          }
        </p>
        {!searchTerm && (
          <Button
            variant="primary"
            onClick={handleNewRequest}
          >
            Create Service Request
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Page 
        title="My Jobs" 
        subtitle="Your service requests and history"
        variant={responsive.getLayoutVariant()}
      >
        <Section>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-st-gray-200 animate-pulse rounded-lg h-32"></div>
            ))}
          </div>
        </Section>
      </Page>
    );
  }

  // Calculate status counts
  const statusCounts = Object.values(JOB_STATUSES).reduce((counts, status) => {
    counts[status] = jobs.filter(job => job.status === status).length;
    return counts;
  }, {});

  const allCount = jobs.length;

  return (
    <Page 
      title="My Jobs" 
      subtitle={`${allCount} service request${allCount !== 1 ? 's' : ''}`}
      variant={responsive.getLayoutVariant()}
      headerContent={
        !responsive.isMobile && (
          <Button
            variant="primary"
            onClick={handleNewRequest}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Request
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <Section>
          <div className="space-y-4">
            {/* Search */}
            <FormGroup>
              <SearchInput
                placeholder="Search jobs by title, description, or technician..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onClear={handleSearchClear}
                size={responsive.isMobile ? 'lg' : 'md'}
              />
            </FormGroup>

            {/* Status Filters */}
            <div className={`flex ${responsive.isMobile ? 'flex-wrap' : ''} gap-2`}>
              <StatusFilterButton
                status="all"
                label="All Jobs"
                count={allCount}
              />
              <StatusFilterButton
                status="pending"
                label="Pending"
                count={statusCounts.pending || 0}
              />
              <StatusFilterButton
                status="in_progress"
                label="In Progress"
                count={statusCounts.in_progress || 0}
              />
              <StatusFilterButton
                status="completed"
                label="Completed"
                count={statusCounts.completed || 0}
              />
            </div>

            {/* Sort Options */}
            {!responsive.isMobile && (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-st-text-secondary">Sort by:</span>
                <div className="flex space-x-2">
                  <Button
                    variant={sortBy === 'newest' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleSortChange('newest')}
                  >
                    Newest
                  </Button>
                  <Button
                    variant={sortBy === 'oldest' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleSortChange('oldest')}
                  >
                    Oldest
                  </Button>
                  <Button
                    variant={sortBy === 'priority' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleSortChange('priority')}
                  >
                    Priority
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Mobile New Request Button */}
        {responsive.isMobile && (
          <Section>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleNewRequest}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Service Request
            </Button>
          </Section>
        )}

        {/* Jobs Display */}
        {filteredJobs.length === 0 ? (
          <EmptyState />
        ) : statusFilter === 'all' ? (
          // Group by status when showing all
          <div className="space-y-6">
            <JobGroup
              status="in_progress"
              jobs={groupedJobs.in_progress || []}
              title="In Progress"
            />
            <JobGroup
              status="pending"
              jobs={groupedJobs.pending || []}
              title="Pending"
            />
            <JobGroup
              status="completed"
              jobs={groupedJobs.completed || []}
              title="Completed"
            />
            <JobGroup
              status="cancelled"
              jobs={groupedJobs.cancelled || []}
              title="Cancelled"
            />
            <JobGroup
              status="on_hold"
              jobs={groupedJobs.on_hold || []}
              title="On Hold"
            />
          </div>
        ) : (
          // Single list when filtering by status
          <Section>
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => handleJobClick(job)}
                  showCustomer={false}
                  showTechnician={true}
                  compact={responsive.isMobile}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Mobile Sort Options */}
        {responsive.isMobile && filteredJobs.length > 0 && (
          <Section title="Sort Options">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={sortBy === 'newest' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('newest')}
              >
                Newest
              </Button>
              <Button
                variant={sortBy === 'oldest' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('oldest')}
              >
                Oldest
              </Button>
              <Button
                variant={sortBy === 'priority' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('priority')}
              >
                Priority
              </Button>
            </div>
          </Section>
        )}
      </div>
    </Page>
  );
};

export default CustomerJobs;