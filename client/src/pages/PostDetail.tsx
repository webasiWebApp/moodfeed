import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share, Send } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPostComments, addComment, Comment } from '@/api/posts';
import { useToast } from '@/hooks/useToast';
import { formatDistanceToNow } from 'date-fns';

export const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const loadComments = async () => {
    if (!postId) return;
    
    try {
      console.log('Loading comments for post:', postId);
      const response = await getPostComments(postId) as any;
      setComments(response.comments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !postId) return;
    
    setSubmitting(true);
    try {
      const response = await addComment(postId, newComment.trim()) as any;
      setComments(prev => [...prev, response.comment]);
      setNewComment('');
      toast({
        title: "Success",
        description: "Comment added successfully"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">Comments</h1>
            <div className="w-10" />
          </div>

          {/* Mock Post Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-effect p-4 rounded-2xl mb-6"
          >
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="w-10 h-10 border-2 border-primary">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-white">John Doe</h3>
                <p className="text-sm text-muted-foreground">@johndoe</p>
              </div>
            </div>
            <p className="text-white mb-3">Beautiful sunset today! Nature never fails to amaze me.</p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="text-white">124</span>
              </div>
              <div className="flex items-center space-x-2">
                <Share className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Comments */}
          <div className="space-y-4 mb-6">
            {comments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="text-4xl mb-2">💬</div>
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              </motion.div>
            ) : (
              comments.map((comment, index) => (
                <motion.div
                  key={comment._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-effect p-4 rounded-2xl"
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-10 h-10 border-2 border-primary">
                      <AvatarImage src={comment.author.avatar} alt={comment.author.displayName} />
                      <AvatarFallback>{comment.author.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-white">{comment.author.displayName}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-white">{comment.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect p-4 rounded-2xl"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10 border-2 border-primary">
                <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face" />
                <AvatarFallback>CU</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex space-x-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="bg-transparent border-white/20 text-white placeholder:text-muted-foreground"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  size="icon"
                  className="bg-primary hover:bg-primary/90 text-black"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};