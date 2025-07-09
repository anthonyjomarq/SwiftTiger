import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

const UserForm = ({ user, onSubmit, onCancel, loading }) => {
  const { isMainAdmin } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: user || {
      name: '',
      email: '',
      password: '',
      role: 'technician',
      isActive: true,
    },
  });

  const selectedRole = watch('role');

  const handleFormSubmit = (data) => {
    // Remove password field if it's empty (for updates)
    if (user && !data.password) {
      delete data.password;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            type="text"
            className="input"
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email address',
              },
            })}
            type="email"
            className="input"
            placeholder="john@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {user ? 'Password (leave empty to keep current)' : 'Password *'}
        </label>
        <input
          {...register('password', user ? {} : { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
          type="password"
          className="input"
          placeholder={user ? 'Leave empty to keep current password' : 'Enter password'}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role *
          </label>
          <select {...register('role', { required: 'Role is required' })} className="input">
            <option value="technician">Technician</option>
            <option value="dispatcher">Dispatcher</option>
            <option value="manager">Manager</option>
            {isMainAdmin() && <option value="admin">Admin</option>}
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select {...register('isActive')} className="input">
            <option value={true}>Active</option>
            <option value={false}>Inactive</option>
          </select>
        </div>
      </div>

      {selectedRole && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Role Permissions</h4>
          <div className="text-sm text-gray-600">
            {selectedRole === 'admin' && (
              <ul className="space-y-1">
                <li>• Full system access</li>
                <li>• User management</li>
                <li>• System configuration</li>
                <li>• All job and customer operations</li>
              </ul>
            )}
            {selectedRole === 'manager' && (
              <ul className="space-y-1">
                <li>• Customer and job management</li>
                <li>• View all reports</li>
                <li>• Assign technicians</li>
                <li>• Route planning</li>
              </ul>
            )}
            {selectedRole === 'dispatcher' && (
              <ul className="space-y-1">
                <li>• Schedule and assign jobs</li>
                <li>• Customer management</li>
                <li>• Route optimization</li>
                <li>• View reports</li>
              </ul>
            )}
            {selectedRole === 'technician' && (
              <ul className="space-y-1">
                <li>• View assigned jobs</li>
                <li>• Update job status</li>
                <li>• Add job logs and photos</li>
                <li>• View customer information</li>
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;