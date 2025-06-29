import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import JobEditForm from "./JobEditForm";

const JobDetail = ({ job, onClose, onJobUpdate }) => {
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    fetchUpdates();
  }, [job.id]);

  const fetchUpdates = async () => {
    try {
      const response = await axios.get(`/api/jobs/${job.id}/updates`);
      setUpdates(response.data.updates);
    } catch (error) {
      console.error("Error fetching updates:", error);
    }
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdate.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`/api/jobs/${job.id}/updates`, {
        content: newUpdate,
        update_type: "comment",
      });

      setUpdates([response.data, ...updates]);
      setNewUpdate("");

      // Notify parent component to refresh job list
      if (onJobUpdate) {
        onJobUpdate();
      }
    } catch (error) {
      setError(error.response?.data?.error || "Failed to post update");
    } finally {
      setLoading(false);
    }
  };

  const getUpdateTypeIcon = (type) => {
    const icons = {
      comment: "💬",
      status_change: "🔄",
      assignment: "👤",
      completion: "✅",
    };
    return icons[type] || "📝";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
            <p className="text-sm text-gray-500">
              Customer: {job.customer_name || "N/A"} | Status:{" "}
              <span className="font-medium">{job.status}</span>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {hasPermission("jobs.edit") && (
              <button
                onClick={() => setShowEditForm(true)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        </div>

        {job.description && (
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h4 className="font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-gray-600">{job.description}</p>
          </div>
        )}

        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-4">Activity Timeline</h4>

          {/* New update form */}
          <form onSubmit={handleSubmitUpdate} className="mb-6">
            <div className="flex gap-2">
              <textarea
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                placeholder="Add an update..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows="2"
              />
              <button
                type="submit"
                disabled={loading || !newUpdate.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </form>

          {/* Updates timeline */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {updates.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No updates yet. Be the first to add one!
              </p>
            ) : (
              updates.map((update) => (
                <div
                  key={update.id}
                  className="flex gap-3 p-3 bg-gray-50 rounded"
                >
                  <div className="flex-shrink-0 text-2xl">
                    {getUpdateTypeIcon(update.update_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-gray-900">
                          {update.user_name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({update.user_role})
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(update.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-700">{update.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <JobEditForm
          job={job}
          onClose={() => setShowEditForm(false)}
          onJobUpdate={() => {
            if (onJobUpdate) {
              onJobUpdate();
            }
            setShowEditForm(false);
          }}
        />
      )}
    </div>
  );
};

export default JobDetail;
