
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Phone } from 'lucide-react';
import { getConversationMessages } from '../api/chat';
import { Message } from '@/types/chat';
import { useAuth } from '../contexts/AuthContext';
import {io, Socket} from 'socket.io-client';
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


export function Chat() {
  const { chatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'ended' | 'calling' | 'active'>('ended');
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState<User | null>(null);
  const [callerSignal, setCallerSignal] = useState<any>(null);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chatId) {
      getConversationMessages(chatId).then(setMessages);

      const accessToken = localStorage.getItem('accessToken');
      socketRef.current = io({
        transports: ['polling', 'websocket'],
        auth: {
          token: accessToken,
        },
      });

      socketRef.current.emit('joinRoom', chatId);

      socketRef.current.on('receiveMessage', (message: Message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      socketRef.current.on('call-user', (data) => {
        setReceivingCall(true);
        setCaller(data.from);
        setCallerSignal(data.signal);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [chatId]);

  const startCall = async () => {
    if (!socketRef.current) {
      console.error("Socket not initialized");
      return;
    }
    const participant = messages.find(m => m.sender._id !== user?._id)?.sender;
    if (!participant) return;

    setCallStatus('calling');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);

    const newPeer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    newPeer.on('signal', (signal) => {
      socketRef.current?.emit('call-user', {
        userToCall: participant._id,
        signalData: signal,
        from: user,
      });
    });

    newPeer.on('stream', (stream) => {
      setRemoteStream(stream);
    });

    socketRef.current?.on('call-accepted', (signal) => {
      setCallStatus('active');
      newPeer.signal(signal);
    });

    setPeer(newPeer);
  };

  const answerCall = () => {
    setCallStatus('active');
    setReceivingCall(false);
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        setLocalStream(stream);
        const newPeer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream,
        });

        newPeer.on('signal', (signal) => {
            socketRef.current?.emit('answer-call', { signal: signal, to: caller?._id });
        });

        newPeer.on('stream', (stream) => {
            setRemoteStream(stream);
        });

        newPeer.signal(callerSignal);
        setPeer(newPeer);
    })
  };

  const endCall = () => {
    setCallStatus('ended');
    peer?.destroy();
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setPeer(null);
    setReceivingCall(false);
    setCaller(null);
    setCallerSignal(null);
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && chatId && user && socketRef.current) {
      const messageData = {
        content: newMessage,
        sender: user._id,
        conversation: chatId,
      };
      
      socketRef.current.emit('sendMessage', {
        roomId: chatId,
        message: messageData,
      });

      // Optimistically update the UI
      const optimisticMessage: Message = {
        _id: Date.now().toString(),
        content: newMessage,
        sender: {
          _id: user._id,
          username: user.username,
          profile: user.profile,
        },
        conversation: chatId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
      setNewMessage('');
    }
  };

  const participant = messages.find(m => m.sender._id !== user?._id)?.sender;

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {callStatus === 'active' || callStatus === 'calling' ? (
        <CallComponent
          participant={participant ?? null}
          callStatus={callStatus}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          localStream={localStream}
          remoteStream={remoteStream}
          onToggleMute={() => setIsMuted(p => !p)}
          onToggleVideo={() => setIsVideoEnabled(p => !p)}
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
                    onClick={() => navigate('/messages')}
                    className="text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-bold text-white">Chat with {participant?.username}</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={startCall}
                    className="text-white"
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
             {receivingCall && ! (callStatus === 'active') ? (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                        <h2 className="text-2xl font-bold mb-4">Incoming Call</h2>
                        <p className="mb-6">{caller?.username} is calling you.</p>
                        <div className="flex justify-center gap-4">
                            <Button onClick={answerCall} className="bg-green-500 hover:bg-green-600 text-white">Answer</Button>
                            <Button onClick={() => setReceivingCall(false)} variant="destructive">Decline</Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
      )}
    </div>
  );
}
