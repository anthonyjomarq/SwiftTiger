import React, { useState, useEffect } from "react";
import {
  Users,
  Edit,
  ToggleLeft,
  ToggleRight,
  Search,
  Plus,
  Filter,
  X,
  Save,
  User,
  Mail,
  Shield,
  Calendar,
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { userService } from "../../services/userService";

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

// UserTable Component
const UserTable = ({ users, onEdit, onStatusToggle, loading }) => {
  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "2rem" }}
      >
        <Loader className="animate-spin" size={32} />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
        No users found
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
            <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Role</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Last Login</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Created</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "12px" }}>
                {`${user.firstName} ${user.lastName}`}
              </td>
              <td style={{ padding: "12px" }}>{user.email}</td>
              <td style={{ padding: "12px" }}>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "0.875rem",
                    backgroundColor:
                      user.role === "admin"
                        ? "#fee"
                        : user.role === "dispatcher"
                        ? "#eef"
                        : "#efe",
                    color:
                      user.role === "admin"
                        ? "#c00"
                        : user.role === "dispatcher"
                        ? "#808"
                        : "#080",
                  }}
                >
                  {user.role}
                </span>
              </td>
              <td style={{ padding: "12px" }}>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "0.875rem",
                    backgroundColor: user.isActive ? "#dfd" : "#fdd",
                    color: user.isActive ? "#060" : "#600",
                  }}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td style={{ padding: "12px" }}>{formatDate(user.lastLogin)}</td>
              <td style={{ padding: "12px" }}>{formatDate(user.createdAt)}</td>
              <td style={{ padding: "12px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => onEdit(user)}
                    style={{
                      padding: "6px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => onStatusToggle(user.id, user.isActive)}
                    style={{
                      padding: "6px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      backgroundColor: user.isActive ? "#fee" : "#efe",
                      color: user.isActive ? "#c00" : "#060",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {user.isActive ? (
                      <ToggleRight size={16} />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
                    {user.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// UserModal Component
const UserModal = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    role: user?.role || "technician",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!user && !formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password) {
      // Match updated backend validation requirements
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/(?=.*[a-z])/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one lowercase letter";
      } else if (!/(?=.*[A-Z])/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter";
      } else if (!/(?=.*\d)/.test(formData.password)) {
        newErrors.password = "Password must contain at least one number";
      } else if (
        !/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)
      ) {
        newErrors.password =
          "Password must contain at least one special character";
      }
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Remove confirmPassword from data sent to API
      const { confirmPassword, ...userData } = formData;

      if (user) {
        // Updating existing user
        await onSave(user.id, userData);
      } else {
        // Creating new user - pass null as userId to trigger create
        await onSave(null, userData);
      }
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>{user ? "Edit User" : "Add New User"}</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <div style={{ display: "grid", gap: "16px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "500",
                  }}
                >
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid " + (errors.firstName ? "#f00" : "#ddd"),
                    borderRadius: "4px",
                    fontSize: "16px",
                  }}
                />
                {errors.firstName && (
                  <span style={{ color: "#f00", fontSize: "0.875rem" }}>
                    {errors.firstName}
                  </span>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "500",
                  }}
                >
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid " + (errors.lastName ? "#f00" : "#ddd"),
                    borderRadius: "4px",
                    fontSize: "16px",
                  }}
                />
                {errors.lastName && (
                  <span style={{ color: "#f00", fontSize: "0.875rem" }}>
                    {errors.lastName}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "500",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid " + (errors.email ? "#f00" : "#ddd"),
                  borderRadius: "4px",
                  fontSize: "16px",
                }}
              />
              {errors.email && (
                <span style={{ color: "#f00", fontSize: "0.875rem" }}>
                  {errors.email}
                </span>
              )}
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "500",
                }}
              >
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "16px",
                  backgroundColor: "white",
                }}
              >
                <option value="technician">Technician</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {(!user || formData.password) && (
              <>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "500",
                    }}
                  >
                    {user ? "New Password" : "Password"}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={
                      user
                        ? "Leave blank to keep current password"
                        : "Example: Pass123!"
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border:
                        "1px solid " + (errors.password ? "#f00" : "#ddd"),
                      borderRadius: "4px",
                      fontSize: "16px",
                    }}
                  />
                  {errors.password && (
                    <span
                      style={{
                        color: "#f00",
                        fontSize: "0.875rem",
                        display: "block",
                        marginTop: "4px",
                      }}
                    >
                      {errors.password}
                    </span>
                  )}
                  {!user && (
                    <span
                      style={{
                        color: "#666",
                        fontSize: "0.75rem",
                        display: "block",
                        marginTop: "4px",
                      }}
                    >
                      Must include: uppercase, lowercase, number, and any
                      special character
                    </span>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "500",
                    }}
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border:
                        "1px solid " +
                        (errors.confirmPassword ? "#f00" : "#ddd"),
                      borderRadius: "4px",
                      fontSize: "16px",
                    }}
                  />
                  {errors.confirmPassword && (
                    <span style={{ color: "#f00", fontSize: "0.875rem" }}>
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: "#007bff",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              {user ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// UserFilters Component
const UserFilters = ({ filters, onFilterChange }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        marginBottom: "20px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
        <Search
          size={20}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#666",
          }}
        />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={filters.search}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
          style={{
            width: "100%",
            padding: "8px 12px 8px 40px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "16px",
          }}
        />
      </div>

      <select
        value={filters.role}
        onChange={(e) => onFilterChange({ ...filters, role: e.target.value })}
        style={{
          padding: "8px 12px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          fontSize: "16px",
          backgroundColor: "white",
        }}
      >
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="dispatcher">Dispatcher</option>
        <option value="technician">Technician</option>
      </select>

      <select
        value={filters.isActive}
        onChange={(e) =>
          onFilterChange({ ...filters, isActive: e.target.value })
        }
        style={{
          padding: "8px 12px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          fontSize: "16px",
          backgroundColor: "white",
        }}
      >
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>

      {(filters.search || filters.role || filters.isActive) && (
        <button
          onClick={() => onFilterChange({ search: "", role: "", isActive: "" })}
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <X size={16} />
          Clear Filters
        </button>
      )}
    </div>
  );
};

