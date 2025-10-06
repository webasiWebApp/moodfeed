import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Mic, MicOff, Video, VideoOff, Sparkles } from 'lucide-react';
import { User } from '@/types/user';

declare global {
  interface Window {
    faceapi: any;
  }
}

interface CallComponentProps {
  participant: User | null;
  callStatus: 'calling' | 'active' | 'ended';
  isMuted: boolean;
  isVideoEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export const CallComponent: React.FC<CallComponentProps> = ({
  participant,
  callStatus,
  isMuted,
  isVideoEnabled,
  localStream,
  remoteStream,
  onToggleMute,
  onToggleVideo,
  onEndCall,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const faceDataRef = useRef<any>(null);
  
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [showFilters, setShowFilters] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

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
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    const videoEl = remoteVideoRef.current;
    if (!videoEl) return;

    if (!remoteStream) {
      // Clear srcObject when no remote stream
      videoEl.srcObject = null;
      return;
    }

    // Diagnostic: log tracks so we can spot missing video tracks
    try {
      console.debug('Remote stream set, videoTracks:', remoteStream.getVideoTracks(), 'audioTracks:', remoteStream.getAudioTracks());
      if ((remoteStream.getVideoTracks() || []).length === 0) {
        console.warn('Remote stream contains no video tracks - remote will be a black screen');
      }
    } catch (err) {
      console.warn('Could not inspect remoteStream tracks:', err);
    }

    videoEl.srcObject = remoteStream;

    // Autoplay policies can block playback unless the element is muted or a user gesture occurred.
    // Attempt to play, and if autoplay is blocked, try muted play as a fallback.
    const tryPlay = async () => {
      try {
        await videoEl.play();
      } catch (err) {
        console.warn('Autoplay for remote video failed, trying muted play fallback:', err);
        try {
          const prevMuted = videoEl.muted;
          videoEl.muted = true; // allow autoplay when muted
          await videoEl.play();
          // leave muted as-is; do not automatically unmute to avoid surprising the user
          videoEl.muted = prevMuted;
        } catch (err2) {
          console.error('Muted autoplay also failed for remote video:', err2);
        }
      }
    };

    const onLoadedMeta = () => {
      tryPlay();
    };

    videoEl.addEventListener('loadedmetadata', onLoadedMeta);
    // Try immediately as well
    tryPlay();

    // After a short delay, if the video element still has no dimensions despite remote stream having video tracks,
    // try creating a new MediaStream from the remote video tracks and reassigning srcObject.
    const fallbackTimer = window.setTimeout(() => {
      try {
        const hasVideoTracks = (remoteStream.getVideoTracks() || []).length > 0;
        if (hasVideoTracks && videoEl.videoWidth === 0 && videoEl.videoHeight === 0) {
          console.warn('Remote video element has zero dimensions despite video tracks present; trying track-only MediaStream fallback.');
          const videoOnly = new MediaStream(remoteStream.getVideoTracks());
          videoEl.srcObject = videoOnly;
          // attempt to play again
          tryPlay();
        }
      } catch (err) {
        console.warn('Fallback check for remote video failed:', err);
      }
    }, 700);

    return () => {
      videoEl.removeEventListener('loadedmetadata', onLoadedMeta);
      window.clearTimeout(fallbackTimer);
    };
  }, [remoteStream]);

  useEffect(() => {
    let mounted = true;
    let animationId: number;

    const loadFaceAPI = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.min.js';
        script.async = true;
        
        script.onload = async () => {
          if (!mounted) return;
          
          const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
          
          await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
          await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
          
          if (mounted) {
            setModelsLoaded(true);
          }
        };
        
        script.onerror = () => {
          console.error('Failed to load face-api.js');
        };
        
        document.body.appendChild(script);
      } catch (err) {
        console.error('Error loading face-api:', err);
      }
    };

    const detectFaces = async () => {
      if (!localVideoRef.current || !localCanvasRef.current || !window.faceapi || !modelsLoaded) return;

      const video = localVideoRef.current;
      const canvas = localCanvasRef.current;

      // Wait for video to be ready
      const checkVideoReady = () => {
        if (video.videoWidth && video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          startDetection();
        } else {
          setTimeout(checkVideoReady, 100);
        }
      };

      const startDetection = () => {
        const detect = async () => {
          if (!mounted || !video || !canvas) return;

          try {
            const detections = await window.faceapi
              .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks();

            if (detections) {
              faceDataRef.current = detections;
            } else {
              faceDataRef.current = null;
            }
          } catch (err) {
            console.error('Face detection error:', err);
          }

          drawFrame();
          animationId = requestAnimationFrame(detect);
        };

        detect();
      };

      checkVideoReady();
    };

