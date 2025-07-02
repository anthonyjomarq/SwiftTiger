import React, { useState, useEffect } from 'react';
import { Page, Section, Grid } from '../../../shared/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Input, Textarea, FormGroup } from '../../../shared/components/Input';
import { useAuth } from '../contexts/AuthContext';
import { useResponsiveContext } from '../../../shared/components/ResponsiveProvider';
import { useNotifications } from '../../../shared/components/NotificationHub';
import { API_ENDPOINTS } from '../../../shared/types/index.js';

/**
 * Customer Profile Page
 * Complete profile management for customers
 */

const CustomerProfile = () => {
  const { user, apiRequest, updateUser } = useAuth();
  const { responsive } = useResponsiveContext();
  const { showError, showSuccess } = useNotifications();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    company: '',
    notes: '',
  });

  const [originalData, setOriginalData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      const userData = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zip_code: user.zip_code || '',
        company: user.company || '',
        notes: user.notes || '',
      };
      setFormData(userData);
      setOriginalData(userData);
    }
  }, [user]);

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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateProfile = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.current_password) {
      newErrors.current_password = 'Current password is required';
    }

    if (!passwordData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    return { valid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const hasChanges = () => {
    return Object.keys(formData).some(key => formData[key] !== originalData[key]);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
    setErrors({});
  };

  const handleSave = async () => {
    if (!validateProfile()) {
      showError('Validation Error', 'Please correct the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest(API_ENDPOINTS.USER.UPDATE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        await updateUser(data.data);
        setOriginalData(formData);
        setIsEditing(false);
        showSuccess('Profile Updated', 'Your profile has been updated successfully.');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Update Error', error.message || 'Failed to update your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validatePassword();
    if (!validation.valid) {
      setErrors(validation.errors);
      showError('Validation Error', 'Please correct the password errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest(API_ENDPOINTS.USER.CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      if (response.ok) {
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
        setIsChangingPassword(false);
        showSuccess('Password Changed', 'Your password has been changed successfully.');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Password Error', error.message || 'Failed to change your password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatUserName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.email || 'User';
  };

  const getMemberSince = () => {
    if (user?.created_at) {
      const date = new Date(user.created_at);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
    }
    return 'Unknown';
  };

  return (
    <Page 
      title="My Profile"
      subtitle="Manage your account information and preferences"
      variant={responsive.getLayoutVariant()}
    >
      <div className="space-y-6">
        {/* Profile Overview */}
        <Section>
          <Card variant="elevated">
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="w-20 h-20 bg-st-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.first_name ? user.first_name.charAt(0) : user?.email?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-st-text-primary">
                    {formatUserName()}
                  </h2>
                  <p className="text-st-text-secondary">
                    Customer since {getMemberSince()}
                  </p>
                  {user?.company && (
                    <p className="text-sm text-st-text-tertiary mt-1">
                      {user.company}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <Button
                      variant="primary"
                      onClick={handleEdit}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        onClick={handleSave}
                        loading={isSubmitting}
                        disabled={isSubmitting || !hasChanges()}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Profile Information */}
        <Grid cols={responsive.isMobile ? 1 : 2} gap={6}>
          {/* Personal Information */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Grid cols={1} gap={4}>
                  <FormGroup
                    label="First Name"
                    required
                    error={errors.first_name}
                  >
                    <Input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      error={!!errors.first_name}
                    />
                  </FormGroup>

                  <FormGroup
                    label="Last Name"
                    required
                    error={errors.last_name}
                  >
                    <Input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      error={!!errors.last_name}
                    />
                  </FormGroup>

                  <FormGroup
                    label="Email Address"
                    required
                    error={errors.email}
                  >
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      error={!!errors.email}
                    />
                  </FormGroup>

                  <FormGroup
                    label="Phone Number"
                    required
                    error={errors.phone}
                  >
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      error={!!errors.phone}
                    />
                  </FormGroup>

                  <FormGroup
                    label="Company"
                    helperText="Optional - if this is a business account"
                  >
                    <Input
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                </Grid>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormGroup
                  label="Street Address"
                  helperText="Your primary service address"
                >
                  <Textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={2}
                  />
                </FormGroup>

                <Grid cols={responsive.isMobile ? 1 : 2} gap={4}>
                  <FormGroup label="City">
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </FormGroup>

                  <FormGroup label="State">
                    <Input
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                </Grid>

                <FormGroup label="ZIP Code">
                  <Input
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-32"
                  />
                </FormGroup>

                <FormGroup
                  label="Additional Notes"
                  helperText="Special instructions, access codes, etc."
                >
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Any special instructions for service visits..."
                  />
                </FormGroup>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Section title="Security Settings">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-st-text-primary font-medium">Password</p>
                    <p className="text-sm text-st-text-secondary">
                      Last changed: Unknown
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    Change Password
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <FormGroup
                    label="Current Password"
                    required
                    error={errors.current_password}
                  >
                    <Input
                      type="password"
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      error={!!errors.current_password}
                    />
                  </FormGroup>

                  <FormGroup
                    label="New Password"
                    required
                    error={errors.new_password}
                    helperText="Must be at least 8 characters"
                  >
                    <Input
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      error={!!errors.new_password}
                    />
                  </FormGroup>

                  <FormGroup
                    label="Confirm New Password"
                    required
                    error={errors.confirm_password}
                  >
                    <Input
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      error={!!errors.confirm_password}
                    />
                  </FormGroup>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Change Password
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          current_password: '',
                          new_password: '',
                          confirm_password: '',
                        });
                        setErrors({});
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </Section>

        {/* Account Actions */}
        <Section title="Account Actions">
          <Grid cols={responsive.isMobile ? 1 : 2} gap={4}>
            <Card variant="default">
              <CardContent>
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-st-info-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-st-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0-6V4m0 6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-st-text-primary mb-2">Download Data</h3>
                  <p className="text-sm text-st-text-secondary mb-4">
                    Download a copy of your account data and service history
                  </p>
                  <Button variant="outline" size="sm">
                    Download Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card variant="default">
              <CardContent>
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-st-error-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-st-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-st-text-primary mb-2">Delete Account</h3>
                  <p className="text-sm text-st-text-secondary mb-4">
                    Permanently delete your account and all associated data
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-st-error-600 border-st-error-300 hover:bg-st-error-50"
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Section>
      </div>
    </Page>
  );
};

export default CustomerProfile;