import React, { useState, useEffect } from 'react';
import { Page, Section, Grid } from '../../../shared/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Input, Textarea, FormGroup, SearchInput } from '../../../shared/components/Input';
import { useAuth } from '../contexts/AuthContext';
import { useResponsiveContext } from '../../../shared/components/ResponsiveProvider';
import { useNotifications } from '../../../shared/components/NotificationHub';
import { API_ENDPOINTS } from '../../../shared/types/index.js';

/**
 * Customer Support Page
 * Complete support system for customers
 */

const CustomerSupport = () => {
  const { user, apiRequest } = useAuth();
  const { responsive } = useResponsiveContext();
  const { showError, showSuccess } = useNotifications();

  const [supportTickets, setSupportTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'general',
    priority: 'normal',
    description: '',
    attachments: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const supportCategories = [
    { value: 'general', label: 'General Question' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'scheduling', label: 'Scheduling & Appointments' },
    { value: 'service', label: 'Service Quality' },
    { value: 'account', label: 'Account & Profile' },
    { value: 'emergency', label: 'Emergency Support' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low - General inquiry' },
    { value: 'normal', label: 'Normal - Standard request' },
    { value: 'high', label: 'High - Urgent issue' },
    { value: 'urgent', label: 'Urgent - Immediate attention needed' },
  ];

  const faqData = [
    {
      category: 'General',
      questions: [
        {
          question: 'How do I schedule a service appointment?',
          answer: 'You can schedule a service appointment by clicking "New Request" on your Jobs page. Fill out the service details, preferred date and time, and submit your request. Our team will contact you within 2 hours to confirm the appointment.',
        },
        {
          question: 'What areas do you service?',
          answer: 'We currently service the greater metropolitan area including all surrounding suburbs. If you\'re unsure whether we service your area, please contact us with your address and we\'ll confirm availability.',
        },
        {
          question: 'How do I track my service request?',
          answer: 'All your service requests are visible on the "My Jobs" page. You can view detailed status updates, technician information, and communicate directly through the platform.',
        },
      ],
    },
    {
      category: 'Billing',
      questions: [
        {
          question: 'When will I be charged for services?',
          answer: 'Payment is typically collected after service completion. You\'ll receive an invoice with detailed breakdown of services provided. We accept all major credit cards and electronic payments.',
        },
        {
          question: 'Can I get an estimate before service?',
          answer: 'Yes! We provide free estimates for most services. During the scheduling call, our team will discuss the scope of work and provide an estimated cost range.',
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, electronic bank transfers, and cash payments.',
        },
      ],
    },
    {
      category: 'Technical',
      questions: [
        {
          question: 'I can\'t log into my account',
          answer: 'If you\'re having trouble logging in, try resetting your password using the "Forgot Password" link. If the issue persists, please contact our support team for assistance.',
        },
        {
          question: 'How do I update my profile information?',
          answer: 'You can update your profile information by visiting the "My Profile" page. Click "Edit Profile" to modify your contact information, address, and other details.',
        },
        {
          question: 'I\'m not receiving notifications',
          answer: 'Check your notification preferences in your profile settings. Also verify that our emails aren\'t going to your spam folder. Add our email address to your contacts to ensure delivery.',
        },
      ],
    },
  ];

  const contactMethods = [
    {
      icon: '📞',
      title: 'Phone Support',
      description: 'Mon-Fri 8AM-6PM, Sat 9AM-4PM',
      action: 'tel:+1-555-123-4567',
      label: '(555) 123-4567',
      available: true,
    },
    {
      icon: '💬',
      title: 'Live Chat',
      description: 'Available during business hours',
      action: '#',
      label: 'Start Chat',
      available: true,
    },
    {
      icon: '📧',
      title: 'Email Support',
      description: 'Response within 24 hours',
      action: 'mailto:support@swifttiger.com',
      label: 'support@swifttiger.com',
      available: true,
    },
    {
      icon: '🚨',
      title: 'Emergency Line',
      description: '24/7 Emergency Support',
      action: 'tel:+1-555-EMERGENCY',
      label: '(555) 364-3743',
      available: true,
    },
  ];

  useEffect(() => {
    fetchSupportTickets();
  }, []);

  const fetchSupportTickets = async () => {
    try {
      setLoadingTickets(true);
      const response = await apiRequest(API_ENDPOINTS.SUPPORT.TICKETS);
      
      if (response.ok) {
        const data = await response.json();
        setSupportTickets(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateTicketForm = () => {
    const newErrors = {};

    if (!ticketForm.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!ticketForm.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    
    if (!validateTicketForm()) {
      showError('Validation Error', 'Please correct the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest(API_ENDPOINTS.SUPPORT.CREATE_TICKET, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...ticketForm,
          customer_id: user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(
          'Support Ticket Created',
          `Your support ticket #${data.data.id} has been created. We'll respond within 24 hours.`
        );
        setTicketForm({
          subject: '',
          category: 'general',
          priority: 'normal',
          description: '',
          attachments: [],
        });
        setShowNewTicket(false);
        fetchSupportTickets();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create support ticket');
      }
    } catch (error) {
      console.error('Error creating support ticket:', error);
      showError('Submission Error', error.message || 'Failed to create your support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  const getTicketStatusColor = (status) => {
    const colors = {
      open: 'st-info',
      in_progress: 'st-warning',
      resolved: 'st-success',
      closed: 'st-gray',
    };
    return colors[status] || 'st-gray';
  };

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id?.toString().includes(searchTerm);
    
    const matchesCategory = selectedCategory === 'all' || ticket.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getTicketCount = (category) => {
    if (category === 'all') return supportTickets.length;
    return supportTickets.filter(ticket => ticket.category === category).length;
  };

  return (
    <Page 
      title="Support Center"
      subtitle="Get help when you need it"
      variant={responsive.getLayoutVariant()}
    >
      <div className="space-y-6">
        {/* Quick Actions */}
        <Section>
          <Grid cols={responsive.isMobile ? 1 : 2} gap={4}>
            <Card variant="elevated">
              <CardContent className="text-center py-6">
                <div className="w-16 h-16 bg-st-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-st-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-st-text-primary mb-2">Create Support Ticket</h3>
                <p className="text-st-text-secondary mb-4">
                  Need help? Create a support ticket and we'll get back to you within 24 hours.
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowNewTicket(true)}
                  fullWidth={responsive.isMobile}
                >
                  Create Ticket
                </Button>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="text-center py-6">
                <div className="w-16 h-16 bg-st-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-st-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-st-text-primary mb-2">Browse FAQ</h3>
                <p className="text-st-text-secondary mb-4">
                  Find answers to commonly asked questions about our services.
                </p>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('faq-section').scrollIntoView({ behavior: 'smooth' })}
                  fullWidth={responsive.isMobile}
                >
                  View FAQ
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Section>

        {/* Contact Methods */}
        <Section title="Contact Us">
          <Grid cols={responsive.isMobile ? 1 : 2} gap={4}>
            {contactMethods.map((method, index) => (
              <Card key={index} variant="default">
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{method.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-st-text-primary">{method.title}</h4>
                      <p className="text-sm text-st-text-secondary">{method.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (method.action.startsWith('tel:') || method.action.startsWith('mailto:')) {
                          window.location.href = method.action;
                        }
                      }}
                    >
                      {method.label}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Section>

        {/* Support Tickets */}
        <Section title="My Support Tickets">
          <Card variant="elevated">
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <SearchInput
                      placeholder="Search tickets by subject or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClear={() => setSearchTerm('')}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedCategory === 'all' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleCategoryFilter('all')}
                    >
                      All ({getTicketCount('all')})
                    </Button>
                    <Button
                      variant={selectedCategory === 'open' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleCategoryFilter('open')}
                    >
                      Open ({getTicketCount('open')})
                    </Button>
                    <Button
                      variant={selectedCategory === 'resolved' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleCategoryFilter('resolved')}
                    >
                      Resolved ({getTicketCount('resolved')})
                    </Button>
                  </div>
                </div>

                {/* Tickets List */}
                {loadingTickets ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-st-gray-200 animate-pulse rounded-lg h-20"></div>
                    ))}
                  </div>
                ) : filteredTickets.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border border-st-border-primary rounded-lg p-4 hover:bg-st-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-st-text-primary">
                                #{ticket.id} - {ticket.subject}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getTicketStatusColor(ticket.status)}-100 text-${getTicketStatusColor(ticket.status)}-800`}>
                                {ticket.status?.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-st-text-secondary mb-2">
                              {ticket.description?.substring(0, 150)}...
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-st-text-tertiary">
                              <span>Category: {ticket.category}</span>
                              <span>Priority: {ticket.priority}</span>
                              <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-st-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-st-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-st-text-primary mb-2">No Support Tickets</h3>
                    <p className="text-st-text-secondary mb-4">
                      {searchTerm ? 'No tickets match your search.' : 'You haven\'t created any support tickets yet.'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* FAQ Section */}
        <Section id="faq-section" title="Frequently Asked Questions">
          <div className="space-y-6">
            {faqData.map((category, categoryIndex) => (
              <Card key={categoryIndex} variant="elevated">
                <CardHeader>
                  <CardTitle>{category.category} Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.questions.map((faq, faqIndex) => {
                      const faqId = `${categoryIndex}-${faqIndex}`;
                      const isExpanded = expandedFAQ === faqId;
                      
                      return (
                        <div key={faqIndex} className="border border-st-border-primary rounded-lg">
                          <button
                            className="w-full text-left p-4 flex items-center justify-between hover:bg-st-gray-50 transition-colors"
                            onClick={() => setExpandedFAQ(isExpanded ? null : faqId)}
                          >
                            <span className="font-medium text-st-text-primary pr-4">
                              {faq.question}
                            </span>
                            <svg 
                              className={`w-5 h-5 text-st-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4">
                              <p className="text-st-text-secondary leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* New Ticket Modal */}
        {showNewTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Create Support Ticket</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <FormGroup
                    label="Subject"
                    required
                    error={errors.subject}
                  >
                    <Input
                      name="subject"
                      value={ticketForm.subject}
                      onChange={handleFormChange}
                      placeholder="Brief description of your issue"
                      error={!!errors.subject}
                    />
                  </FormGroup>

                  <Grid cols={responsive.isMobile ? 1 : 2} gap={4}>
                    <FormGroup label="Category" required>
                      <select
                        name="category"
                        value={ticketForm.category}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-st-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-st-primary-500 focus:border-st-primary-500"
                      >
                        {supportCategories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </FormGroup>

                    <FormGroup label="Priority" required>
                      <select
                        name="priority"
                        value={ticketForm.priority}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-st-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-st-primary-500 focus:border-st-primary-500"
                      >
                        {priorityOptions.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </FormGroup>
                  </Grid>

                  <FormGroup
                    label="Description"
                    required
                    error={errors.description}
                    helperText="Please provide as much detail as possible to help us resolve your issue"
                  >
                    <Textarea
                      name="description"
                      value={ticketForm.description}
                      onChange={handleFormChange}
                      placeholder="Describe your issue in detail..."
                      rows={6}
                      error={!!errors.description}
                    />
                  </FormGroup>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Create Support Ticket
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewTicket(false);
                        setTicketForm({
                          subject: '',
                          category: 'general',
                          priority: 'normal',
                          description: '',
                          attachments: [],
                        });
                        setErrors({});
                      }}
                      disabled={isSubmitting}
                      className={responsive.isMobile ? 'w-full' : 'w-auto'}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Page>
  );
};

export default CustomerSupport;