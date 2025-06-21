import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit3,
  Save,
  X,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import "./UserProfile.css";

const UserProfile = () => {
  const { user, authenticatedRequest, clearError } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    department: "",
    location: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authenticatedRequest("/auth/profile");

      if (response.ok) {
        const data = await response.json();
        const userData = data.data.user;
        setProfileData(userData);
        setFormData({
          firstName: userData.firstName || userData.first_name || "",
          lastName: userData.lastName || userData.last_name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          bio: userData.bio || "",
          department: userData.department || "",
          location: userData.location || "",
        });
      } else {
        toast.error("Failed to load profile");
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authenticatedRequest("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data.data.user);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
        clearError();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await authenticatedRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordSection(false);
        toast.success("Password changed successfully!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profileData?.firstName || profileData?.first_name || "",
      lastName: profileData?.lastName || profileData?.last_name || "",
      email: profileData?.email || "",
      phone: profileData?.phone || "",
      bio: profileData?.bio || "",
      department: profileData?.department || "",
      location: profileData?.location || "",
    });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "#e74c3c";
      case "dispatcher":
        return "#f39c12";
      case "technician":
        return "#27ae60";
      default:
        return "#3498db";
    }
  };

  if (loading && !profileData) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h1>User Profile</h1>
        <p>Manage your personal information and account settings</p>
      </div>

      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                <User size={48} />
                <button
                  className="avatar-upload-btn"
                  title="Change profile picture"
                >
                  <Camera size={16} />
                </button>
              </div>
              <div className="profile-basic-info">
                <h2>
                  {profileData?.firstName || profileData?.first_name}{" "}
                  {profileData?.lastName || profileData?.last_name}
                </h2>
                <p className="profile-email">{profileData?.email}</p>
                <span
                  className="profile-role-badge"
                  style={{ backgroundColor: getRoleColor(profileData?.role) }}
                >
                  {profileData?.role?.charAt(0).toUpperCase() +
                    profileData?.role?.slice(1)}
                </span>
              </div>
            </div>
            <div className="profile-actions">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                  disabled={loading}
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button
                    onClick={handleCancel}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="btn-primary"
                    disabled={loading}
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firstName">
                  <User size={16} />
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">
                  <User size={16} />
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <Phone size={16} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="department">
                  <Shield size={16} />
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter department"
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">
                  <Calendar size={16} />
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter location"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="bio">
                <Edit3 size={16} />
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </form>
        </div>

        {/* Account Information */}
        <div className="account-info-card">
          <h3>Account Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Account Created</span>
              <span className="info-value">
                {formatDate(profileData?.createdAt || profileData?.created_at)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Updated</span>
              <span className="info-value">
                {formatDate(profileData?.updatedAt || profileData?.updated_at)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Login</span>
              <span className="info-value">
                {formatDate(profileData?.lastLogin || profileData?.last_login)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Status</span>
              <span
                className={`status-badge ${
                  profileData?.isActive || profileData?.is_active
                    ? "active"
                    : "inactive"
                }`}
              >
                {profileData?.isActive || profileData?.is_active
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Password Change Section */}
        <div className="password-change-card">
          <div className="password-header">
            <h3>Change Password</h3>
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="btn-secondary"
            >
              {showPasswordSection ? "Cancel" : "Change Password"}
            </button>
          </div>

          {showPasswordSection && (
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
