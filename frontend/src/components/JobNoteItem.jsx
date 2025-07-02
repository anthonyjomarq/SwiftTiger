import React, { useState } from "react";

const JobNoteItem = ({
  note,
  currentUser,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onPin,
  getIcon,
  formatDate,
  hasPermission,
}) => {
  const [editContent, setEditContent] = useState(note.content);
  const [editNoteType, setEditNoteType] = useState(note.note_type || "general");
  const [editIsPrivate, setEditIsPrivate] = useState(note.is_private || false);

  const canEdit = note.user_id === currentUser.id || hasPermission("jobs.edit");
  const canDelete = note.user_id === currentUser.id || hasPermission("jobs.edit");
  const canPin = hasPermission("jobs.edit");

  const handleSaveEdit = () => {
    onUpdate({
      content: editContent,
      note_type: editNoteType,
      is_private: editIsPrivate,
    });
  };

  const handleCancelEdit = () => {
    setEditContent(note.content);
    setEditNoteType(note.note_type || "general");
    setEditIsPrivate(note.is_private || false);
    onCancelEdit();
  };

  const noteTypeOptions = [
    { value: "general", label: "General", icon: "📝" },
    { value: "technical", label: "Technical", icon: "🔧" },
    { value: "customer", label: "Customer", icon: "👥" },
    { value: "internal", label: "Internal", icon: "🏢" },
  ];

  const getNoteTypeLabel = (type) => {
    const option = noteTypeOptions.find(opt => opt.value === type);
    return option ? `${option.icon} ${option.label}` : type;
  };

  if (isEditing) {
    return (
      <div className={`p-4 border rounded-lg ${note.is_pinned ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Note Type
              </label>
              <select
                value={editNoteType}
                onChange={(e) => setEditNoteType(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {noteTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <div className="flex items-center space-x-3 mt-1">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`privacy-${note.id}`}
                    checked={!editIsPrivate}
                    onChange={() => setEditIsPrivate(false)}
                    className="mr-1"
                  />
                  <span className="text-xs text-gray-700">Public</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`privacy-${note.id}`}
                    checked={editIsPrivate}
                    onChange={() => setEditIsPrivate(true)}
                    className="mr-1"
                  />
                  <span className="text-xs text-gray-700">Private</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${
      note.is_pinned 
        ? 'bg-yellow-50 border-yellow-200' 
        : note.is_private 
        ? 'bg-blue-50 border-blue-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Icon */}
      <div className="flex-shrink-0 text-xl">
        {getIcon(note.update_type, note.note_type)}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 text-sm">
              {note.user_name}
            </span>
            <span className="text-xs text-gray-500">
              ({note.user_role})
            </span>
            {note.note_type && note.note_type !== 'general' && (
              <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">
                {getNoteTypeLabel(note.note_type)}
              </span>
            )}
            {note.is_private && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                🔒 Private
              </span>
            )}
            {note.is_pinned && (
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                📌 Pinned
              </span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500">
              {formatDate(note.created_at)}
            </span>
            
            {/* Pin button */}
            {canPin && (
              <button
                onClick={() => onPin(!note.is_pinned)}
                className={`p-1 rounded hover:bg-gray-200 ${
                  note.is_pinned ? 'text-yellow-600' : 'text-gray-400'
                }`}
                title={note.is_pinned ? 'Unpin note' : 'Pin note'}
              >
                📌
              </button>
            )}
            
            {/* Edit button */}
            {canEdit && (
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                title="Edit note"
              >
                ✏️
              </button>
            )}
            
            {/* Delete button */}
            {canDelete && (
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                title="Delete note"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="text-gray-700 text-sm whitespace-pre-wrap break-words">
          {note.content}
        </div>
        
        {/* Edit metadata */}
        {note.edited_at && (
          <div className="mt-2 text-xs text-gray-500">
            Edited {formatDate(note.edited_at)}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobNoteItem;