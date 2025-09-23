import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      onClose();
    }
  }, [onClose]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
  }, [stream]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      const byteString = atob(capturedImage.split(',')[1]);
      const mimeString = capturedImage.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], `photo-${Date.now()}.png`, { type: mimeString });
      onCapture(file);
      onClose();
    }
  }, [capturedImage, onCapture, onClose]);

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      {capturedImage ? (
        <>
          <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
          <div className="absolute bottom-10 flex gap-4  mb-40">
            <Button onClick={retakePhoto} variant="outline">
              <RefreshCw className="w-5 h-5 mr-2" />
              Retake
            </Button>
            <Button onClick={confirmPhoto} className="bg-primary">
              <Check className="w-5 h-5 mr-2" />
              Confirm
            </Button>
          </div>
        </>
      ) : (
        <>
          <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
          <Button onClick={takePhoto} className="absolute bottom-10 mb-40">
            Take Photo
          </Button>
          <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-4 right-4 text-white">
            &times;
          </Button>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
