import React, { useState, useEffect } from "react";
import { useSocketContext } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";

const RealtimeJobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected, on, off } = useSocketContext();
  const { hasPermission } = useAuth();

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for job updates
    const handleJobUpdate = (data) => {
      const { jobId, job } = data;

      setJobs((prevJobs) => {
        const index = prevJobs.findIndex((j) => j.id === jobId);
        if (index !== -1) {
          // Update existing job
          const newJobs = [...prevJobs];
          newJobs[index] = { ...newJobs[index], ...job };
          return newJobs;
        }
        // Add new job if not found
        return [job, ...prevJobs];
      });

      // Show notification
      showNotification(`Job "${job.title}" was updated`);
    };

    on("job:updated", handleJobUpdate);

    return () => {
      off("job:updated", handleJobUpdate);
    };
  }, [socket, isConnected, on, off]);

  const fetchJobs = async () => {
    try {
      const data = await apiService.jobs.getAll();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message) => {
    // Create a simple notification
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("animate-fade-out");
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Jobs ({jobs.length})
          </h3>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm text-gray-500">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{job.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Customer: {job.customer_name || "N/A"}
                  </p>
                  {job.assigned_to && (
                    <p className="text-sm text-gray-600">
                      Assigned to: {job.technician_name || "Technician"}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    job.status
                  )}`}
                >
                  {job.status?.replace(/_/g, " ")}
                </span>
              </div>

              {job.update_count > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {job.update_count} update{job.update_count !== 1 ? "s" : ""}{" "}
                    • Last activity:{" "}
                    {new Date(
                      job.last_activity || job.created_at
                    ).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          ))}

          {jobs.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No jobs found. Create your first job to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeJobList;
