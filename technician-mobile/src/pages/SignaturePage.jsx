import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Shared components
import { MobileHeader, MobileCard } from '../../shared/components/MobileLayout';
import { useNotifications } from '../../shared/components/NotificationHub';

// Local components and contexts
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';

const SignaturePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { apiRequest } = useAuth();
  const { isOnline, addPendingAction } = useOffline();
  const { showSuccess, showError, showInfo } = useNotifications();
  const queryClient = useQueryClient();
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [signatureType, setSignatureType] = useState('completion'); // completion, approval, receipt
  
  // Get job ID and return path from navigation state
  const jobId = location.state?.jobId;
  const returnTo = location.state?.returnTo || '/jobs';
  const initialType = location.state?.type || 'completion';

  useEffect(() => {
    setSignatureType(initialType);
    initializeCanvas();
  }, [initialType]);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size to match display size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    // Scale the drawing context to match device pixel ratio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Set drawing properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const getTouchPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  };

  const startDrawing = (pos) => {
    setIsDrawing(true);
    setHasSignature(true);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (pos) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault();
    startDrawing(getMousePos(e));
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    draw(getMousePos(e));
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  // Touch events
  const handleTouchStart = (e) => {
    e.preventDefault();
    startDrawing(getTouchPos(e));
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    draw(getTouchPos(e));
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getSignatureBlob = () => {
    return new Promise((resolve) => {
      canvasRef.current.toBlob(resolve, 'image/png');
    });
  };

  // Save signature mutation
  const saveMutation = useMutation({
    mutationFn: async (signatureData) => {
      const formData = new FormData();
      formData.append('signature', signatureData.blob);
      formData.append('customerName', signatureData.customerName);
      formData.append('type', signatureData.type);
      if (jobId) {
        formData.append('jobId', jobId);
      }
      formData.append('timestamp', new Date().toISOString());

      const response = await apiRequest('/signatures/save', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save signature');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['job', jobId]);
      queryClient.invalidateQueries(['jobs']);
      showSuccess('Signature Saved', 'Customer signature saved successfully');
      navigate(returnTo);
    },
    onError: (error) => {
      if (!isOnline) {
        // Store signature for offline upload
        addPendingAction({
          type: 'SAVE_SIGNATURE',
          data: {
            jobId,
            signature: signatureData.blob,
            customerName: signatureData.customerName,
            type: signatureData.type,
            timestamp: Date.now(),
          },
        });
        showInfo('Saved Offline', 'Signature will save when online');
        navigate(returnTo);
      } else {
        showError('Save Failed', error.message);
      }
    },
  });

  const handleSave = async () => {
    if (!hasSignature) {
      showError('No Signature', 'Please provide a signature before saving');
      return;
    }

    if (!customerName.trim()) {
      showError('Customer Name Required', 'Please enter the customer name');
      return;
    }

    const blob = await getSignatureBlob();
    saveMutation.mutate({
      blob,
      customerName: customerName.trim(),
      type: signatureType,
    });
  };

  const handleBack = () => {
    navigate(returnTo);
  };

  const signatureTypes = [
    { id: 'completion', label: 'Job Completion', description: 'Customer confirms job is complete' },
    { id: 'approval', label: 'Work Approval', description: 'Customer approves proposed work' },
    { id: 'receipt', label: 'Service Receipt', description: 'Customer acknowledges service' },
  ];

  return (
    <div className="signature-page bg-gray-50 min-h-screen">
      <MobileHeader
        title="Get Signature"
        showBack
        onBack={handleBack}
      />

      <div className="p-4 space-y-4">
        {/* Signature Type Selection */}
        <MobileCard>
          <h3 className="font-semibold text-gray-900 mb-3">Signature Type</h3>
          <div className="space-y-2">
            {signatureTypes.map((type) => (
              <label key={type.id} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="signatureType"
                  value={type.id}
                  checked={signatureType === type.id}
                  onChange={(e) => setSignatureType(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </MobileCard>

        {/* Customer Name Input */}
        <MobileCard>
          <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </MobileCard>

        {/* Signature Canvas */}
        <MobileCard className="p-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Customer Signature</h3>
              <button
                onClick={clearSignature}
                disabled={!hasSignature}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Please sign in the area below
            </p>
          </div>
          
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-64 border-b border-gray-200 touch-none"
              style={{ touchAction: 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <p className="text-sm">Tap and drag to sign</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              By signing above, the customer acknowledges {signatureType === 'completion' ? 'job completion' : signatureType === 'approval' ? 'work approval' : 'service receipt'}
            </div>
          </div>
        </MobileCard>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasSignature || !customerName.trim() || saveMutation.isLoading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saveMutation.isLoading ? 'Saving...' : 'Save Signature'}
          </button>
        </div>

        {/* Offline Warning */}
        {!isOnline && (
          <MobileCard className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <div className="font-medium text-yellow-800">Offline Mode</div>
                <div className="text-sm text-yellow-700">Signature will save when online</div>
              </div>
            </div>
          </MobileCard>
        )}
      </div>
    </div>
  );
};

export default SignaturePage;