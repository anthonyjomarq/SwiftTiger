import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, Section, Grid } from '../../../shared/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useResponsiveContext } from '../../../shared/components/ResponsiveProvider';
import { useNotifications } from '../../../shared/components/NotificationHub';
import { API_ENDPOINTS, STATUS_CONFIG, PRIORITY_CONFIG } from '../../../shared/types/index.js';

/**
 * Customer Job Detail Page
 * Complete job details and interaction for customers
 */

const CustomerJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, apiRequest } = useAuth();
  const { responsive } = useResponsiveContext();
  const { showError, showSuccess } = useNotifications();

  const [job, setJob] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [showContactTechnician, setShowContactTechnician] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
      fetchJobUpdates();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(API_ENDPOINTS.JOBS.GET(id));
      
      if (response.ok) {
        const data = await response.json();
        setJob(data.data);
      } else if (response.status === 404) {
        showError('Job Not Found', 'The requested job could not be found.');
        navigate('/jobs');
      } else {
        throw new Error('Failed to fetch job details');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      showError('Error', 'Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobUpdates = async () => {
    try {
      setUpdatesLoading(true);
      const response = await apiRequest(API_ENDPOINTS.JOBS.UPDATES(id));
      
      if (response.ok) {
        const data = await response.json();
        setUpdates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching job updates:', error);
    } finally {
      setUpdatesLoading(false);
    }
  };

  const handleContactTechnician = () => {
    if (job?.technician_phone) {
      window.location.href = `tel:${job.technician_phone}`;
    } else if (job?.technician_email) {
      window.location.href = `mailto:${job.technician_email}`;
    } else {
      setShowContactTechnician(true);
    }
  };

  const handleRateService = () => {
    // TODO: Implement rating modal
    showSuccess('Thank you!', 'Service rating feature coming soon.');
  };

  const handleRequestReschedule = () => {
    // TODO: Implement reschedule request
    showSuccess('Request Sent', 'Your reschedule request has been sent to our team.');
  };

  const handleCancelJob = () => {
    // TODO: Implement job cancellation
    if (window.confirm('Are you sure you want to cancel this service request?')) {
      showSuccess('Request Sent', 'Your cancellation request has been sent to our team.');
    }
  };

  if (loading) {
    return (
      <Page 
        title="Loading..."
        variant={responsive.getLayoutVariant()}
      >
        <Section>
          <div className="space-y-4">
            <div className="bg-st-gray-200 animate-pulse rounded-lg h-32"></div>
            <div className="bg-st-gray-200 animate-pulse rounded-lg h-64"></div>
          </div>
        </Section>
      </Page>
    );
  }

  if (!job) {
    return (
      <Page 
        title="Job Not Found"
        variant={responsive.getLayoutVariant()}
      >
        <Section>
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-st-text-primary mb-2">
                Job Not Found
              </h3>
              <p className="text-st-text-secondary mb-6">
                The requested job could not be found.
              </p>
              <Button variant="primary" onClick={() => navigate('/jobs')}>
                Back to Jobs
              </Button>
            </CardContent>
          </Card>
        </Section>
      </Page>
    );
  }

  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const priorityConfig = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.normal;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return ` at ${timeString}`;
  };

  const canContactTechnician = job.status === 'in_progress' && job.technician_name;
  const canRate = job.status === 'completed';
  const canReschedule = ['pending', 'scheduled'].includes(job.status);
  const canCancel = !['completed', 'cancelled'].includes(job.status);

  return (
    <Page 
      title={job.title}
      subtitle={`Job #${job.id}`}
      variant={responsive.getLayoutVariant()}
      headerContent={
        !responsive.isMobile && (
          <Button
            variant="outline"
            onClick={() => navigate('/jobs')}
          >
            Back to Jobs
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Mobile Back Button */}
        {responsive.isMobile && (
          <Section>
            <Button
              variant="outline"
              onClick={() => navigate('/jobs')}
              fullWidth
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Jobs
            </Button>
          </Section>
        )}

        {/* Job Status */}
        <Section>
          <Card variant="elevated">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{statusConfig.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-st-text-primary">
                      {statusConfig.label}
                    </h3>
                    <p className="text-sm text-st-text-secondary">
                      {statusConfig.description}
                    </p>
                  </div>
                </div>
                
                {job.priority !== 'normal' && (
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full bg-st-${priorityConfig.color}-100`}>
                    <span className="text-lg">{priorityConfig.icon}</span>
                    <span className={`text-sm font-medium text-st-${priorityConfig.color}-800`}>
                      {priorityConfig.label}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Job Details */}
        <Grid cols={responsive.isMobile ? 1 : 2} gap={6}>
          {/* Basic Information */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-st-text-primary mb-1">Description</h4>
                  <p className="text-st-text-secondary">
                    {job.description || 'No description provided'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-st-text-primary mb-1">Service Type</h4>
                  <p className="text-st-text-secondary">
                    {job.service_type || 'General Service'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-st-text-primary mb-1">Location</h4>
                  <p className="text-st-text-secondary">
                    {job.location || job.customer_address || 'Address on file'}
                  </p>
                </div>

                {job.estimated_duration && (
                  <div>
                    <h4 className="font-medium text-st-text-primary mb-1">Estimated Duration</h4>
                    <p className="text-st-text-secondary">
                      {job.estimated_duration} minutes
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Technician */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Schedule & Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-st-text-primary mb-1">Scheduled Date</h4>
                  <p className="text-st-text-secondary">
                    {formatDate(job.scheduled_date)}
                    {formatTime(job.scheduled_time)}
                  </p>
                </div>

                {job.technician_name && (
                  <div>
                    <h4 className="font-medium text-st-text-primary mb-1">Assigned Technician</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-st-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                          {job.technician_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-st-text-primary">
                            {job.technician_name}
                          </p>
                          {job.technician_phone && (
                            <p className="text-sm text-st-text-secondary">
                              {job.technician_phone}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {canContactTechnician && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleContactTechnician}
                        >
                          Contact
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-st-text-primary mb-1">Created</h4>
                  <p className="text-st-text-secondary">
                    {formatDate(job.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Job Updates */}
        <Section title="Job Updates">
          <Card variant="elevated">
            <CardContent>
              {updatesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-st-gray-200 animate-pulse rounded-lg h-16"></div>
                  ))}
                </div>
              ) : updates.length > 0 ? (
                <div className="space-y-4">
                  {updates.map((update, index) => (
                    <div
                      key={update.id || index}
                      className={`border-l-4 pl-4 py-2 ${
                        update.note_type === 'customer' ? 'border-st-primary-500' :
                        update.note_type === 'technical' ? 'border-st-info-500' :
                        'border-st-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-st-text-primary">
                              {update.created_by_name || 'System'}
                            </span>
                            {update.note_type && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                update.note_type === 'customer' ? 'bg-st-primary-100 text-st-primary-800' :
                                update.note_type === 'technical' ? 'bg-st-info-100 text-st-info-800' :
                                'bg-st-gray-100 text-st-gray-800'
                              }`}>
                                {update.note_type}
                              </span>
                            )}
                          </div>
                          <p className="text-st-text-secondary mb-1">
                            {update.content || update.message}
                          </p>
                          <p className="text-xs text-st-text-tertiary">
                            {new Date(update.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        {update.is_pinned && (
                          <div className="ml-2">
                            <div className="w-2 h-2 bg-st-warning-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-st-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-st-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-st-text-secondary">No updates yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </Section>

        {/* Action Buttons */}
        <Section title="Actions">
          <Grid cols={responsive.isMobile ? 1 : 2} gap={4}>
            {canRate && (
              <Button
                variant="primary"
                onClick={handleRateService}
                fullWidth
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Rate Service
              </Button>
            )}

            {canContactTechnician && (
              <Button
                variant="outline"
                onClick={handleContactTechnician}
                fullWidth
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact Technician
              </Button>
            )}

            {canReschedule && (
              <Button
                variant="outline"
                onClick={handleRequestReschedule}
                fullWidth
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Request Reschedule
              </Button>
            )}

            {canCancel && (
              <Button
                variant="outline"
                onClick={handleCancelJob}
                fullWidth
                className="text-st-error-600 border-st-error-300 hover:bg-st-error-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Request
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => navigate('/support')}
              fullWidth
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Contact Support
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/new-request')}
              fullWidth
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Request
            </Button>
          </Grid>
        </Section>

        {/* Contact Technician Modal */}
        {showContactTechnician && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Contact Technician</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-st-text-secondary mb-4">
                  Contact information will be available once the technician is en route or at your location.
                  For urgent matters, please contact our support team.
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowContactTechnician(false);
                      navigate('/support');
                    }}
                    fullWidth
                  >
                    Contact Support
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowContactTechnician(false)}
                    fullWidth
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Page>
  );
};

export default CustomerJobDetail;