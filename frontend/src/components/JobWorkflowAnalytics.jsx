import React, { useState, useEffect } from "react";
import axios from "axios";

const JobWorkflowAnalytics = ({ jobId, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("analytics");

  useEffect(() => {
    fetchWorkflowData();
  }, [jobId]);

  const fetchWorkflowData = async () => {
    try {
      const [analyticsResponse, historyResponse] = await Promise.all([
        axios.get(`/api/jobs/${jobId}/workflow`),
        axios.get(`/api/jobs/${jobId}/history`)
      ]);

      setAnalytics(analyticsResponse.data.data);
      setHistory(historyResponse.data.data);
    } catch (error) {
      console.error("Error fetching workflow data:", error);
      setError("Failed to load workflow analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'on_hold': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading workflow analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Analytics</h3>
            <p className="text-red-600 mb-4">{error}</p>
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
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-gray-900">Workflow Analytics</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "analytics"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📊 Analytics
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📋 History
            </button>
          </nav>
        </div>

        {activeTab === "analytics" && analytics && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Estimated</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {formatDuration(analytics.estimatedDuration)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Actual</p>
                    <p className="text-lg font-semibold text-green-900">
                      {formatDuration(analytics.actualDuration)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Tracked Time</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {formatDuration(analytics.totalTimeTracked)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className={`text-2xl ${getStatusIcon(analytics.currentStatus)}`}>
                      {getStatusIcon(analytics.currentStatus)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-orange-600">Status</p>
                    <p className="text-lg font-semibold text-orange-900 capitalize">
                      {analytics.currentStatus.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">{formatDate(analytics.timeline.created)}</span>
                </div>
                {analytics.timeline.started && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Started:</span>
                    <span className="text-sm font-medium">{formatDate(analytics.timeline.started)}</span>
                  </div>
                )}
                {analytics.timeline.completed && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed:</span>
                    <span className="text-sm font-medium">{formatDate(analytics.timeline.completed)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Breakdown */}
            {Object.keys(analytics.statusBreakdown).length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Time in Each Status</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.statusBreakdown).map(([status, duration]) => (
                    <div key={status} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="mr-2">{getStatusIcon(status)}</span>
                        <span className="text-sm font-medium capitalize">
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{formatDuration(duration)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No status changes recorded yet.</p>
            ) : (
              history.map((entry, index) => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      {entry.from_status && (
                        <>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(entry.from_status)}`}>
                            {getStatusIcon(entry.from_status)} {entry.from_status.replace('_', ' ')}
                          </span>
                          <span className="text-gray-400">→</span>
                        </>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(entry.to_status)}`}>
                        {getStatusIcon(entry.to_status)} {entry.to_status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(entry.changed_at)}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Changed by: <span className="font-medium">{entry.changed_by_name}</span>
                      {entry.changed_by_role && (
                        <span className="text-gray-500"> ({entry.changed_by_role})</span>
                      )}
                    </span>
                    {entry.duration_in_status && (
                      <span className="text-gray-500">
                        Duration: {formatDuration(entry.duration_in_status)}
                      </span>
                    )}
                  </div>
                  
                  {entry.comment && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium text-gray-700">Comment:</span>
                      <p className="text-gray-600 mt-1">{entry.comment}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
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
};

export default JobWorkflowAnalytics;