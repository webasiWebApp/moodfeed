import React from 'react';
import { Button } from './ui/button';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


interface CallComponentProps {
    callStatus: 'calling' | 'active' | 'ended';
    isMuted: boolean;
    isVideoEnabled: boolean;
    onEndCall: () => void;
    onToggleMute: () => void;
    onToggleVideo: () => void;
    participant: {
        username: string;
        profile: {
            avatarUrl: string;
        }
    }
}

const CallComponent: React.FC<CallComponentProps> = ({
    callStatus,
    isMuted,
    isVideoEnabled,
    onEndCall,
    onToggleMute,
    onToggleVideo,
    participant
}) => {

    if (callStatus === 'ended') {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-black/80 text-white p-8 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Call Ended</h2>
                <Button onClick={onEndCall}>Close</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-between h-full bg-black/80 text-white p-8 rounded-lg">
            <div className="flex flex-col items-center">
                <Avatar className="w-24 h-24 border-4 border-primary mb-4">
                    <AvatarImage src={participant?.profile?.avatarUrl} />
                    <AvatarFallback>{participant?.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{participant?.username}</h2>
                <p className="text-lg text-white/70">{callStatus === 'calling' ? 'Calling...' : 'In Call'}</p>
            </div>

            <div className="flex items-center space-x-4">
                <Button onClick={onToggleMute} variant="outline" className="bg-white/10 border-none rounded-full w-16 h-16">
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </Button>
                <Button onClick={onToggleVideo} variant="outline" className="bg-white/10 border-none rounded-full w-16 h-16">
                    {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                </Button>
                <Button onClick={onEndCall} variant="destructive" className="rounded-full w-16 h-16">
                    <PhoneOff size={24} />
                </Button>
            </div>
        </div>
    )
}

export default CallComponent;