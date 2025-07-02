import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import JobEditForm from "./JobEditForm";
import JobNoteForm from "./JobNoteForm";
import JobNoteItem from "./JobNoteItem";
import JobStatusTransition from "./JobStatusTransition";
import JobWorkflowAnalytics from "./JobWorkflowAnalytics";

const JobDetail = ({ job, onClose, onJobUpdate }) => {
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [noteFilter, setNoteFilter] = useState('all');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [showStatusTransition, setShowStatusTransition] = useState(false);
  const [showWorkflowAnalytics, setShowWorkflowAnalytics] = useState(false);
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

  const handleSubmitUpdate = async (noteData) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`/api/jobs/${job.id}/updates`, noteData);
      setUpdates([response.data.data, ...updates]);
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

  const handleUpdateNote = async (noteId, noteData) => {
    try {
      const response = await axios.put(`/api/jobs/${job.id}/updates/${noteId}`, noteData);
      setUpdates(updates.map(update => 
        update.id === noteId ? response.data.data : update
      ));
      setEditingNoteId(null);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to update note");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await axios.delete(`/api/jobs/${job.id}/updates/${noteId}`);
      setUpdates(updates.filter(update => update.id !== noteId));
    } catch (error) {
      setError(error.response?.data?.error || "Failed to delete note");
    }
  };

  const handlePinNote = async (noteId, isPinned) => {
    try {
      await axios.patch(`/api/jobs/${job.id}/updates/${noteId}/pin`, { is_pinned: isPinned });
      setUpdates(updates.map(update => 
        update.id === noteId ? { ...update, is_pinned: isPinned } : update
      ));
    } catch (error) {
      setError(error.response?.data?.error || "Failed to pin note");
    }
  };

  const handleStatusChange = (updatedJob) => {
    // Refresh the job data and notes
    if (onJobUpdate) {
      onJobUpdate();
    }
    fetchUpdates();
    setShowStatusTransition(false);
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

  const getUpdateTypeIcon = (type, noteType) => {
    const icons = {
      comment: "💬",
      status_change: "🔄",
      assignment: "👤",
      completion: "✅",
    };
    
    const noteIcons = {
      general: "📝",
      technical: "🔧",
      customer: "👥",
      internal: "🏢",
      status_change: "🔄"
    };
    
    return noteType ? noteIcons[noteType] : icons[type] || "📝";
  };

  const getFilteredUpdates = () => {
    if (noteFilter === 'all') return updates;
    if (noteFilter === 'pinned') return updates.filter(update => update.is_pinned);
    return updates.filter(update => update.note_type === noteFilter);
  };

  const sortUpdates = (updates) => {
    return [...updates].sort((a, b) => {
      // Pinned notes first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // Then by creation date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
            <div className="flex items-center space-x-4 mb-2">
              <span className="text-sm text-gray-500">
                Customer: {job.customer_name || "N/A"}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {getStatusIcon(job.status)} {job.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {hasPermission("jobs.edit") && (
                <>
                  <button
                    onClick={() => setShowStatusTransition(true)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-1"
                  >
                    <span>🔄</span>
                    <span>Change Status</span>
                  </button>
                  
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                </>
              )}
              
              <button
                onClick={() => setShowWorkflowAnalytics(true)}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center space-x-1"
              >
                <span>📊</span>
                <span>Analytics</span>
              </button>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {job.description && (
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h4 className="font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-gray-600">{job.description}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-700">Notes & Comments</h4>
            <div className="flex gap-2">
              <select
                value={noteFilter}
                onChange={(e) => setNoteFilter(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Notes</option>
                <option value="pinned">Pinned</option>
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="customer">Customer</option>
                <option value="internal">Internal</option>
              </select>
            </div>
          </div>

          {/* New note form */}
          <JobNoteForm
            onSubmit={handleSubmitUpdate}
            loading={loading}
            error={error}
            onError={setError}
          />

          {/* Notes timeline */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {getFilteredUpdates().length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No notes yet. Be the first to add one!
              </p>
            ) : (
              sortUpdates(getFilteredUpdates()).map((update) => (
                <JobNoteItem
                  key={update.id}
                  note={update}
                  currentUser={user}
                  isEditing={editingNoteId === update.id}
                  onEdit={() => setEditingNoteId(update.id)}
                  onCancelEdit={() => setEditingNoteId(null)}
                  onUpdate={(noteData) => handleUpdateNote(update.id, noteData)}
                  onDelete={() => handleDeleteNote(update.id)}
                  onPin={(isPinned) => handlePinNote(update.id, isPinned)}
                  getIcon={(type, noteType) => getUpdateTypeIcon(type, noteType)}
                  formatDate={formatDate}
                  hasPermission={hasPermission}
                />
              ))
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
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

      {showStatusTransition && (
        <JobStatusTransition
          job={job}
          onStatusChange={handleStatusChange}
          onClose={() => setShowStatusTransition(false)}
        />
      )}

      {showWorkflowAnalytics && (
        <JobWorkflowAnalytics
          jobId={job.id}
          onClose={() => setShowWorkflowAnalytics(false)}
        />
      )}
    </div>
  );
};

export default JobDetail;