    const drawFrame = () => {
      if (!localVideoRef.current || !localCanvasRef.current) return;

      const video = localVideoRef.current;
      const canvas = localCanvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      if (faceDataRef.current && selectedFilter !== 'none') {
        drawARFilter(ctx, faceDataRef.current);
      }
    };

    const drawARFilter = (ctx: CanvasRenderingContext2D, detection: any) => {
      const landmarks = detection.landmarks;
      const positions = landmarks.positions;

      ctx.save();
      ctx.scale(-1, 1);
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
      ctx.lineWidth = 4;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';

      ctx.beginPath();
      ctx.ellipse(leftEye.x, leftEye.y, width / 4, height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(rightEye.x, rightEye.y, width / 4, height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

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
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(centerX - width / 3, crownY);
      ctx.lineTo(centerX + width / 3, crownY);
      ctx.lineTo(centerX + width / 3, crownY + 20);
      ctx.lineTo(centerX - width / 3, crownY + 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      for (let i = 0; i < 3; i++) {
        const x = centerX - width / 4 + (i * width / 4);
        ctx.beginPath();
        ctx.moveTo(x - 10, crownY);
        ctx.lineTo(x, crownY - 20);
        ctx.lineTo(x + 10, crownY);
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

      ctx.fillRect(centerX - width / 2.5, hatY + 30, width / 1.25, 8);
      ctx.fillRect(centerX - width / 4, hatY - 30, width / 2, 60);
      ctx.strokeRect(centerX - width / 4, hatY - 30, width / 2, 60);
    };

    const drawDogEars = (ctx: CanvasRenderingContext2D, positions: any[]) => {
      const top = positions[24];
      const left = positions[0];
      const right = positions[16];

      ctx.fillStyle = '#8B4513';
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(left.x + 15, top.y - 15);
      ctx.lineTo(left.x - 20, top.y - 40);
      ctx.lineTo(left.x - 15, top.y + 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(right.x - 15, top.y - 15);
      ctx.lineTo(right.x + 20, top.y - 40);
      ctx.lineTo(right.x + 15, top.y + 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    const drawMustache = (ctx: CanvasRenderingContext2D, positions: any[]) => {
      const nose = positions[33];
      const width = 60;
      const height = 20;

      ctx.fillStyle = '#000000';

      ctx.beginPath();
      ctx.ellipse(nose.x - 15, nose.y + 8, width / 2, height / 2, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(nose.x + 15, nose.y + 8, width / 2, height / 2, 0.3, 0, Math.PI * 2);
      ctx.fill();
    };

    loadFaceAPI();

    if (modelsLoaded && localStream) {
      detectFaces();
    }

    return () => {
      mounted = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [selectedFilter, modelsLoaded, localStream]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Local Video with AR Filter */}
        <div className="absolute top-4 right-4 w-32 h-40 sm:w-48 sm:h-32 bg-gray-800 border-2 border-gray-600 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={selectedFilter === 'none' ? 'w-full h-full object-cover scale-x-[-1]' : 'hidden'}
          />
          <canvas
            ref={localCanvasRef}
            className={selectedFilter !== 'none' ? 'w-full h-full object-cover' : 'hidden'}
          />
        </div>

        {/* Call Controls */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-4">
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="icon"
            className="rounded-full w-14 h-14 sm:w-16 sm:h-16"
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-16 h-16 sm:w-20 sm:h-20"
            onClick={onEndCall}
          >
            <Phone className="w-6 h-6" />
          </Button>
          <Button
            variant={!isVideoEnabled ? 'destructive' : 'secondary'}
            size="icon"
            className="rounded-full w-14 h-14 sm:w-16 sm:h-16"
            onClick={onToggleVideo}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
          <Button
            variant={showFilters ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-full w-14 h-14 sm:w-16 sm:h-16"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Sparkles className="w-5 h-5" />
          </Button>
        </div>

        {/* Filter Selection Menu */}
        {showFilters && (
          <div className="absolute bottom-36 left-0 right-0 mx-auto w-full max-w-md bg-black/90 backdrop-blur-sm rounded-t-2xl p-4 shadow-2xl">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {filters.map(filter => (
                <Button
                  key={filter.id}
                  variant={selectedFilter === filter.id ? 'secondary' : 'ghost'}
                  onClick={() => {
                    setSelectedFilter(filter.id);
                    setShowFilters(false);
                  }}
                  className="text-xs whitespace-nowrap px-4 py-2 flex-shrink-0"
                  size="sm"
                >
                  {filter.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Call Status */}
        <div className="absolute top-4 left-4 text-white">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
            <h2 className="text-lg font-bold">{participant?.username || 'Unknown'}</h2>
            <p className="text-sm text-gray-300">{callStatus === 'calling' ? 'Calling...' : 'In call'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};