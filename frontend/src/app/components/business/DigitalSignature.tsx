import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PenTool, Trash2, CheckCircle, X } from 'lucide-react';

interface SignatureData {
  signature: string; // Base64 image data
  timestamp: Date;
  signerName?: string;
  signerTitle?: string;
}

interface DigitalSignatureProps {
  signature?: SignatureData | null;
  onSignatureChange: (signature: SignatureData | null) => void;
  signerName?: string;
  signerTitle?: string;
  disabled?: boolean;
  required?: boolean;
}

export function DigitalSignature({
  signature,
  onSignatureChange,
  signerName = '',
  signerTitle = '',
  disabled = false,
  required = false
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSignerName, setCurrentSignerName] = useState(signerName);
  const [currentSignerTitle, setCurrentSignerTitle] = useState(signerTitle);
  const [hasDrawn, setHasDrawn] = useState(false);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    context.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Set drawing styles
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // Clear canvas with white background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (showSignaturePad) {
      setTimeout(() => setupCanvas(), 100);
    }
  }, [showSignaturePad, setupCanvas]);

  const getMousePos = (canvas: HTMLCanvasElement, e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    setHasDrawn(true);
    
    const context = canvas.getContext('2d');
    if (!context) return;

    const pos = getMousePos(canvas, e);
    context.beginPath();
    context.moveTo(pos.x, pos.y);
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const pos = getMousePos(canvas, e);
    context.lineTo(pos.x, pos.y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const signatureData: SignatureData = {
      signature: canvas.toDataURL('image/png'),
      timestamp: new Date(),
      signerName: currentSignerName,
      signerTitle: currentSignerTitle
    };

    onSignatureChange(signatureData);
    setShowSignaturePad(false);
  };

  const removeSignature = () => {
    onSignatureChange(null);
  };

  const openSignaturePad = () => {
    setShowSignaturePad(true);
    setHasDrawn(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => startDrawing(e);
    const handleMouseMove = (e: MouseEvent) => draw(e);
    const handleMouseUp = () => stopDrawing();
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      startDrawing(e);
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      draw(e);
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      stopDrawing();
    };

    if (showSignaturePad && !disabled) {
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('touchstart', handleTouchStart);
      canvas.addEventListener('touchmove', handleTouchMove);
      canvas.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showSignaturePad, disabled, isDrawing]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PenTool className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Digital Signature
            {required && <span className="text-red-500 ml-1">*</span>}
          </h3>
        </div>
      </div>

      {/* Existing Signature Display */}
      {signature && !showSignaturePad && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Signed by: {signature.signerName || 'Unknown'}
              </p>
              {signature.signerTitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Title: {signature.signerTitle}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Date: {signature.timestamp.toLocaleString()}
              </p>
            </div>
            {!disabled && (
              <button
                onClick={removeSignature}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="border border-gray-300 dark:border-gray-600 rounded p-2 bg-white">
            <img
              src={signature.signature}
              alt="Digital signature"
              className="max-w-full h-auto"
            />
          </div>
          
          <div className="flex items-center mt-3 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Signature captured</span>
          </div>
        </div>
      )}

      {/* No Signature State */}
      {!signature && !showSignaturePad && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <PenTool className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {required ? 'Signature required to complete this job' : 'No signature captured yet'}
          </p>
          {!disabled && (
            <button
              onClick={openSignaturePad}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Add Signature
            </button>
          )}
        </div>
      )}

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Digital Signature
              </h4>
              <button
                onClick={() => setShowSignaturePad(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Signer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Signer Name *
                  </label>
                  <input
                    type="text"
                    value={currentSignerName}
                    onChange={(e) => setCurrentSignerName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title/Position
                  </label>
                  <input
                    type="text"
                    value={currentSignerTitle}
                    onChange={(e) => setCurrentSignerTitle(e.target.value)}
                    placeholder="Enter title or position"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Signature Canvas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Draw your signature below
                </label>
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-48 bg-white cursor-crosshair touch-none"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Draw your signature using your mouse or finger on touch devices
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={clearSignature}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>
                
                <button
                  onClick={saveSignature}
                  disabled={!hasDrawn || !currentSignerName.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Signature</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}