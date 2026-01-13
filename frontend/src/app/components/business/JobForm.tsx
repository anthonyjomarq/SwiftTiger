import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import { customerService } from '@/shared/services/wrappers/customerServiceWrapper';
import { userService } from '@/shared/services/wrappers/userServiceWrapper';
import { Job, ServiceType, JobPriority, Customer, User } from '@/shared/types/business';

interface JobFormData {
  jobName: string;
  description: string;
  customer: string;
  serviceType: ServiceType | '';
  priority: JobPriority;
  assignedTo: string;
  scheduledDate: string;
  estimatedDuration: number;
}

interface JobFormProps {
  job?: Job | null;
  onSubmit: (data: JobFormData) => void;
  onCancel: () => void;
  loading: boolean;
}

interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}

export function JobForm({ job, onSubmit, onCancel, loading }: JobFormProps) {
  const [customDuration, setCustomDuration] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<JobFormData>({
    defaultValues: job ? {
      jobName: job.jobName,
      description: job.description || '',
      customer: job.customerId,
      serviceType: job.serviceType,
      priority: job.priority,
      assignedTo: job.assignedTo || '',
      scheduledDate: job.scheduledDate ? new Date(job.scheduledDate).toISOString().split('T')[0] : '',
      estimatedDuration: job.estimatedDuration || 120,
    } : {
      jobName: '',
      description: '',
      customer: '',
      serviceType: '' as const,
      priority: 'Medium' as const,
      assignedTo: '',
      scheduledDate: '',
      estimatedDuration: 120,
    },
  });

  const { data: customers } = useQuery<CustomerListResponse>('customers-list', () =>
    customerService.getCustomers({ limit: 1000 })
  );

  const { data: users } = useQuery<User[]>('users-list', () => userService.getUsers());

  const technicians = users?.filter(user => 
    ['technician', 'admin', 'manager'].includes(user.role)
  );

  const selectedCustomer = customers?.customers?.find(
    (c: Customer) => c.id === watch('customer')
  );
  
  const watchedServiceType = watch('serviceType');
  
  // Auto-update estimated duration based on service type
  useEffect(() => {
    if (!customDuration && watchedServiceType) {
      let duration: number;
      switch (watchedServiceType) {
        case 'Replacement':
          duration = 45; // 30 minutes to 1 hour (average 45 min)
          break;
        case 'New Account':
          duration = 90; // 1 hour to 2 hours (average 1.5 hours)
          break;
        case 'Training':
          duration = 45; // 30 minutes to 1 hour (average 45 min)
          break;
        case 'Maintenance':
          duration = 45; // 30 minutes to 1 hour (same as replacement)
          break;
        default:
          duration = 60;
      }
      setValue('estimatedDuration', duration);
    }
  }, [watchedServiceType, customDuration, setValue]);

  const handleFormSubmit = (data: JobFormData): void => {
    // Convert scheduledDate to proper format if provided
    const submitData = { ...data };
    if (submitData.scheduledDate) {
      submitData.scheduledDate = new Date(submitData.scheduledDate).toISOString();
    }
    onSubmit(submitData);
  };

  const getServiceTypeDescription = (serviceType: ServiceType): string => {
    switch (serviceType) {
      case 'New Account': return '1-2 hours (90 min average)';
      case 'Replacement': return '30min-1hr (45 min average)';
      case 'Training': return '30min-1hr (45 min average)';
      case 'Maintenance': return '30min-1hr (45 min average)';
      default: return '';
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Name *
          </label>
          <input
            {...register('jobName', { required: 'Job name is required' })}
            type="text"
            className="input"
            placeholder="e.g., Installation at Main Office"
          />
          {errors.jobName && (
            <p className="mt-1 text-sm text-red-600">{errors.jobName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer *
          </label>
          <select
            {...register('customer', { required: 'Customer is required' })}
            className="input"
          >
            <option key="select-customer" value="">Select a customer</option>
            {customers?.customers?.map((customer: Customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          {errors.customer && (
            <p className="mt-1 text-sm text-red-600">{errors.customer.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          {...register('description', { required: 'Description is required' })}
          rows={3}
          className="input"
          placeholder="Detailed description of the job requirements..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {selectedCustomer && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Address</h4>
          <p className="text-sm text-gray-600">
            {selectedCustomer.addressStreet}<br />
            {selectedCustomer.addressCity}, {selectedCustomer.addressState} {selectedCustomer.addressZipCode}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Type *
          </label>
          <select
            {...register('serviceType', { required: 'Service type is required' })}
            className="input"
          >
            <option key="select-service" value="">Select service type</option>
            <option key="new-account" value="New Account">New Account (1-2 hours)</option>
            <option key="replacement" value="Replacement">Replacement (30min-1hr)</option>
            <option key="training" value="Training">Training (30min-1hr)</option>
            <option key="maintenance" value="Maintenance">Maintenance (30min-1hr)</option>
          </select>
          {errors.serviceType && (
            <p className="mt-1 text-sm text-red-600">{errors.serviceType.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select {...register('priority')} className="input">
            <option key="low" value="Low">Low</option>
            <option key="medium" value="Medium">Medium</option>
            <option key="high" value="High">High</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assigned Technician
          </label>
          <select {...register('assignedTo')} className="input">
            <option key="select-tech" value="">Select a technician</option>
            {technicians?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduled Date
          </label>
          <input
            {...register('scheduledDate')}
            type="date"
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estimated Duration
        </label>
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="durationType"
                checked={!customDuration}
                onChange={() => setCustomDuration(false)}
                className="mr-2"
              />
              Auto (based on service type)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="durationType"
                checked={customDuration}
                onChange={() => setCustomDuration(true)}
                className="mr-2"
              />
              Custom duration
            </label>
          </div>
          
          {customDuration ? (
            <input
              {...register('estimatedDuration', { 
                required: 'Duration is required',
                min: { value: 15, message: 'Duration must be at least 15 minutes' }
              })}
              type="number"
              min="15"
              step="15"
              className="input"
              placeholder="Enter minutes"
            />
          ) : (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {watchedServiceType ? (
                <div>
                  <strong>{watchedServiceType}:</strong> {getServiceTypeDescription(watchedServiceType)}
                </div>
              ) : (
                'Select a service type to see estimated duration'
              )}
            </div>
          )}
        </div>
        {errors.estimatedDuration && (
          <p className="mt-1 text-sm text-red-600">{errors.estimatedDuration?.message}</p>
        )}
      </div>

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
          {loading ? 'Saving...' : job ? 'Update Job' : 'Create Job'}
        </button>
      </div>
    </form>
  );
}