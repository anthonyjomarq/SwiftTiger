import React from "react";
import { formatDate } from "../../utils/dateUtils";
import "./UserTable.css";

const UserTable = ({ users, onEdit, onStatusToggle }) => {
  return (
    <div className="user-table-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{`${user.firstName} ${user.lastName}`}</td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge role-${user.role}`}>
                  {user.role}
                </span>
              </td>
              <td>
                <span
                  className={`status-badge status-${
                    user.isActive ? "active" : "inactive"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td>{user.lastLogin ? formatDate(user.lastLogin) : "Never"}</td>
              <td>{formatDate(user.createdAt)}</td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => onEdit(user)}
                  >
                    Edit
                  </button>
                  <button
                    className={`btn btn-sm ${
                      user.isActive ? "btn-danger" : "btn-success"
                    }`}
                    onClick={() => onStatusToggle(user.id, user.isActive)}
                  >
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

export default UserTable;
