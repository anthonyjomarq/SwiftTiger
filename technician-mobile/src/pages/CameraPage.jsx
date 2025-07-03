import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Shared components
import { MobileHeader } from '../../shared/components/MobileLayout';
import { useNotifications } from '../../shared/components/NotificationHub';

// Local components and contexts
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';

const CameraPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { apiRequest } = useAuth();
  const { isOnline, addPendingAction } = useOffline();
  const { showSuccess, showError, showInfo } = useNotifications();
  const queryClient = useQueryClient();
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // back camera by default
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Get job ID and return path from navigation state
  const jobId = location.state?.jobId;
  const returnTo = location.state?.returnTo || '/jobs';

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  useEffect(() => {
    checkCameraDevices();
  }, []);

  const checkCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (error) {
      console.error('Error checking camera devices:', error);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError(error.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage({ blob, url: imageUrl });
        stopCamera();
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.9);
  };

  const retakePhoto = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
    }
    startCamera();
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
  };

  const selectFromGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      setCapturedImage({ blob: file, url: imageUrl });
      stopCamera();
    }
  };

  // Upload photo mutation
  const uploadMutation = useMutation({
    mutationFn: async (photoData) => {
      const formData = new FormData();
      formData.append('photo', photoData.blob);
      if (jobId) {
        formData.append('jobId', jobId);
      }
      formData.append('type', 'job_photo');
      formData.append('timestamp', new Date().toISOString());

      const response = await apiRequest('/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['job', jobId]);
      queryClient.invalidateQueries(['jobs']);
      showSuccess('Photo Saved', 'Photo uploaded successfully');
      navigate(returnTo);
    },
    onError: (error) => {
      if (!isOnline) {
        // Store photo for offline upload
        addPendingAction({
          type: 'UPLOAD_PHOTO',
          data: {
            jobId,
            photo: capturedImage.blob,
            timestamp: Date.now(),
          },
        });
        showInfo('Saved Offline', 'Photo will upload when online');
        navigate(returnTo);
      } else {
        showError('Upload Failed', error.message);
      }
    },
  });

  const savePhoto = () => {
    if (capturedImage) {
      uploadMutation.mutate(capturedImage);
    }
  };

  const handleBack = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
    }
    stopCamera();
    navigate(returnTo);
  };

  return (
    <div className="camera-page bg-black min-h-screen">
      <MobileHeader
        title="Take Photo"
        showBack
        onBack={handleBack}
        className="bg-black text-white border-b-gray-800"
        rightAction={
          hasMultipleCameras && !capturedImage && !cameraError && (
            <button
              onClick={switchCamera}
              className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )
        }
      />

      <div className="relative flex-1 flex flex-col">
        {cameraError ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-white">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-lg font-semibold mb-2">Camera Access Denied</h3>
              <p className="text-gray-300 mb-4">
                Unable to access camera. Please check your browser permissions.
              </p>
              <div className="space-y-2">
                <button
                  onClick={startCamera}
                  className="block w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
                <button
                  onClick={selectFromGallery}
                  className="block w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Choose from Gallery
                </button>
              </div>
            </div>
          </div>
        ) : capturedImage ? (
          // Show captured image
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-black">
              <img
                src={capturedImage.url}
                alt="Captured"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="p-4 bg-black">
              <div className="flex space-x-3">
                <button
                  onClick={retakePhoto}
                  className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={savePhoto}
                  disabled={uploadMutation.isLoading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {uploadMutation.isLoading ? 'Saving...' : 'Save Photo'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Show camera view
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Camera overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-white border-opacity-30 rounded-lg"></div>
                
                {/* Corner guides */}
                <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-white"></div>
                <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-white"></div>
                <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-white"></div>
                <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-white"></div>
              </div>
            </div>
            
            {/* Camera controls */}
            <div className="p-6 bg-black">
              <div className="flex items-center justify-center space-x-8">
                <button
                  onClick={selectFromGallery}
                  className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                
                <button
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 hover:bg-gray-100 disabled:bg-gray-300 transition-colors flex items-center justify-center"
                >
                  {isCapturing ? (
                    <div className="w-8 h-8 bg-gray-400 rounded-full animate-pulse"></div>
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-400"></div>
                  )}
                </button>
                
                {hasMultipleCameras && (
                  <button
                    onClick={switchCamera}
                    className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden file input for gallery selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default CameraPage;