import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import JobDetail from "../components/JobDetail";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customer_id: "",
    status: "pending",
    assigned_to: "",
  });
  const { hasPermission, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
    fetchCustomers();
    fetchTechnicians();
    // Check if we should show the add form (coming from dashboard)
    if (location.state?.showAddForm) {
      setShowAddForm(true);
    }
  }, [location.state]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get("/api/jobs");
      setJobs(response.data.jobs);
    } catch (error) {
      setError("Failed to load jobs");
      console.error("Jobs error:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await axios.post("/api/jobs", formData);
      setFormData({
        title: "",
        description: "",
        customer_id: "",
        status: "pending",
        assigned_to: "",
      });
      setShowAddForm(false);
      fetchJobs();

      // If we came from dashboard, go back
      if (location.state?.showAddForm) {
        navigate("/dashboard");
      }
    } catch (error) {
      setError(error.response?.data?.error || "Failed to create job");
      console.error("Create job error:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      const job = jobs.find((j) => j.id === jobId);
      await axios.put(`/api/jobs/${jobId}`, {
        ...job,
        status: newStatus,
      });
      fetchJobs();
    } catch (error) {
      setError("Failed to update job status");
      console.error("Update job error:", error);
    }
  };

  const assignJob = async (jobId, technicianId) => {
    try {
      const job = jobs.find((j) => j.id === jobId);
      await axios.put(`/api/jobs/${jobId}`, {
        ...job,
        assigned_to: technicianId,
      });
      fetchJobs();
    } catch (error) {
      setError("Failed to assign job");
      console.error("Assign job error:", error);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) {
      return;
    }

    try {
      await axios.delete(`/api/jobs/${jobId}`);
      fetchJobs();
    } catch (error) {
      setError("Failed to delete job");
      console.error("Delete job error:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-600">Manage your job assignments</p>
        </div>
        {hasPermission("jobs.create") && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Job
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Create New Job
            </h3>
            {location.state?.showAddForm && (
              <button
                onClick={() => navigate("/dashboard")}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to Dashboard
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter job title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              {hasPermission("jobs.assign") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Assign to Technician
                  </label>
                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter job description"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  if (location.state?.showAddForm) {
                    navigate("/dashboard");
                  }
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Job
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {jobs.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No jobs found. Create your first job to get started.
            </li>
          ) : (
            jobs.map((job) => (
              <li
                key={job.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleJobClick(job)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {job.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {job.update_count > 0 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {job.update_count} update
                            {job.update_count !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    {job.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {job.description}
                      </p>
                    )}
                    {job.customer_name && (
                      <p className="mt-1 text-sm text-gray-500">
                        Customer: {job.customer_name}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Created: {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className="ml-4 flex items-center space-x-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hasPermission("jobs.update_status") && (
                      <select
                        value={job.status}
                        onChange={(e) =>
                          updateJobStatus(job.id, e.target.value)
                        }
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                    {hasPermission("jobs.assign") && (
                      <select
                        value={job.assigned_to || ""}
                        onChange={(e) => assignJob(job.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {technicians.map((technician) => (
                          <option key={technician.id} value={technician.id}>
                            {technician.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {hasPermission("jobs.delete") && (
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {selectedJob && (
        <JobDetail
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onJobUpdate={fetchJobs}
        />
      )}
    </div>
  );
};

export default Jobs;
