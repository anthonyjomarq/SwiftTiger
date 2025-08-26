import React, { useState, useEffect } from 'react';
import { jobLogService } from '../services/jobLogService';
import { useAuth } from '../contexts/AuthContext';
import { JobStatus, User as UserType } from '../types';

interface JobLogFormData {
  notes: string;
  statusUpdate: JobStatus | '';
}

interface JobLogPhoto {
  filename: string;
  originalName: string;
}

interface JobLog {
  id: string;
  jobId: string;
  notes: string;
  statusUpdate?: JobStatus;
  photos?: JobLogPhoto[];
  createdAt: string;
  updatedAt: string;
  Technician?: UserType;
}

interface JobLogsProps {
  jobId: string;
  jobStatus: JobStatus;
}

interface StatusProgress {
  percentage: number;
  color: string;
  label: string;
}

const JobLogs: React.FC<JobLogsProps> = ({ jobId, jobStatus }) => {
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery<JobLog[]>(
    ['job-logs', jobId],
    () => jobLogService.getJobLogs(jobId),
    { enabled: !!jobId }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<JobLogFormData>({
    defaultValues: {
      notes: '',
      statusUpdate: '',
    },
  });

  const createLogMutation = useMutation(
    (data: FormData) => jobLogService.createJobLog(jobId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['job-logs', jobId]);
        queryClient.invalidateQueries('jobs');
        reset();
        setSelectedPhotos([]);
        setIsAddingLog(false);
        toast.success('Job log added successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to add job log');
      },
    }
  );

  const updateLogMutation = useMutation(
    ({ logId, data }: { logId: string; data: FormData }) => jobLogService.updateJobLog(jobId, logId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['job-logs', jobId]);
        queryClient.invalidateQueries('jobs');
        setEditingLogId(null);
        setSelectedPhotos([]);
        toast.success('Job log updated successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update job log');
      },
    }
  );

  const deleteLogMutation = useMutation(
    (logId: string) => jobLogService.deleteJobLog(jobId, logId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['job-logs', jobId]);
        queryClient.invalidateQueries('jobs');
        toast.success('Job log deleted successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete job log');
      },
    }
  );

  const handleAddLog = (data: JobLogFormData): void => {
    const formData = new FormData();
    formData.append('notes', data.notes);
    
    if (data.statusUpdate) {
      formData.append('statusUpdate', data.statusUpdate);
    }

    // Add photos
    selectedPhotos.forEach((photo) => {
      formData.append('photos', photo);
    });

    createLogMutation.mutate(formData);
  };

  const handleEditLog = (log: JobLog): void => {
    setEditingLogId(log.id);
    reset({
      notes: log.notes,
      statusUpdate: log.statusUpdate || '',
    });
    setSelectedPhotos([]);
  };

  const handleUpdateLog = (data: JobLogFormData): void => {
    if (!editingLogId) return;

    const formData = new FormData();
    formData.append('notes', data.notes);
    
    if (data.statusUpdate) {
      formData.append('statusUpdate', data.statusUpdate);
    }

    // Add new photos
    selectedPhotos.forEach((photo) => {
      formData.append('photos', photo);
    });

    updateLogMutation.mutate({ logId: editingLogId, data: formData });
  };

  const handleDeleteLog = (logId: string): void => {
    if (window.confirm('Are you sure you want to delete this job log?')) {
      deleteLogMutation.mutate(logId);
    }
  };

  const cancelEdit = (): void => {
    setEditingLogId(null);
    setSelectedPhotos([]);
    reset({ notes: '', statusUpdate: '' });
  };

  const canEditLog = (log: JobLog): boolean => {
    return log.Technician?.id === user?.id || ['admin', 'manager'].includes(user?.role || '');
  };

  const canDeleteLog = (): boolean => {
    return ['admin', 'manager'].includes(user?.role || '');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        return false;
      }
      return true;
    });
    
    setSelectedPhotos(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const removePhoto = (index: number): void => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusProgress = (status: JobStatus): StatusProgress => {
    switch (status) {
      case 'Pending':
        return { percentage: 0, color: 'bg-gray-400', label: 'Not Started' };
      case 'In Progress':
        return { percentage: 50, color: 'bg-blue-500', label: 'In Progress' };
      case 'Completed':
        return { percentage: 100, color: 'bg-green-500', label: 'Completed' };
      case 'Cancelled':
        return { percentage: 0, color: 'bg-red-500', label: 'Cancelled' };
      default:
        return { percentage: 0, color: 'bg-gray-400', label: 'Unknown' };
    }
  };

  const openImageInNewTab = (filename: string): void => {
    window.open(`/api/uploads/${filename}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Job Activity</h3>
          <button
            onClick={() => setIsAddingLog(true)}
            className="btn btn-primary flex items-center gap-2"
            disabled={jobStatus === 'Completed' || jobStatus === 'Cancelled'}
          >
            <Plus className="h-4 w-4" />
            Add Log
          </button>
        </div>

        {/* Job Progress Bar */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Job Progress</span>
            <span className="text-sm font-medium text-gray-900">{getStatusProgress(jobStatus).label}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getStatusProgress(jobStatus).color}`}
              style={{ width: `${getStatusProgress(jobStatus).percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Pending</span>
            <span>In Progress</span>
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Add Log Form */}
      {isAddingLog && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <form onSubmit={handleSubmit(handleAddLog)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes *
              </label>
              <textarea
                {...register('notes', { required: 'Notes are required' })}
                rows={3}
                className="input"
                placeholder="Enter job notes, work performed, issues encountered, etc."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Update
              </label>
              <select 
                value={formData.statusUpdate}
                onChange={(e) => handleInputChange('statusUpdate', e.target.value)}
                className="input"
              >
                <option value="">No status change</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (Max 5, 5MB each)
              </label>
              <div className="flex items-center gap-4">
                <label className="btn btn-secondary cursor-pointer">
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    disabled={selectedPhotos.length >= 5}
                  />
                </label>
                <span className="text-sm text-gray-500">
                  {selectedPhotos.length}/5 photos selected
                </span>
              </div>

              {/* Photo Previews */}
              {selectedPhotos.length > 0 && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddingLog(false);
                  reset();
                  setSelectedPhotos([]);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLogMutation.isLoading}
                className="btn btn-primary"
              >
                {createLogMutation.isLoading ? 'Adding...' : 'Add Log'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Job Logs List */}
      <div className="space-y-4">
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No job logs yet. Add the first log to track job progress.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Log Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{log.Technician?.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {log.statusUpdate && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Status: {log.statusUpdate}
                    </span>
                  )}
                  
                  {/* Edit/Delete Actions */}
                  <div className="flex items-center gap-2">
                    {canEditLog(log) && editingLogId !== log.id && (
                      <button
                        onClick={() => handleEditLog(log)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Edit log"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    
                    {canDeleteLog() && editingLogId !== log.id && (
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete log"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              {editingLogId === log.id ? (
                <form onSubmit={handleSubmit(handleUpdateLog)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes *
                    </label>
                    <textarea
                      {...register('notes', { required: 'Notes are required' })}
                      rows={3}
                      className="input"
                      placeholder="Enter job notes, work performed, issues encountered, etc."
                    />
                    {errors.notes && (
                      <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Update
                    </label>
                    <select 
                      value={formData.statusUpdate}
                      onChange={(e) => handleInputChange('statusUpdate', e.target.value)}
                      className="input"
                    >
                      <option value="">No status change</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Photos (Max 5, 5MB each)
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="btn btn-secondary cursor-pointer">
                        <Camera className="h-4 w-4 mr-2" />
                        Add Photos
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                          disabled={selectedPhotos.length >= 5}
                        />
                      </label>
                      <span className="text-sm text-gray-500">
                        {selectedPhotos.length}/5 photos selected
                      </span>
                    </div>

                    {/* Photo Previews */}
                    {selectedPhotos.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
                        {selectedPhotos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateLogMutation.isLoading}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updateLogMutation.isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Log Content */}
                  <div className="mb-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{log.notes}</p>
                  </div>

                  {/* Photos */}
                  {log.photos && log.photos.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Photos:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {log.photos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={`/api/uploads/${photo.filename}`}
                              alt={photo.originalName}
                              className="w-full h-24 object-cover rounded border hover:opacity-75 cursor-pointer"
                              onClick={() => openImageInNewTab(photo.filename)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobLogs;