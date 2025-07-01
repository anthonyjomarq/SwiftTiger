import React, { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCustomers } from "../hooks/useCustomers";
import { usePermissions } from "../hooks/usePermissions";
import CustomerList from "../components/CustomerList";
import CustomerForm from "../components/CustomerForm";
import CustomerDetail from "../components/CustomerDetail";
import LoadingBoundary from "../components/LoadingBoundary";
import Button from "../components/ui/Button";

const Customers = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    customers,
    loading,
    error,
    showAddForm,
    editingCustomer,
    formData,
    customerCount,
    fetchCustomers,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleChange,
    cancelForm,
    showAddCustomerForm,
    setShowAddForm,
    setError,
    canCreate,
    canEdit,
    canDelete,
  } = useCustomers();

  const { permissions } = usePermissions();

  // Check if we should show the add form (coming from dashboard)
  React.useEffect(() => {
    if (location.state?.showAddForm) {
      setShowAddForm(true);
    }
  }, [location.state, setShowAddForm]);

  // Handle form submission
  const handleFormSubmit = useCallback(
    (e) => {
      handleSubmit(e);
      // If we came from dashboard, go back
      if (location.state?.showAddForm) {
        navigate("/dashboard");
      }
    },
    [handleSubmit, location.state, navigate]
  );

  // Handle cancel form
  const handleCancelForm = useCallback(() => {
    cancelForm();
    // If we came from dashboard, go back
    if (location.state?.showAddForm) {
      navigate("/dashboard");
    }
  }, [cancelForm, location.state, navigate]);

  // Handle back to dashboard
  const handleBackToDashboard = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">
            Manage your customer database ({customerCount} customers)
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={showAddCustomerForm}>
            Add Customer
          </Button>
        )}
      </div>

      <LoadingBoundary
        loading={loading}
        error={error}
        onRetry={fetchCustomers}
        loadingText="Loading customers..."
        errorText="Failed to load customers"
      >
        {showAddForm && (
          <CustomerForm
            customer={editingCustomer}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            showBackButton={location.state?.showAddForm}
            onBackClick={handleBackToDashboard}
          />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <CustomerList
          customers={customers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </LoadingBoundary>
    </div>
  );
};

export default Customers;
