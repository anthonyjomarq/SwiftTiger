import React, { useState, useEffect } from "react";
import { userService } from "../../services/userService";
import UserTable from "./UserTable";
import UserModal from "./UserModal";
import UserFilters from "./UserFilters";
import "./UserManagement.css";

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

      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = async (userId, data) => {
    try {
      await userService.updateUser(userId, data);
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error("Failed to update user:", error);
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
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h1>User Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setSelectedUser(null);
            setShowModal(true);
          }}
        >
          Add New User
        </button>
      </div>

      <UserFilters filters={filters} onFilterChange={setFilters} />

      {loading ? (
        <div className="loading-spinner">Loading users...</div>
      ) : (
        <>
          <UserTable
            users={users}
            onEdit={handleEditUser}
            onStatusToggle={handleUserStatusToggle}
          />

          <div className="pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </button>
          </div>
        </>
      )}

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
