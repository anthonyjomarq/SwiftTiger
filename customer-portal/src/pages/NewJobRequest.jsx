import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Section, Grid } from '../../../shared/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Input, Textarea, FormGroup, Label } from '../../../shared/components/Input';
import { useAuth } from '../contexts/AuthContext';
import { useResponsiveContext } from '../../../shared/components/ResponsiveProvider';
import { useNotifications } from '../../../shared/components/NotificationHub';
import { API_ENDPOINTS, JOB_PRIORITIES } from '../../../shared/types/index.js';

/**
 * New Job Request Page
 * Complete service request form for customers
 */

const NewJobRequest = () => {
  const navigate = useNavigate();
  const { user, apiRequest } = useAuth();
  const { responsive } = useResponsiveContext();
  const { showError, showSuccess } = useNotifications();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    service_type: '',
    priority: 'normal',
    preferred_date: '',
    preferred_time: '',
    location: '',
    special_instructions: '',
    contact_phone: user?.phone || '',
    contact_email: user?.email || '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceTypes = [
    { value: 'hvac', label: 'HVAC (Heating & Cooling)' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'general_maintenance', label: 'General Maintenance' },
    { value: 'appliance_repair', label: 'Appliance Repair' },
    { value: 'emergency', label: 'Emergency Service' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'installation', label: 'Installation' },
    { value: 'other', label: 'Other' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low - Can wait a week or more' },
    { value: 'normal', label: 'Normal - Within a few days' },
    { value: 'high', label: 'High - As soon as possible' },
    { value: 'urgent', label: 'Urgent - Same day if possible' },
    { value: 'emergency', label: 'Emergency - Immediate attention needed' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Service title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Service description is required';
    }

    if (!formData.service_type) {
      newErrors.service_type = 'Service type is required';
    }

    if (!formData.contact_phone.trim() && !formData.contact_email.trim()) {
      newErrors.contact_phone = 'At least one contact method is required';
      newErrors.contact_email = 'At least one contact method is required';
    }

    if (formData.contact_email && !isValidEmail(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    if (formData.preferred_date) {
      const selectedDate = new Date(formData.preferred_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.preferred_date = 'Preferred date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Error', 'Please correct the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        ...formData,
        customer_id: user.id,
        status: formData.priority === 'emergency' ? 'urgent' : 'pending',
      };

      const response = await apiRequest(API_ENDPOINTS.JOBS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(
          'Request Submitted',
          `Your service request #${data.data.id} has been submitted successfully.`
        );
        navigate(`/jobs/${data.data.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      showError('Submission Error', error.message || 'Failed to submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Your changes will be lost.')) {
      navigate('/jobs');
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Page 
      title="New Service Request"
      subtitle="Tell us about the service you need"
      variant={responsive.getLayoutVariant()}
      headerContent={
        !responsive.isMobile && (
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mobile Cancel Button */}
        {responsive.isMobile && (
          <Section>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              fullWidth
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Cancel
            </Button>
          </Section>
        )}

        {/* Service Information */}
        <Section title="Service Information">
          <Card variant="elevated">
            <CardContent>
              <div className="space-y-4">
                <FormGroup
                  label="Service Title"
                  required
                  error={errors.title}
                >
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Brief description of the service needed"
                    error={!!errors.title}
                    maxLength={100}
                  />
                </FormGroup>

                <FormGroup
                  label="Service Type"
                  required
                  error={errors.service_type}
                >
                  <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-st-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-st-primary-500 focus:border-st-primary-500"
                  >
                    <option value="">Select a service type</option>
                    {serviceTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </FormGroup>

                <FormGroup
                  label="Detailed Description"
                  required
                  error={errors.description}
                  helperText="Please provide as much detail as possible to help us understand your needs"
                >
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the service you need, any specific issues, and relevant details..."
                    rows={4}
                    error={!!errors.description}
                    maxLength={1000}
                  />
                </FormGroup>

                <FormGroup
                  label="Priority Level"
                  helperText="Help us prioritize your request appropriately"
                >
                  <div className="space-y-2">
                    {priorityOptions.map(option => (
                      <label
                        key={option.value}
                        className="flex items-start space-x-3 p-3 border border-st-border-primary rounded-lg hover:bg-st-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={option.value}
                          checked={formData.priority === option.value}
                          onChange={handleInputChange}
                          className="mt-0.5 text-st-primary-500 focus:ring-st-primary-500"
                        />
                        <div>
                          <div className="font-medium text-st-text-primary">
                            {option.label.split(' - ')[0]}
                          </div>
                          <div className="text-sm text-st-text-secondary">
                            {option.label.split(' - ')[1]}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </FormGroup>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Scheduling Preferences */}
        <Section title="Scheduling Preferences">
          <Card variant="elevated">
            <CardContent>
              <div className="space-y-4">
                <Grid cols={responsive.isMobile ? 1 : 2} gap={4}>
                  <FormGroup
                    label="Preferred Date"
                    error={errors.preferred_date}
                    helperText="Optional - we'll contact you to confirm scheduling"
                  >
                    <Input
                      type="date"
                      name="preferred_date"
                      value={formData.preferred_date}
                      onChange={handleInputChange}
                      min={getTodayDate()}
                      error={!!errors.preferred_date}
                    />
                  </FormGroup>

                  <FormGroup
                    label="Preferred Time"
                    helperText="Optional - approximate time preference"
                  >
                    <select
                      name="preferred_time"
                      value={formData.preferred_time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-st-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-st-primary-500 focus:border-st-primary-500"
                    >
                      <option value="">No preference</option>
                      <option value="morning">Morning (8AM - 12PM)</option>
                      <option value="afternoon">Afternoon (12PM - 5PM)</option>
                      <option value="evening">Evening (5PM - 8PM)</option>
                    </select>
                  </FormGroup>
                </Grid>

                <FormGroup
                  label="Service Location"
                  helperText="If different from your account address"
                >
                  <Textarea
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter address or specific location details..."
                    rows={2}
                  />
                </FormGroup>

                <FormGroup
                  label="Special Instructions"
                  helperText="Any special access instructions, parking info, etc."
                >
                  <Textarea
                    name="special_instructions"
                    value={formData.special_instructions}
                    onChange={handleInputChange}
                    placeholder="Parking instructions, gate codes, preferred entrance, etc..."
                    rows={3}
                  />
                </FormGroup>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Contact Information */}
        <Section title="Contact Information">
          <Card variant="elevated">
            <CardContent>
              <div className="space-y-4">
                <Grid cols={responsive.isMobile ? 1 : 2} gap={4}>
                  <FormGroup
                    label="Phone Number"
                    error={errors.contact_phone}
                    helperText="For scheduling and service updates"
                  >
                    <Input
                      type="tel"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      error={!!errors.contact_phone}
                    />
                  </FormGroup>

                  <FormGroup
                    label="Email Address"
                    error={errors.contact_email}
                    helperText="For confirmations and updates"
                  >
                    <Input
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      error={!!errors.contact_email}
                    />
                  </FormGroup>
                </Grid>

                <div className="bg-st-info-50 border border-st-info-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-st-info-500 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-st-info-800 mb-1">What happens next?</h4>
                      <ul className="text-sm text-st-info-700 space-y-1">
                        <li>• We'll review your request and contact you within 2 hours</li>
                        <li>• Our team will confirm scheduling and provide a service estimate</li>
                        <li>• You'll receive updates via your preferred contact method</li>
                        <li>• Emergency requests are prioritized and handled immediately</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Submit Buttons */}
        <Section>
          <Card variant="elevated">
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  size={responsive.isMobile ? 'lg' : 'md'}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit Service Request
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size={responsive.isMobile ? 'lg' : 'md'}
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className={responsive.isMobile ? 'w-full' : 'w-auto'}
                >
                  Cancel
                </Button>
              </div>

              {formData.priority === 'emergency' && (
                <div className="mt-4 bg-st-error-50 border border-st-error-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-st-error-500 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-st-error-800 mb-1">Emergency Service</h4>
                      <p className="text-sm text-st-error-700">
                        For immediate emergencies, please call our 24/7 hotline: 
                        <a href="tel:+1-555-EMERGENCY" className="font-medium underline ml-1">
                          (555) 364-3743
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Section>
      </form>
    </Page>
  );
};

export default NewJobRequest;