import React, { useState, useEffect } from "react";
import axios from "axios";

const JobStatusTransition = ({ job, onStatusChange, onClose }) => {
  const [availableTransitions, setAvailableTransitions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workflowConfig, setWorkflowConfig] = useState({});

  useEffect(() => {
    fetchAvailableTransitions();
  }, [job.id]);

  const fetchAvailableTransitions = async () => {
    try {
      const response = await axios.get(`/api/jobs/${job.id}/transitions`);
      setAvailableTransitions(response.data.data.availableTransitions);
      setWorkflowConfig({
        requiresComment: response.data.data.requiresComment || [],
        requiresAssignment: response.data.data.requiresAssignment || []
      });
    } catch (error) {
      console.error("Error fetching transitions:", error);
      setError("Failed to load available status transitions");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) return;

    // Check if comment is required for this status
    const requiresComment = workflowConfig.requiresComment?.includes(selectedStatus);
    if (requiresComment && !comment.trim()) {
      setError(`A comment is required when changing status to '${selectedStatus}'`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updateData = {
        status: selectedStatus,
        ...(comment.trim() && { comment: comment.trim() })
      };

      const response = await axios.put(`/api/jobs/${job.id}`, updateData);
      
      if (onStatusChange) {
        onStatusChange(response.data.data);
      }
      
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to update job status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplayName = (status) => {
    const statusNames = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'on_hold': 'On Hold'
    };
    return statusNames[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'on_hold': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'in_progress': '🔧',
      'completed': '✅',
      'cancelled': '❌',
      'on_hold': '⏸️'
    };
    return icons[status] || '📝';
  };

  if (availableTransitions.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Job Status</h3>
            <p className="text-gray-500 mb-4">No status transitions are available for this job.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-gray-900">Change Job Status</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Current Status */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Status
          </label>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${getStatusColor(job.status)}`}>
            <span className="mr-2">{getStatusIcon(job.status)}</span>
            {getStatusDisplayName(job.status)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status
            </label>
            <div className="space-y-2">
              {availableTransitions.map((status) => (
                <label
                  key={status}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedStatus === status 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mr-3"
                  />
                  <span className="mr-2">{getStatusIcon(status)}</span>
                  <span className="font-medium">{getStatusDisplayName(status)}</span>
                  {workflowConfig.requiresComment?.includes(status) && (
                    <span className="ml-auto text-xs text-red-600">*Comment required</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Comment Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment
              {workflowConfig.requiresComment?.includes(selectedStatus) && (
                <span className="text-red-600 ml-1">*</span>
              )}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                workflowConfig.requiresComment?.includes(selectedStatus)
                  ? "Please provide a reason for this status change..."
                  : "Optional comment about this status change..."
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              maxLength="500"
            />
            <div className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              <span>{loading ? "Updating..." : "Update Status"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobStatusTransition;