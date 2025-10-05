import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Post } from '@/api/posts';
import { useToast } from '@/hooks/useToast';
import { toggleLikePost } from '@/api/posts';
import { formatDistanceToNow } from 'date-fns';
import { VideoPlayer } from './VideoPlayer';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  onSwipeLeft: (postId: string) => void;
  onSwipeRight: (postId: string) => void;
  onLongPress: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onSwipeVertical?: (direction: 'up' | 'down') => void;
  isActive?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  onComment,
  onShare,
  onSwipeVertical,
  isActive
}) => {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const controls = useAnimation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isActive) {
      controls.start({ y: 0, transition: { duration: 0 } });
    }
  }, [isActive, controls]);

  const handleProfileClick = () => {
    navigate(`/profile/${post.author._id}`);
  };

  const handleLike = async () => {
    try {
      const response = await toggleLikePost(post._id) as any;
      setIsLiked(response.isLiked);
      setLikesCount(response.likesCount);
      controls.start({ scale: [1, 1.2, 1], transition: { duration: 0.3 } });
    } catch (error) {
      toast({ title: "Error", description: "Failed to like post", variant: "destructive" });
    }
  };

  const handlePanEnd = (_event: any, info: PanInfo) => {
    const threshold = 100;
    const isHorizontal = Math.abs(info.offset.x) > Math.abs(info.offset.y);
    
    if (isHorizontal && Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0) onSwipeRight(post._id);
      else onSwipeLeft(post._id);
    } else if (!isHorizontal && Math.abs(info.offset.y) > threshold) {
      if (info.offset.y > 0) onSwipeVertical?.('down');
      else onSwipeVertical?.('up');
    }
    
    controls.start({ x: 0, y: 0, transition: { duration: 0.2 } });
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => onLongPress(post._id), 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <motion.div
      ref={cardRef}
      className="w-full flex flex-col justify-center items-center px-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      animate={controls}
      drag={true}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onPanEnd={handlePanEnd}
      dragElastic={0.2}
    >
      <div className="w-full max-w-md glass-effect rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleProfileClick}>
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-primary">
                <AvatarImage src={post.author.avatar} alt={post.author.displayName || post.author.username} />
                <AvatarFallback>{(post.author.displayName || post.author.username)?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 text-lg">{post.author.mood}</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">{post.author.displayName || post.author.username}</h3>
              <p className="text-sm text-muted-foreground">@{post.author.username}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white"><MoreHorizontal className="w-5 h-5" /></Button>
        </div>

        <div className="px-4 pb-3">
          <p className="text-white leading-relaxed">{post.content}</p>
        </div>

        {post.mediaUrl && (
          <div className="relative">
            {post.mediaType === 'video' ? <VideoPlayer src={post.mediaUrl} /> : <img src={post.mediaUrl} alt="Post content" className="w-full h-80 object-cover" />}
          </div>
        )}

        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-6">
            <motion.button onClick={handleLike} className="flex items-center space-x-2" whileTap={{ scale: 0.9 }}>
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              <span className="text-white font-medium">{likesCount}</span>
            </motion.button>
            <motion.button onClick={() => onComment(post._id)} className="flex items-center space-x-2" whileTap={{ scale: 0.9 }}>
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="text-white font-medium">{post.comments}</span>
            </motion.button>
            <motion.button onClick={() => onShare(post._id)} whileTap={{ scale: 0.9 }}><Share className="w-6 h-6 text-white" /></motion.button>
          </div>
          <span className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      {/* <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex space-x-4 text-white/50">
        <div className="flex items-center space-x-1"><span>←</span><span className="text-xs">Not for me</span></div>
        <div className="flex items-center space-x-1"><span className="text-xs">Quick comment</span><span>→</span></div>
      </div> */}
    </motion.div>
  );
};