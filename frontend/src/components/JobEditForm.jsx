import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const JobEditForm = ({ job, onClose, onJobUpdate }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customer_id: "",
    status: "pending",
    assigned_to: "",
    scheduled_date: "",
    scheduled_time: "",
    estimated_duration: "60",
  });
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { hasPermission } = useAuth();

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        description: job.description || "",
        customer_id: job.customer_id || "",
        status: job.status || "pending",
        assigned_to: job.assigned_to || "",
        scheduled_date: job.scheduled_date
          ? job.scheduled_date.split("T")[0]
          : "",
        scheduled_time: job.scheduled_time || "",
        estimated_duration: job.estimated_duration || "60",
      });
    }
    fetchCustomers();
    fetchTechnicians();
  }, [job]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get("/api/customers");
      setCustomers(response.data.customers);
    } catch (error) {
      console.error("Customers error:", error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await axios.get("/api/users");
      setTechnicians(
        response.data.users.filter((u) => u.role === "technician")
      );
    } catch (error) {
      console.error("Technicians error:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.put(`/api/jobs/${job.id}`, formData);

      // Notify parent component to refresh job list
      if (onJobUpdate) {
        onJobUpdate();
      }

      onClose();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to update job");
      console.error("Update job error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900">Edit Job</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer *
            </label>
            <select
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Unassigned</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date
              </label>
              <input
                type="date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Time
              </label>
              <input
                type="time"
                name="scheduled_time"
                value={formData.scheduled_time}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Duration (minutes)
            </label>
            <input
              type="number"
              name="estimated_duration"
              value={formData.estimated_duration}
              onChange={handleChange}
              min="15"
              step="15"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobEditForm;
