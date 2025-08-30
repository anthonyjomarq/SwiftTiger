import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit, Trash2, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { User as UserType, UserRole } from '../types';
import { userService } from '../services/userServiceWrapper';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';
import LoadingSpinner from '../components/LoadingSpinner';

interface MutationVariables {
  id: string;
  data: Partial<UserType>;
}

const Users: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  
  const { hasRole, isMainAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<UserType[]>('users', userService.getUsers);

  const createMutation = useMutation<UserType, Error, Partial<UserType>>(
    userService.createUser,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setIsModalOpen(false);
        setSelectedUser(null);
        toast.success('User created successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create user');
      },
    }
  );

  const updateMutation = useMutation<UserType, Error, MutationVariables>(
    ({ id, data }) => userService.updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setIsModalOpen(false);
        setSelectedUser(null);
        toast.success('User updated successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      },
    }
  );

  const deleteMutation = useMutation<void, Error, string>(
    userService.deleteUser,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        toast.success('User deleted successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      },
    }
  );

  const handleCreateUser = (): void => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: UserType): void => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (user: UserType): void => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitUser = (data: Partial<UserType>): void => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConfirmDelete = (): void => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'dispatcher':
        return 'bg-purple-100 text-purple-800';
      case 'technician':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">User</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">Last Login</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        {user.isMainAdmin ? (
                          <Shield className="h-5 w-5 text-red-600" />
                        ) : (
                          <User className="h-5 w-5 text-primary-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                          {user.isMainAdmin && (
                            <span className="ml-1 text-xs text-red-600">(Main Admin)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-600">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-primary-600 hover:text-primary-800"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {!user.isMainAdmin && isMainAdmin() && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedUser ? 'Edit User' : 'Create User'}
      >
        <UserForm
          user={selectedUser}
          onSubmit={handleSubmitUser}
          onCancel={handleCloseModal}
          loading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCloseDeleteModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isLoading}
              className="btn btn-danger"
            >
              {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;