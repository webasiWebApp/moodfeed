import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Cleanup function to stop all tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Stop any existing stream first
      stopStream();
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Try environment camera first, fallback to user camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
      } catch (envError) {
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
      }

      streamRef.current = stream;
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          const video = videoRef.current;
          if (video) {
            const handleLoadedMetadata = () => {
              video.removeEventListener('loadedmetadata', handleLoadedMetadata);
              resolve();
            };
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
          }
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasPermission(false);
      setIsLoading(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setError('Camera permission denied. Please allow camera access and try again.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setError('No camera found on this device.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          setError('Camera is already in use by another application.');
        } else {
          setError(error.message || 'Failed to access camera. Please try again.');
        }
      } else {
        setError('An unexpected error occurred while accessing the camera.');
      }
    }
  }, [stopStream]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    
    // Cleanup on unmount
    return () => {
      stopStream();
    };
  }, [startCamera, stopStream]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready. Please try again.');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ensure video has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError('Video not ready. Please wait a moment and try again.');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (!context) {
        setError('Canvas not supported. Please try a different browser.');
        return;
      }
      
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      // Convert to data URL with high quality (still image)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(dataUrl);
      
      // Stop the camera stream after successful capture
      stopStream();
      setError(null);
    } catch (error) {
      console.error('Error capturing image:', error);
      setError('Failed to capture image. Please try again.');
    }
  }, [stopStream]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  }, [startCamera]);

  const handleConfirm = useCallback(async () => {
    if (!capturedImage) {
      setError('No image to confirm. Please capture an image first.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Convert data URL to blob more efficiently
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Create image file with timestamp for uniqueness
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File([blob], `photo-${timestamp}.jpg`, { 
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      onCapture(file);
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing captured image:', error);
      setError('Failed to process image. Please try again.');
      setIsLoading(false);
    }
  }, [capturedImage, onCapture]);

  const handleClose = useCallback(() => {
    stopStream();
    onClose();
  }, [stopStream, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
        case 'Enter':
          event.preventDefault();
          if (!capturedImage && !isLoading) {
            handleCapture();
          } else if (capturedImage) {
            handleConfirm();
          }
          break;
        case 'Escape':
          event.preventDefault();
          handleClose();
          break;
        case 'KeyR':
          if (capturedImage) {
            event.preventDefault();
            handleRetake();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [capturedImage, isLoading, handleCapture, handleConfirm, handleClose, handleRetake]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center w-full relative">
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg flex items-center gap-2 z-10">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {isLoading && !capturedImage && (
          <div className="flex flex-col items-center gap-4 text-white">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-lg">Starting camera...</p>
            <p className="text-sm text-white/70">Ready to capture photos</p>
          </div>
        )}
        
        {capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          />
        ) : (
          <video 
            ref={videoRef} 
            playsInline 
            autoPlay 
            muted
            className="max-w-full max-h-full object-contain"
            style={{ 
              maxHeight: 'calc(100vh - 120px)',
              display: isLoading ? 'none' : 'block'
            }}
          />
        )}
      </div>

      {/* Controls */}
      <div className="w-full p-4 mb-32 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
        {capturedImage ? (
          <div className="flex items-center gap-8">
            <button 
              onClick={handleRetake} 
              className="p-4 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              disabled={isLoading}
              title="Retake photo (R)"
            >
              <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleConfirm} 
              className="p-4 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
              disabled={isLoading}
              title="Confirm photo (Enter)"
            >
              <Check className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleCapture} 
            className="p-4 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50"
            disabled={isLoading || !!error}
            title="Capture photo (Space/Enter)"
          >
            <Camera className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* Close button */}
      <button 
        onClick={handleClose} 
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        title="Close camera (Escape)"
      >
        <X className="w-6 h-6" />
      </button>
      
      {/* Instructions */}
      {!capturedImage && !isLoading && !error && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/70 text-sm text-center">
          <p>Press Space or tap to capture a photo</p>
        </div>
      )}
    </div>
  );
};