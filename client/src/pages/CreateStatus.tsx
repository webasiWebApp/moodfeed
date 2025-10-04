import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, AlertCircle } from 'lucide-react';

// Type definitions for Jeeliz FaceFilter
declare global {
  interface Window {
    JEELIZFACEFILTER: any;
  }
}

const CreateStatus: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const filters = [
    { id: 'none', name: 'None' },
    { id: 'grayscale', name: 'Grayscale' },
    { id: 'sepia', name: 'Sepia' },
    { id: 'invert', name: 'Invert' },
    { id: 'blur', name: 'Blur' },
    { id: 'brightness', name: 'Bright' },
    { id: 'contrast', name: 'Contrast' },
    { id: 'saturate', name: 'Saturate' },
  ];

  useEffect(() => {
    let mounted = true;
    let animationId: number;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 1280, height: 720 },
          audio: false
        });

        if (videoRef.current && mounted) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play();
              setIsLoading(false);
              startRendering();
            }
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (mounted) {
          setCameraError('Unable to access camera. Please check permissions.');
          setIsLoading(false);
        }
      }
    };

    const startRendering = () => {
      const render = () => {
        if (!mounted || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          // Set canvas size to match video
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          // Apply filter
          applyFilter(ctx);
          
          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        animationId = requestAnimationFrame(render);
      };

      render();
    };

    const applyFilter = (ctx: CanvasRenderingContext2D) => {
      switch(selectedFilter) {
        case 'grayscale':
          ctx.filter = 'grayscale(100%)';
          break;
        case 'sepia':
          ctx.filter = 'sepia(100%)';
          break;
        case 'invert':
          ctx.filter = 'invert(100%)';
          break;
        case 'blur':
          ctx.filter = 'blur(3px)';
          break;
        case 'brightness':
          ctx.filter = 'brightness(150%)';
          break;
        case 'contrast':
          ctx.filter = 'contrast(200%)';
          break;
        case 'saturate':
          ctx.filter = 'saturate(300%)';
          break;
        default:
          ctx.filter = 'none';
      }
    };

    startCamera();

    // Simulate face detection (you can integrate actual face detection if needed)
    const faceDetectionInterval = setInterval(() => {
      if (mounted && !isLoading && !cameraError) {
        setIsFaceDetected(true);
      }
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(faceDetectionInterval);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      // Stop camera
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedFilter, isLoading, cameraError]);

  const handleCapture = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      console.log('Captured image with filter:', selectedFilter);
      
      const link = document.createElement('a');
      link.download = `status-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleClose = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    console.log('Closing camera');
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center">
      <Button 
        className="absolute top-4 right-4 z-10" 
        variant="ghost" 
        size="icon" 
        onClick={handleClose}
      >
        <X className="w-6 h-6" />
      </Button>
      
      {isFaceDetected && !isLoading && (
        <div className="absolute top-4 left-4 z-10 bg-green-500/20 border border-green-500 rounded-lg px-3 py-1">
          <p className="text-green-400 text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Face Detected
          </p>
        </div>
      )}
      
      <div className="relative w-full h-full flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Initializing camera...</p>
            </div>
          </div>
        )}
        
        {cameraError ? (
          <div className="bg-gray-800 w-full h-full flex items-center justify-center">
            <div className="text-center px-4">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-xl text-red-400">{cameraError}</p>
              <p className="text-sm text-gray-400 mt-2">Please check camera permissions</p>
            </div>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef}
              className="hidden"
              autoPlay
              playsInline
              muted
            />
            <canvas 
              ref={canvasRef}
              className="w-full h-full object-cover"
              style={{
                transform: 'scaleX(-1)' // Mirror effect for selfie view
              }}
            />
          </>
        )}
      </div>
      
      <div className="absolute bottom-32 w-full overflow-x-auto">
        <div className="flex space-x-3 px-4 pb-2">
          {filters.map(filter => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? 'secondary' : 'ghost'}
              onClick={() => setSelectedFilter(filter.id)}
              className="flex-shrink-0 text-sm whitespace-nowrap"
              disabled={isLoading}
            >
              {filter.name}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-8 flex items-center justify-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          className="w-16 h-16 rounded-full border-4 border-white bg-transparent hover:bg-white/10 hover:scale-110 transition-transform"
          onClick={handleCapture}
          disabled={isLoading || !!cameraError}
        >
          <Camera className="w-8 h-8" />
        </Button>
      </div>
      
      {selectedFilter !== 'none' && !isLoading && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
          <p className="text-sm text-white">{filters.find(f => f.id === selectedFilter)?.name} filter active</p>
        </div>
      )}
    </div>
  );
};

export default CreateStatus;