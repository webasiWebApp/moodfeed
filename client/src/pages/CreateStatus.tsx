import React, { useRef, useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, AlertCircle, Check } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { createStatus as createStatusApi } from '../api/status';
import { useNavigate, useParams } from 'react-router-dom';

// Type definitions
declare global {
  interface Window {
    faceapi: any;
  }
}

const user = localStorage.getItem('user');


const CreateStatus: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [statusCaptured, setStatusCaptured] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceDataRef = useRef<any>(null);




  const filters = [
    { id: 'none', name: 'None' },
    { id: 'glasses', name: 'Glasses' },
    { id: 'mask', name: 'Mask' },
    { id: 'crown', name: 'Crown' },
    { id: 'hat', name: 'Hat' },
    { id: 'dogears', name: 'Dog Ears' },
    { id: 'mustache', name: 'Mustache' },
  ];

  useEffect(() => {
    let mounted = true;
    let animationId: number;

    const loadFaceAPI = async () => {
      try {
        // Load face-api.js
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.min.js';
        script.async = true;
        
        script.onload = async () => {
          if (!mounted) return;
          
          // Load models
          const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
          
          await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
          await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
          
          if (mounted) {
            setModelsLoaded(true);
            startCamera();
          }
        };
        
        script.onerror = () => {
          if (mounted) {
            setCameraError('Failed to load face detection library');
            setIsLoading(false);
          }
        };
        
        document.body.appendChild(script);
      } catch (err) {
        console.error('Error loading face-api:', err);
        if (mounted) {
          setCameraError('Failed to initialize AR filters');
          setIsLoading(false);
        }
      }
    };

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
              detectFaces();
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

    const detectFaces = async () => {
      if (!videoRef.current || !canvasRef.current || !window.faceapi) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };

      canvas.width = displaySize.width;
      canvas.height = displaySize.height;

      const detect = async () => {
        if (!mounted || !video || !canvas) return;

        const detections = await window.faceapi
          .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detections) {
          faceDataRef.current = detections;
          setIsFaceDetected(true);
        } else {
          faceDataRef.current = null;
          setIsFaceDetected(false);
        }

        drawFrame();
        animationId = requestAnimationFrame(detect);
      };

      detect();
    };

    const drawFrame = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw video
      ctx.save();
      ctx.scale(-1, 1); // Mirror for selfie view
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      // Draw AR filter if face detected
      if (faceDataRef.current && selectedFilter !== 'none') {
        drawARFilter(ctx, faceDataRef.current);
      }
    };

    const drawARFilter = (ctx: CanvasRenderingContext2D, detection: any) => {
      const landmarks = detection.landmarks;
      const positions = landmarks.positions;

      ctx.save();
      ctx.scale(-1, 1); // Mirror coordinates
      ctx.translate(-ctx.canvas.width, 0);

      switch (selectedFilter) {
        case 'glasses':
          drawGlasses(ctx, positions);
          break;
        case 'mask':
          drawMask(ctx, positions);
          break;
        case 'crown':
          drawCrown(ctx, positions);
          break;
        case 'hat':
          drawHat(ctx, positions);
          break;
        case 'dogears':
          drawDogEars(ctx, positions);
          break;
        case 'mustache':
          drawMustache(ctx, positions);
          break;
      }

      ctx.restore();
    };

    const drawGlasses = (ctx: CanvasRenderingContext2D, positions: any[]) => {
      const leftEye = positions[36];
      const rightEye = positions[45];
      const width = Math.abs(rightEye.x - leftEye.x) * 1.5;
      const height = width * 0.4;

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';

      // Left lens
      ctx.beginPath();
      ctx.ellipse(leftEye.x, leftEye.y, width / 4, height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right lens
      ctx.beginPath();
      ctx.ellipse(rightEye.x, rightEye.y, width / 4, height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bridge
      ctx.beginPath();
      ctx.moveTo(leftEye.x + width / 4, leftEye.y);
      ctx.lineTo(rightEye.x - width / 4, rightEye.y);
      ctx.stroke();
    };

    const drawMask = (ctx: CanvasRenderingContext2D, positions: any[]) => {
      const nose = positions[30];
      const leftCheek = positions[1];
      const rightCheek = positions[15];
      const chin = positions[8];

      const width = Math.abs(rightCheek.x - leftCheek.x);
      const height = Math.abs(chin.y - nose.y) * 1.2;

      ctx.fillStyle = '#4A90E2';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.ellipse(
        (leftCheek.x + rightCheek.x) / 2,
        (nose.y + chin.y) / 2,
        width / 2,
        height / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
    };

    const drawCrown = (ctx: CanvasRenderingContext2D, positions: any[]) => {
      const top = positions[24];
      const left = positions[0];
      const right = positions[16];
      const width = Math.abs(right.x - left.x);
      const centerX = (left.x + right.x) / 2;
      const crownY = top.y - width * 0.4;

      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 3;

      // Crown base
      ctx.beginPath();
      ctx.moveTo(centerX - width / 3, crownY);
      ctx.lineTo(centerX + width / 3, crownY);
      ctx.lineTo(centerX + width / 3, crownY + 30);
      ctx.lineTo(centerX - width / 3, crownY + 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crown peaks
      for (let i = 0; i < 3; i++) {
        const x = centerX - width / 4 + (i * width / 4);
        ctx.beginPath();
        ctx.moveTo(x - 15, crownY);
        ctx.lineTo(x, crownY - 30);
        ctx.lineTo(x + 15, crownY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    };

    const drawHat = (ctx: CanvasRenderingContext2D, positions: any[]) => {
      const top = positions[24];
      const left = positions[0];
      const right = positions[16];
      const width = Math.abs(right.x - left.x);
      const centerX = (left.x + right.x) / 2;
      const hatY = top.y - width * 0.5;

      ctx.fillStyle = '#000000';
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;

      // Hat brim
      ctx.fillRect(centerX - width / 2.5, hatY + 40, width / 1.25, 10);

      // Hat top
      ctx.fillRect(centerX - width / 4, hatY - 40, width / 2, 80);
      ctx.strokeRect(centerX - width / 4, hatY - 40, width / 2, 80);
    };

    const drawDogEars = (ctx: CanvasRenderingContext2D, positions: any[]) => {
      const top = positions[24];
      const left = positions[0];
      const right = positions[16];

      ctx.fillStyle = '#8B4513';
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;

      // Left ear
      ctx.beginPath();
      ctx.moveTo(left.x + 20, top.y - 20);
      ctx.lineTo(left.x - 30, top.y - 60);
      ctx.lineTo(left.x - 20, top.y + 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right ear
      ctx.beginPath();
      ctx.moveTo(right.x - 20, top.y - 20);
      ctx.lineTo(right.x + 30, top.y - 60);
      ctx.lineTo(right.x + 20, top.y + 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    const drawMustache = (ctx: CanvasRenderingContext2D, positions: any[]) => {
      const nose = positions[33];
      const width = 80;
      const height = 30;

      ctx.fillStyle = '#000000';

      // Left side
      ctx.beginPath();
      ctx.ellipse(nose.x - 20, nose.y + 10, width / 2, height / 2, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Right side
      ctx.beginPath();
      ctx.ellipse(nose.x + 20, nose.y + 10, width / 2, height / 2, 0.3, 0, Math.PI * 2);
      ctx.fill();
    };

    loadFaceAPI();

    return () => {
      mounted = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      // Stop camera
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedFilter]);

  const handleCapture = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      console.log('Captured image with filter:', selectedFilter);
      setStatusCaptured(true);
      setStatus(dataUrl);
    }
  };

  const handleSave = async () => {

    console.log("saved !!!");
    // if (!status) {
    //   console.error('No image to confirm. Please capture an image first.');
    //   return;
    // }

    // if (!user?._id) {
    //   console.error('User is not authenticated.');
    //   return;
    // }

    // try {
    //   setIsLoading(true);
      
    //   // Convert data URL to blob
    //   const response = await fetch(status);
    //   const blob = await response.blob();
      
    //   // Create image file with timestamp
    //   const timestamp = Date.now();
    //   const file = new File([blob], `status-${timestamp}.png`, { 
    //     type: 'image/png',
    //     lastModified: timestamp
    //   });

    //   // Create FormData - FIXED: Convert user.id to string
    //   const formData = new FormData();
    //   formData.append('image', file, file.name);
    //   formData.append('userId', String(user?._id));

    //   // Debug logging
    //   console.log('FormData contents:');
    //   console.log('- File:', file.name, file.size, 'bytes', file.type);
    //   console.log('- UserId:', user?._id);
      
    //   // Log what's actually in FormData
    //   for (let pair of formData.entries()) {
    //     console.log('FormData entry:', pair[0], pair[1]);
    //   }

    //   const responseCreateStatus = await createStatusApi(formData);

    //   if (responseCreateStatus?.success) {
    //     console.log('Status created successfully!');
    //     navigate('/home');
    //   } else {
    //     console.error('Failed to create status:', responseCreateStatus?.error);
    //     alert('Failed to create status. Please try again.');
    //   }

    // } catch (error: any) {
    //   console.error('Error processing captured image:', error);
    //   alert('Failed to process image. Please try again.');
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const handleClose = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    navigate('/');
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
              <p className="text-lg">Loading AR filters...</p>
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
          disabled={isLoading || !!cameraError || statusCaptured}
        >
          <Camera className="w-8 h-8" />
        </Button>

        {statusCaptured && ( 
          <Button 
            variant="outline" 
            size="icon" 
            className="w-16 h-16 rounded-full border-4 border-white bg-transparent hover:bg-white/10 hover:scale-110 transition-transform"
            onClick={handleSave}
            disabled={isLoading || !!cameraError}
          >
            <Check className="w-8 h-8" />
          </Button>
        )}
      </div>
      
      {selectedFilter !== 'none' && !isLoading && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
          <p className="text-sm text-white">{filters.find(f => f.id === selectedFilter)?.name}</p>
        </div>
      )}
    </div>
  );
};

export default CreateStatus;