import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, ArrowLeft, Send } from 'lucide-react';
import { Post, Comment, getPostById, getPostComments, toggleLikePost, addComment } from '@/api/posts';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/useToast';
import { formatDistanceToNow } from 'date-fns';

export const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPostData = async () => {
      if (!postId) {
        setLoading(false);
        return;
      }
      // Reset states when postId changes
      setLoading(true);
      setPost(null);
      setComments([]);

      try {
        const [postData, commentsData] = await Promise.all([
          getPostById(postId),
          getPostComments(postId),
        ]);
        setPost(postData.post || postData);
        setComments(Array.isArray(commentsData.comments) ? commentsData.comments : []);
      } catch (error) {
        console.error('Failed to load post details:', error);
        toast({ title: 'Error', description: 'Failed to load post details.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [postId, toast]);

  const handleLikeToggle = async () => {
    if (!post) return;
    try {
      const response = await toggleLikePost(post._id);
      setPost(prevPost => prevPost ? { 
        ...prevPost, 
        isLiked: response.isLiked, 
        likes: response.likesCount 
      } : null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update like status', variant: 'destructive' });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await addComment(post._id, newComment);
      setComments(prevComments => [response.comment, ...prevComments]);
      setNewComment('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    if (!post) return;
    const postUrl = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(postUrl);
    toast({ title: 'Copied to Clipboard', description: 'Post URL has been copied.' });
  };

  if (loading) {
    return <div className="min-h-screen gradient-bg flex items-center justify-center"><p className='text-white'>Loading...</p></div>;
  }

  if (!post) {
    return <div className="min-h-screen gradient-bg flex items-center justify-center"><p className='text-white'>Post not found.</p></div>;
  }

  return (
    <div className="min-h-screen gradient-bg text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Post</h1>
          <div className="w-10" />
        </motion.div>

        {/* Post Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect p-6 rounded-xl"
        >
          {/* Post Author */}
          <div className="flex items-center space-x-3 mb-4">
            <Avatar>
              <AvatarImage src={post.author?.avatar} />
              <AvatarFallback>{post.author?.username?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.author?.displayName || post.author?.username || 'Unknown User'}</p>
              <p className="text-sm text-white/70">
                @{post.author?.username || 'unknown'} • {formatDistanceToNow(new Date(post.createdAt))} ago
              </p>
            </div>
            <span className="text-2xl ml-auto">{post.author?.mood || '😊'}</span>
          </div>

          {/* Post Content */}
          <p className="mb-4 whitespace-pre-wrap">{post.content || ''}</p>

          {/* Post Media */}
          {post.mediaUrl && (
            <div className="mb-4 rounded-xl overflow-hidden">
              {post.mediaType === 'image' ? (
                <img src={post.mediaUrl} alt="Post media" className="w-full h-auto object-cover" />
              ) : (
                <video src={post.mediaUrl} controls className="w-full h-auto" />
              )}
            </div>
          )}

          {/* Post Actions */}
          <div className="flex justify-around items-center border-y border-white/20 py-2">
            <Button variant="ghost" className="flex items-center space-x-2" onClick={handleLikeToggle}>
              <Heart className={`w-5 h-5 ${post.isLiked ? 'text-red-500 fill-current' : ''}`} />
              <span>{typeof post.likes === 'number' ? post.likes : 0}</span>
            </Button>
            <Button variant="ghost" className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>{comments.length}</span>
            </Button>
            <Button variant="ghost" className="flex items-center space-x-2" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </Button>
          </div>
        </motion.div>

        {/* Comment Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
          className="glass-effect p-4 rounded-xl mt-6"
        >
          <form onSubmit={handleAddComment} className="flex items-start space-x-3">
            <Avatar className="w-10 h-10 mt-1">
              <AvatarImage src={user?.profile?.avatarUrl} />
              <AvatarFallback>{user?.username?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="bg-transparent border-white/20 placeholder:text-white/50 resize-none"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <Button type="submit" size="sm" disabled={isSubmitting || !newComment.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Replying...' : 'Reply'}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Comments List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
          className="mt-6 space-y-4"
        >
          <h2 className="text-lg font-semibold mb-2">Comments</h2>
          {Array.isArray(comments) && comments.map(comment => (
            <motion.div 
              key={comment._id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start space-x-3 glass-effect p-4 rounded-xl"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={comment.author?.avatar} />
                <AvatarFallback>{comment.author?.username?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-baseline space-x-2">
                  <p className="font-semibold">{comment.author?.displayName || comment.author?.username || 'Unknown User'}</p>
                  <p className="text-xs text-white/70">@{comment.author?.username || 'unknown'}</p>
                  <p className="text-xs text-white/70">• {formatDistanceToNow(new Date(comment.createdAt))} ago</p>
                </div>
                <p className="mt-1">{comment.content || ''}</p>
              </div>
            </motion.div>
          ))}
          {(!Array.isArray(comments) || comments.length === 0) && (
            <div className="text-center py-8 text-white/70">
              <p>No comments yet.</p>
              <p>Be the first to share your thoughts!</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};