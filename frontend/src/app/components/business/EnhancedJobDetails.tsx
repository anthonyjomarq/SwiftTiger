import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  MapPin, 
  Clock, 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft,
  Save,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { JobTimer } from '@/app/components/business/JobTimer';
import { PhotoCapture } from '@/app/components/business/PhotoCapture';
import { DigitalSignature } from '@/app/components/business/DigitalSignature';
import { useRealTimeJobs } from '@/shared/hooks/useRealTimeJobs';

interface JobDetails {
  id: string;
  jobName: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  serviceType: string;
  scheduledDate: string;
  estimatedDuration: number;
  actualDuration?: number;
  Customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    addressStreet: string;
    addressCity: string;
    addressState: string;
    addressLatitude?: number;
    addressLongitude?: number;
  };
  AssignedTechnician?: {
    id: string;
    name: string;
    email: string;
  };
  workStartTime?: string;
  workEndTime?: string;
  photos?: any[];
  signature?: any;
}

interface Photo {
  id: string;
  file: File;
  preview: string;
  caption?: string;
  timestamp: Date;
}

interface SignatureData {
  signature: string;
  timestamp: Date;
  signerName?: string;
  signerTitle?: string;
}

export function EnhancedJobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [workStartTime, setWorkStartTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Real-time updates
  useRealTimeJobs(id);

  useEffect(() => {
    if (id) {
      fetchJobDetails(id);
    }
  }, [id]);

  const fetchJobDetails = async (jobId: string) => {
    try {
      setLoading(true);
      // In a real app, this would be an API call
      // For demo purposes, using mock data
      const mockJob: JobDetails = {
        id: jobId,
        jobName: 'HVAC System Maintenance',
        description: 'Annual maintenance check for commercial HVAC system including filter replacement, duct cleaning, and performance testing.',
        status: 'In Progress',
        priority: 'High',
        serviceType: 'Maintenance',
        scheduledDate: new Date().toISOString(),
        estimatedDuration: 180,
        Customer: {
          id: '1',
          name: 'Acme Corporation',
          email: 'facilities@acmecorp.com',
          phone: '(555) 123-4567',
          addressStreet: '123 Business Ave',
          addressCity: 'New York',
          addressState: 'NY',
          addressLatitude: 40.7128,
          addressLongitude: -74.0060
        },
        AssignedTechnician: {
          id: '1',
          name: 'John Smith',
          email: 'john@swifttiger.com'
        },
        workStartTime: new Date(Date.now() - 3600000).toISOString() // Started 1 hour ago
      };

      setJob(mockJob);
      
      // Set work start time if job is in progress
      if (mockJob.workStartTime) {
        setWorkStartTime(new Date(mockJob.workStartTime));
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleTimerStart = async (startTime: Date) => {
    try {
      setWorkStartTime(startTime);
      // Update job status to "In Progress" if it wasn't already
      if (job && job.status === 'Pending') {
        await updateJobStatus('In Progress');
      }
      toast.success('Work timer started');
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer');
    }
  };

  const handleTimerStop = async (startTime: Date, endTime: Date, duration: number) => {
    try {
      setWorkStartTime(null);
      // Save the work duration
      if (job) {
        const updatedJob = {
          ...job,
          actualDuration: Math.floor(duration / 60), // Convert to minutes
          workEndTime: endTime.toISOString()
        };
        setJob(updatedJob);
      }
      toast.success(`Work completed. Duration: ${Math.floor(duration / 60)} minutes`);
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error('Failed to stop timer');
    }
  };

  const updateJobStatus = async (newStatus: JobDetails['status']) => {
    try {
      if (!job) return;
      
      const updatedJob = { ...job, status: newStatus };
      setJob(updatedJob);
      
      // In a real app, this would be an API call
      toast.success(`Job status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const saveJobProgress = async () => {
    try {
      setIsSaving(true);
      
      // Prepare job log data
      const jobLogData = {
        notes,
        photos: photos.map(photo => ({
          filename: photo.file.name,
          caption: photo.caption,
          timestamp: photo.timestamp
        })),
        signature: signature ? {
          signature: signature.signature,
          signerName: signature.signerName,
          signerTitle: signature.signerTitle,
          timestamp: signature.timestamp
        } : null,
        workStartTime: workStartTime?.toISOString(),
        workEndTime: new Date().toISOString()
      };

      // In a real app, this would upload photos and save to API
      console.log('Saving job progress:', jobLogData);
      
      toast.success('Job progress saved successfully');
    } catch (error) {
      console.error('Error saving job progress:', error);
      toast.error('Failed to save job progress');
    } finally {
      setIsSaving(false);
    }
  };

  const completeJob = async () => {
    try {
      if (!signature) {
        toast.error('Customer signature is required to complete the job');
        return;
      }

      await saveJobProgress();
      await updateJobStatus('Completed');
      
      toast.success('Job completed successfully!');
      navigate('/jobs');
    } catch (error) {
      console.error('Error completing job:', error);
      toast.error('Failed to complete job');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Job Not Found
          </h2>
          <button
            onClick={() => navigate('/jobs')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Return to Jobs
          </button>
        </div>
      </div>
    );
  }

  const canModify = job.status !== 'Completed' && job.status !== 'Cancelled';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/jobs')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Jobs</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {canModify && (
              <button
                onClick={saveJobProgress}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Progress'}</span>
              </button>
            )}
            
            {job.status === 'In Progress' && (
              <button
                onClick={completeJob}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Complete Job</span>
              </button>
            )}
          </div>
        </div>

        {/* Job Header */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {job.jobName}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {job.description}
              </p>
            </div>
            <div className="flex space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(job.priority)}`}>
                {job.priority} Priority
              </span>
            </div>
          </div>

          {/* Job Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(job.scheduledDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {job.actualDuration ? `${job.actualDuration} min` : `${job.estimatedDuration} min (est.)`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Technician</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {job.AssignedTechnician?.name || 'Unassigned'}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                <p className="font-medium text-gray-900 dark:text-white">{job.Customer.name}</p>
                <p className="text-gray-600 dark:text-gray-300">
                  {job.Customer.addressStreet}, {job.Customer.addressCity}, {job.Customer.addressState}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {job.Customer.phone} • {job.Customer.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Work Timer */}
          <JobTimer
            jobId={job.id}
            initialStartTime={workStartTime}
            onTimerStart={handleTimerStart}
            onTimerStop={handleTimerStop}
            disabled={!canModify}
          />

          {/* Photo Capture */}
          <PhotoCapture
            photos={photos}
            onPhotosChange={setPhotos}
            disabled={!canModify}
            maxPhotos={10}
          />
        </div>

        {/* Job Notes */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Work Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canModify}
              placeholder="Add notes about the work performed, findings, recommendations, etc..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:bg-gray-50 dark:disabled:bg-gray-800"
            />
          </div>
        </div>

        {/* Digital Signature */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <DigitalSignature
              signature={signature}
              onSignatureChange={setSignature}
              signerName={job.Customer.name}
              signerTitle="Customer Representative"
              disabled={!canModify}
              required={job.status === 'In Progress'}
            />
          </div>
        </div>

        {/* Completion Requirements */}
        {job.status === 'In Progress' && (
          <div className="mt-8">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-4">
                Job Completion Requirements
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {notes.trim() ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                  )}
                  <span className="text-sm">Add work notes</span>
                </div>
                <div className="flex items-center space-x-2">
                  {photos.length > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                  )}
                  <span className="text-sm">Take job photos (optional)</span>
                </div>
                <div className="flex items-center space-x-2">
                  {signature ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-red-400" />
                  )}
                  <span className="text-sm">Get customer signature (required)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}