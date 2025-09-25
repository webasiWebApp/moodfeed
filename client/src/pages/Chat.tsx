import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Phone, MicOff, Mic, VideoOff, Video } from 'lucide-react';
import { getConversationMessages } from '../api/chat';
import { Message } from '@/types/chat';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CallComponent } from '@/components/CallComponent';
import { User } from '@/types/user';

const timeAgo = (date: string | undefined): string => {
  if (!date) return '';
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";
  return Math.floor(seconds) + "s";
};

const stunServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

// Try multiple server URLs as fallback
const serverUrls = [
  process.env.REACT_APP_SERVER_URL,
  'https://moodfeed-server.vercel.app',
  'http://localhost:3001', // Local development fallback
].filter(Boolean);

export function Chat() {
  const { chatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'ended' | 'calling' | 'active'>('ended');
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState<User | null>(null);
  const [callerSignal, setCallerSignal] = useState<any>(null);
  const [callParticipant, setCallParticipant] = useState<User | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  const cleanupCallRef = useRef<() => void>();
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const cleanupCall = useCallback(() => {
    // Clear any pending timeouts
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    // Stop all media tracks
    localStream?.getTracks().forEach((track) => {
      track.stop();
    });
    remoteStream?.getTracks().forEach((track) => {
      track.stop();
    });

    // Clean up peer connection
    if (peer) {
      try {
        peer.destroy();
      } catch (error) {
        console.warn('Error destroying peer:', error);
      }
    }

    // Reset all states
    setLocalStream(null);
    setRemoteStream(null);
    setPeer(null);
    setCallStatus('ended');
    setReceivingCall(false);
    setCaller(null);
    setCallerSignal(null);
    setCallParticipant(null);
    
    // Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, [localStream, remoteStream, peer]);

  useEffect(() => {
    cleanupCallRef.current = cleanupCall;
  }, [cleanupCall]);

  useEffect(() => {
    const audio = new Audio('/src/assets/notification-bell.mp3');
    audio.loop = true;
    ringtoneRef.current = audio;

    if (chatId) {
      // Load messages first (this should work independently of socket)
      getConversationMessages(chatId)
        .then(setMessages)
        .catch(error => {
          console.error('Failed to load messages:', error);
          setConnectionError('Failed to load chat messages');
        });

      // Try to connect to socket with fallback URLs
      let currentUrlIndex = 0;
      const tryConnection = () => {
        if (currentUrlIndex >= serverUrls.length) {
          setConnectionStatus('error');
          setConnectionError('Unable to connect to any server');
          return;
        }

        const serverUrl = serverUrls[currentUrlIndex];
        console.log(`Attempting to connect to: ${serverUrl}`);
        setConnectionStatus('connecting');
        setConnectionError(null);

        const accessToken = localStorage.getItem('accessToken');
        const socket = io(serverUrl, { 
          transports: ['polling', 'websocket'], // Try polling first
          auth: { token: accessToken },
          timeout: 10000,
          forceNew: true,
          reconnection: false, // Handle reconnection manually
        });
        
        socketRef.current = socket;

        // Connection success
        socket.on('connect', () => {
          console.log(`Connected to server: ${serverUrl}`);
          setConnectionStatus('connected');
          setConnectionError(null);
          socket.emit('joinRoom', chatId);
        });

        // Connection failed - try next URL
        socket.on('connect_error', (error) => {
          console.error(`Connection error to ${serverUrl}:`, error);
          socket.disconnect();
          currentUrlIndex++;
          setTimeout(tryConnection, 1000); // Try next server after 1 second
        });

        socket.on('disconnect', (reason) => {
          console.log('Disconnected:', reason);
          setConnectionStatus('disconnected');
          if (reason === 'io server disconnect') {
            // Server disconnected us, try to reconnect
            setTimeout(tryConnection, 2000);
          }
        });

        // Set a timeout to try next server if connection takes too long
        setTimeout(() => {
          if (socket.connected === false && currentUrlIndex < serverUrls.length - 1) {
            console.log(`Connection timeout for ${serverUrl}, trying next server`);
            socket.disconnect();
            currentUrlIndex++;
            tryConnection();
          }
        }, 10000);
      };

      tryConnection();

      const handleReceiveMessage = (message: Message) => {
        setMessages((prev) => [...prev, message]);
      };

      const handleCallUser = (data: { from: User; signal: any }) => {
        // Prevent multiple incoming calls
        if (callStatus !== 'ended') {
          return;
        }

        setReceivingCall(true);
        setCaller(data.from);
        setCallerSignal(data.signal);
        setCallParticipant(data.from);
        
        // Auto-decline after 30 seconds
        callTimeoutRef.current = setTimeout(() => {
          if (receivingCall) {
            declineCall();
          }
        }, 30000);

        ringtoneRef.current?.play().catch(console.warn);
      };

      const handleCallAccepted = (signal: any) => {
        if (peer && callStatus === 'calling') {
          try {
            setCallStatus('active');
            peer.signal(signal);
          } catch (error) {
            console.error('Error signaling peer on call accepted:', error);
            cleanupCallRef.current?.();
          }
        }
      };

      const handleCallEnded = () => {
        cleanupCallRef.current?.();
      };

      const handleCallDeclined = () => {
        cleanupCallRef.current?.();
      };

      // Only set up socket event listeners after we have a socket
      const setupSocketListeners = () => {
        const socket = socketRef.current;
        if (!socket) return;

        socket.on('receiveMessage', handleReceiveMessage);
        socket.on('call-user', handleCallUser);
        socket.on('call-accepted', handleCallAccepted);
        socket.on('call-ended', handleCallEnded);
        socket.on('call-declined', handleCallDeclined);
      };

      // Set up listeners when connected
      if (socketRef.current) {
        setupSocketListeners();
      }

      return () => {
        if (socketRef.current) {
          socketRef.current.off('receiveMessage', handleReceiveMessage);
          socketRef.current.off('call-user', handleCallUser);
          socketRef.current.off('call-accepted', handleCallAccepted);
          socketRef.current.off('call-ended', handleCallEnded);
          socketRef.current.off('call-declined', handleCallDeclined);
          socketRef.current.off('connect');
          socketRef.current.off('connect_error');
          socketRef.current.off('disconnect');
          socketRef.current.disconnect();
        }
        cleanupCallRef.current?.();
      };
    }
  }, [chatId, callStatus, receivingCall]); // Added missing dependencies

  // Move declineCall definition before it's used in useEffect
  const declineCall = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    
    socketRef.current?.emit('decline-call', { to: caller?._id });
    cleanupCall();
  }, [caller, cleanupCall]);

  const startCall = useCallback(async () => {
    if (!socketRef.current || callStatus !== 'ended') return;
    
    const participant = messages.find((m) => m.sender._id !== user?._id)?.sender;
    if (!participant) return;

    setCallParticipant(participant);
    setCallStatus('calling');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);

      const newPeer = new Peer({
        initiator: true,
        trickle: true,
        config: stunServers,
        stream: stream,
      });

      let signalSent = false;

      newPeer.on('signal', (signal) => {
        if (!signalSent) {
          signalSent = true;
          socketRef.current?.emit('call-user', {
            userToCall: participant._id,
            signalData: signal,
            from: user,
          });
        }
      });

      newPeer.on('stream', (stream) => {
        setRemoteStream(stream);
      });

      newPeer.on('close', () => {
        cleanupCall();
      });

      newPeer.on('error', (err) => {
        console.error('Peer error during call initiation:', err);
        cleanupCall();
      });

      newPeer.on('connect', () => {
        console.log('Peer connected successfully');
      });

      setPeer(newPeer);

      // Auto cleanup after 1 minute if no answer
      callTimeoutRef.current = setTimeout(() => {
        if (callStatus === 'calling') {
          cleanupCall();
        }
      }, 60000);

    } catch (err) {
      console.error('Failed to start call:', err);
      cleanupCall();
    }
  }, [messages, user, cleanupCall, callStatus]);

  const answerCall = useCallback(async () => {
    if (!caller || !callerSignal || !socketRef.current || callStatus !== 'ended') return;

    // Clear timeout and stop ringtone
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    ringtoneRef.current?.pause();
    
    setCallStatus('active');
    setReceivingCall(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);

      const newPeer = new Peer({
        initiator: false,
        trickle: true,
        config: stunServers,
        stream: stream,
      });

      let signalSent = false;

      newPeer.on('signal', (signal) => {
        if (!signalSent) {
          signalSent = true;
          socketRef.current?.emit('answer-call', { 
            signal: signal, 
            to: caller._id 
          });
        }
      });

      newPeer.on('stream', (stream) => {
        setRemoteStream(stream);
      });

      newPeer.on('close', () => {
        cleanupCall();
      });

      newPeer.on('error', (err) => {
        console.error('Peer error during call answer:', err);
        cleanupCall();
      });

      newPeer.on('connect', () => {
        console.log('Peer connected successfully');
      });

      // Wait a bit before signaling to ensure peer is ready
      setTimeout(() => {
        try {
          if (newPeer && !newPeer.destroyed) {
            newPeer.signal(callerSignal);
          }
        } catch (error) {
          console.error('Error signaling caller signal:', error);
          cleanupCall();
        }
      }, 100);

      setPeer(newPeer);

    } catch (err) {
      console.error('Failed to answer call:', err);
      cleanupCall();
    }
  }, [caller, callerSignal, cleanupCall, callStatus]);

  const endCall = useCallback(() => {
    socketRef.current?.emit('end-call', { to: callParticipant?._id });
    cleanupCall();
  }, [callParticipant, cleanupCall]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newMessage.trim() && chatId && user) {
        const optimisticMessage: Message = {
          _id: Date.now().toString(),
          content: newMessage,
          sender: { _id: user._id, username: user.username, profile: user.profile },
          conversation: chatId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Always show the message locally first
        setMessages((prev) => [...prev, optimisticMessage]);
        setNewMessage('');

        // Try to send via socket if connected
        if (socketRef.current?.connected) {
          const messageData = { content: optimisticMessage.content, sender: user._id, conversation: chatId };
          socketRef.current.emit('sendMessage', { roomId: chatId, message: messageData });
        } else {
          console.warn('Socket not connected, message sent locally only');
          // Here you could implement a fallback API call to send the message
        }
      }
    },
    [chatId, user, newMessage]
  );

  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  const participant = messages.find((m) => m.sender._id !== user?._id)?.sender;

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {callStatus === 'active' || callStatus === 'calling' ? (
        <CallComponent
          participant={callParticipant}
          callStatus={callStatus}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          localStream={localStream}
          remoteStream={remoteStream}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onEndCall={endCall}
        />
      ) : (
        <>
          <div className="container mx-auto px-4 py-6 flex-1 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-4"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/inbox')}
                className="text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-white">
                Chat with {participant?.username}
                {connectionStatus === 'connecting' && (
                  <span className="ml-2 text-sm text-yellow-300">Connecting...</span>
                )}
                {connectionStatus === 'disconnected' && (
                  <span className="ml-2 text-sm text-red-300">Offline</span>
                )}
                {connectionStatus === 'error' && (
                  <span className="ml-2 text-sm text-red-400">Connection Failed</span>
                )}
                {connectionStatus === 'connected' && (
                  <span className="ml-2 text-sm text-green-300">Online</span>
                )}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={startCall}
                className="text-white"
                disabled={!participant || callStatus !== 'ended'}
              >
                <Phone className="w-5 h-5" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col glass-effect p-4 rounded-xl overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {connectionError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                    <p className="text-red-200 text-sm">{connectionError}</p>
                  </div>
                )}
                {messages.map((message) => (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end gap-2 ${message.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender._id !== user?._id && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.sender.profile?.avatarUrl} />
                        <AvatarFallback>{message.sender.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                        message.sender._id === user?._id
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-white/10 text-white rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs text-right opacity-50">{timeAgo(message.createdAt)}</p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="mt-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-transparent border-white/20 text-white placeholder:text-white/50 rounded-full px-4 py-2"
                    placeholder="Type a message..."
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="p-2 bg-primary rounded-full text-white"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
          {receivingCall && callStatus === 'ended' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold mb-4">Incoming Call</h2>
                <p className="mb-6">{caller?.username} is calling you.</p>
                <div className="flex justify-center gap-4">
                  <Button onClick={answerCall} className="bg-green-500 hover:bg-green-600 text-white">Answer</Button>
                  <Button onClick={declineCall} variant="destructive">Decline</Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}