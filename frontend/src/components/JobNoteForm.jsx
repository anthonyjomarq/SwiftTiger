import React, { useState } from "react";

const JobNoteForm = ({ onSubmit, loading, error, onError }) => {
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [isPrivate, setIsPrivate] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const noteData = {
      content: content.trim(),
      update_type: "comment",
      note_type: noteType,
      is_private: isPrivate,
    };

    await onSubmit(noteData);
    
    // Reset form on success
    setContent("");
    setNoteType("general");
    setIsPrivate(false);
    setShowAdvanced(false);
    onError("");
  };

  const noteTypeOptions = [
    { value: "general", label: "General", icon: "📝" },
    { value: "technical", label: "Technical", icon: "🔧" },
    { value: "customer", label: "Customer", icon: "👥" },
    { value: "internal", label: "Internal", icon: "🏢" },
  ];

  return (
    <form onSubmit={handleSubmit} className="mb-6 border rounded-lg p-4 bg-gray-50">
      <div className="space-y-3">
        {/* Content textarea */}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a note or comment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows="3"
            maxLength="2000"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {content.length}/2000 characters
            </span>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showAdvanced ? "Hide" : "Show"} options
            </button>
          </div>
        </div>

        {/* Advanced options */}
        {showAdvanced && (
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Note type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Note Type
                </label>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {noteTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Privacy setting */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={!isPrivate}
                      onChange={() => setIsPrivate(false)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Public</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={isPrivate}
                      onChange={() => setIsPrivate(true)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Private</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
            <span>{loading ? "Posting..." : "Post Note"}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default JobNoteForm;