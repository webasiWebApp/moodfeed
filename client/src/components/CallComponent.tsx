import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { User } from '@/types/user';

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

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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

        {/* Local Video */}
        <div className="absolute top-4 right-4 w-48 h-32 bg-gray-800 border-2 border-gray-600 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="icon"
            className="rounded-full w-16 h-16"
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-20 h-20"
            onClick={onEndCall}
          >
            <Phone />
          </Button>
          <Button
            variant={!isVideoEnabled ? 'destructive' : 'secondary'}
            size="icon"
            className="rounded-full w-16 h-16"
            onClick={onToggleVideo}
          >
            {isVideoEnabled ? <Video /> : <VideoOff />}
          </Button>
        </div>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-center">
            <h2 className="text-2xl font-bold">{participant?.username}</h2>
            <p>{callStatus === 'calling' ? 'Calling...' : 'In call'}</p>
        </div>
      </div>
    </div>
  );
};