// Main UserManagement Component
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    isActive: "",
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      console.log("Users API Response:", response);

      setUsers(response.users || []);
      setPagination(
        response.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        }
      );
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = async (userId, data) => {
    try {
      if (userId) {
        await userService.updateUser(userId, data);
        toast.success("User updated successfully");
      } else {
        // For new users, we need to call the createUser method
        console.log("Creating new user with data:", data);
        const result = await userService.createUser(data);
        console.log("Create user result:", result);

        if (result && result.success === false) {
          throw new Error(result.message || "Failed to create user");
        }
        toast.success("User created successfully");
      }
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error("Failed to save user:", error);

      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        // Express validator errors
        const validationErrors = error.response.data.errors;
        const errorMessage = validationErrors
          .map((err) => `${err.param}: ${err.msg}`)
          .join(", ");
        toast.error(errorMessage);
      } else if (error.response?.data?.message) {
        // General error message
        toast.error(error.response.data.message);
      } else {
        // Fallback error message
        toast.error(error.message || "Failed to save user");
      }
    }
  };

  const handleUserStatusToggle = async (userId, isActive) => {
    try {
      if (isActive) {
        await userService.deactivateUser(userId);
      } else {
        await userService.activateUser(userId);
      }
      fetchUsers();
    } catch (error) {
      console.error("Failed to toggle user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, marginBottom: "8px" }}>User Management</h1>
          <p style={{ margin: 0, color: "#666" }}>
            Manage system users, roles, and permissions
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null);
            setShowModal(true);
          }}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#007bff",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "16px",
          }}
        >
          <Plus size={20} />
          Add New User
        </button>
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          padding: "20px",
        }}
      >
        <UserFilters filters={filters} onFilterChange={setFilters} />

        <UserTable
          users={users}
          onEdit={handleEditUser}
          onStatusToggle={handleUserStatusToggle}
          loading={loading}
        />

        {!loading && users.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ color: "#666" }}>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} users
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                  opacity: pagination.page === 1 ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    let pageNumber;
                    if (pagination.pages <= 5) {
                      pageNumber = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNumber = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNumber = pagination.pages - 4 + i;
                    } else {
                      pageNumber = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: pageNumber,
                          }))
                        }
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          backgroundColor:
                            pagination.page === pageNumber ? "#007bff" : "#fff",
                          color:
                            pagination.page === pageNumber ? "#fff" : "#000",
                          cursor: "pointer",
                          minWidth: "40px",
                        }}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                disabled={pagination.page === pagination.pages}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  cursor:
                    pagination.page === pagination.pages
                      ? "not-allowed"
                      : "pointer",
                  opacity: pagination.page === pagination.pages ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <UserModal
          user={selectedUser}
          onSave={handleUserUpdate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default UserManagement;
