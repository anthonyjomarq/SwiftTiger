import React, { useState, ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, MapPin, Phone, Mail, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Customer, CustomerQueryParams, Job } from '../types';
import { customerService } from '../services/customerServiceWrapper';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import CustomerForm from '../components/CustomerForm';
import CustomerJobs from '../components/CustomerJobs';

interface CustomersData {
  customers: Customer[];
  pagination: {
    page: number;
    pages: number;
    total: number;
  };
}

interface MutationVariables {
  id: string;
  data: Partial<Customer>;
}

type TabType = 'details' | 'jobs';

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: customersData, isLoading } = useQuery<CustomersData>(
    ['customers', { page: currentPage, search: searchTerm }],
    () => customerService.getCustomers({ page: currentPage, search: searchTerm } as CustomerQueryParams),
    { keepPreviousData: true }
  );

  const createMutation = useMutation<Customer, Error, Partial<Customer>>(
    customerService.createCustomer,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        setIsModalOpen(false);
        setSelectedCustomer(null);
        toast.success('Customer created successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create customer');
      },
    }
  );

  const updateMutation = useMutation<Customer, Error, MutationVariables>(
    ({ id, data }) => customerService.updateCustomer(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        setIsModalOpen(false);
        setSelectedCustomer(null);
        toast.success('Customer updated successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update customer');
      },
    }
  );

  const deleteMutation = useMutation<void, Error, string>(
    customerService.deleteCustomer,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        setIsDeleteModalOpen(false);
        setCustomerToDelete(null);
        toast.success('Customer deleted successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete customer');
      },
    }
  );

  const handleCreateCustomer = (): void => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer): void => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer): void => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitCustomer = (data: Partial<Customer>): void => {
    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConfirmDelete = (): void => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleViewCustomer = (customer: Customer): void => {
    setViewCustomer(customer);
    setActiveTab('details');
    setIsViewModalOpen(true);
  };

  const handleCreateJobForCustomer = (): void => {
    setIsViewModalOpen(false);
    navigate('/jobs', { state: { preselectedCustomer: viewCustomer } });
  };

  const handleViewJobFromCustomer = (job: Job): void => {
    setIsViewModalOpen(false);
    navigate('/jobs', { state: { viewJob: job } });
  };

  const handlePreviousPage = (): void => {
    setCurrentPage(Math.max(1, currentPage - 1));
  };

  const handleNextPage = (): void => {
    if (customersData?.pagination) {
      setCurrentPage(Math.min(customersData.pagination.pages, currentPage + 1));
    }
  };

  const handleTabChange = (tab: TabType): void => {
    setActiveTab(tab);
  };

  const handleCloseModals = (): void => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsViewModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <button
          onClick={handleCreateCustomer}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Address</th>
                <th className="table-header">Created</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customersData?.customers?.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-1" />
                        {customer.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-1" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        <div>{customer.addressStreet}</div>
                        <div>
                          {customer.addressCity}, {customer.addressState} {customer.addressZipCode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-600">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        className="text-gray-600 hover:text-gray-800"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="text-primary-600 hover:text-primary-800"
                        title="Edit Customer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {hasRole(['admin', 'manager']) && (
                        <button
                          onClick={() => handleDeleteCustomer(customer)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Customer"
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

        {/* Pagination */}
        {customersData?.pagination && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === customersData.pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page {customersData.pagination.page} of {customersData.pagination.pages}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === customersData.pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModals}
        title={selectedCustomer ? 'Edit Customer' : 'Create Customer'}
      >
        <CustomerForm
          customer={selectedCustomer}
          onSubmit={handleSubmitCustomer}
          onCancel={handleCloseModals}
          loading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        title="Delete Customer"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{customerToDelete?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCloseModals}
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

      {/* View Customer Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseModals}
        title={`Customer: ${viewCustomer?.name || ''}`}
        size="large"
      >
        {viewCustomer && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => handleTabChange('details')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'details'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Customer Details
                </button>
                <button
                  onClick={() => handleTabChange('jobs')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'jobs'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Job History
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{viewCustomer.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{viewCustomer.email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900">{viewCustomer.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <div className="text-sm text-gray-900">
                    <p>{viewCustomer.addressStreet}</p>
                    <p>{viewCustomer.addressCity}, {viewCustomer.addressState} {viewCustomer.addressZipCode}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">
                    {new Date(viewCustomer.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div>
                <CustomerJobs 
                  customerId={viewCustomer.id} 
                  customerName={viewCustomer.name}
                  onCreateJob={handleCreateJobForCustomer}
                  onViewJob={handleViewJobFromCustomer}
                />
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleCloseModals}
                className="btn btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Customers;