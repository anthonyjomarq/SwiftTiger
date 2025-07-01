import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/constants";
import { useAuth } from "../contexts/AuthContext";

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const { hasPermission } = useAuth();

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(API_ENDPOINTS.CUSTOMERS.LIST);
      setCustomers(response.data.customers);
    } catch (error) {
      setError("Failed to load customers");
      console.error("Customers error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      try {
        if (editingCustomer) {
          await axios.put(
            API_ENDPOINTS.CUSTOMERS.UPDATE.replace(":id", editingCustomer.id),
            formData
          );
        } else {
          await axios.post(API_ENDPOINTS.CUSTOMERS.CREATE, formData);
        }

        setFormData({ name: "", email: "", phone: "", address: "" });
        setShowAddForm(false);
        setEditingCustomer(null);
        fetchCustomers();
      } catch (error) {
        setError(error.response?.data?.error || "Failed to save customer");
        console.error("Save customer error:", error);
      }
    },
    [editingCustomer, formData, fetchCustomers]
  );

  // Handle edit
  const handleEdit = useCallback((customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setShowAddForm(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback(
    async (customerId) => {
      if (!window.confirm("Are you sure you want to delete this customer?")) {
        return;
      }

      try {
        await axios.delete(
          API_ENDPOINTS.CUSTOMERS.DELETE.replace(":id", customerId)
        );
        fetchCustomers();
      } catch (error) {
        setError("Failed to delete customer");
        console.error("Delete customer error:", error);
      }
    },
    [fetchCustomers]
  );

  // Handle form field changes
  const handleChange = useCallback((e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }, []);

  // Cancel form
  const cancelForm = useCallback(() => {
    setFormData({ name: "", email: "", phone: "", address: "" });
    setShowAddForm(false);
    setEditingCustomer(null);
  }, []);

  // Show add form
  const showAddCustomerForm = useCallback(() => {
    setShowAddForm(true);
    setEditingCustomer(null);
    setFormData({ name: "", email: "", phone: "", address: "" });
  }, []);

  // Memoized customer count
  const customerCount = useMemo(() => customers.length, [customers]);

  // Memoized customers with recent activity
  const recentCustomers = useMemo(() => {
    return customers
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);
  }, [customers]);

  // Initial fetch
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    // State
    customers,
    loading,
    error,
    showAddForm,
    editingCustomer,
    formData,
    customerCount,
    recentCustomers,

    // Actions
    fetchCustomers,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleChange,
    cancelForm,
    showAddCustomerForm,
    setShowAddForm,
    setError,

    // Permissions
    canCreate: hasPermission("customers.create"),
    canEdit: hasPermission("customers.edit"),
    canDelete: hasPermission("customers.delete"),
  };
};
