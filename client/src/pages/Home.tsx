import React, { useState, useEffect, useCallback } from 'react';
import { PostCard } from '@/components/feed/PostCard';
import { SuggestedCommentsDrawer } from '@/components/feed/SuggestedCommentsDrawer';
import { ActionSheet } from '@/components/feed/ActionSheet';
import { CelebrationAnimation } from '@/components/feed/CelebrationAnimation';
import { getFeedPosts, addComment, markNotForMe, Post } from '@/api/posts';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { startConversation } from '@/api/chat';
import { useAuth } from '@/contexts/AuthContext';

export const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'like' | 'comment' | 'share' | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const loadPosts = useCallback(async (pageNum: number = 1) => {
    try {
      console.log('Loading posts for page:', pageNum);
      const response = await getFeedPosts(pageNum, 10) as any;

      if (pageNum === 1) {
        setPosts(response.posts);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }

      setHasMore(response.hasMore);
      setLoading(false);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive"
      });
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 200 || loading || !hasMore) {
        return;
      }
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, page, loadPosts]);

  const handleSwipeLeft = async (postId: string) => {
    console.log('Swiped left on post (not for me):', postId);
    
    try {
      await markNotForMe(postId);
      toast({
        title: "Not Interested",
        description: "We'll show you less content like this"
      });
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (error) {
      console.error('Error marking post as not for me:', error);
    }
  };

  const handleSwipeRight = (postId: string) => {
    console.log('Swiped right on post (quick comment):', postId);
    setSelectedPostId(postId);
    setShowCommentsDrawer(true);
  };

  const handleLongPress = (postId: string) => {
    console.log('Long pressed on post:', postId);
    setSelectedPostId(postId);
    setShowActionSheet(true);
  };

  const handleComment = (postId: string) => {
    console.log('Comment clicked for post:', postId);
    navigate(`/post/${postId}`);
  };

  const handleShare = (postId: string) => {
    console.log('Share clicked for post:', postId);
    setCelebrationType('share');

    if (navigator.share) {
      navigator.share({
        title: 'Check out this post',
        url: `${window.location.origin}/post/${postId}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
      toast({
        title: "Link Copied",
        description: "Post link copied to clipboard"
      });
    }
  };

  const handleSelectComment = async (comment: string) => {
    if (!selectedPostId) return;

    try {
      await addComment(selectedPostId, comment);
      setCelebrationType('comment');
      setShowCommentsDrawer(false);

      setPosts(prev => prev.map(post =>
        post._id === selectedPostId
          ? { ...post, comments: post.comments + 1 }
          : post
      ));

      toast({
        title: "Comment Added",
        description: "Your comment has been posted"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const handleStartChat = async () => {
    if (!selectedPostId) return;

    const post = posts.find(p => p._id === selectedPostId);
    if (!post || !user) return;

    const author = post.author;

    if (author._id === user?._id) {
      toast({
        title: "Can't message yourself",
        description: "You cannot start a conversation with yourself.",
      });
      setShowActionSheet(false);
      return;
    }

    try {
       console.log(user, author);
      const conversation = await startConversation(author);
      setShowActionSheet(false);
      navigate(`/chat/${conversation._id}`, { state: { isNewConversation: true } });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive"
      });
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2">
        <img 
          src="/src/assets/moodfeedLogo.png" 
          alt="MoodFeed Logo" 
          className="h-12 w-auto object-contain drop-shadow-lg"
        />
      </div>

      <div className="pt-40 pb-2">
        <div className="flex flex-col items-center gap-4">
          {posts.map((post) => (
            <div key={post._id} className="w-full max-w-md">
              <PostCard
                post={post}
                isActive={true}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onLongPress={handleLongPress}
                onComment={handleComment}
                onShare={handleShare}
              />
            </div>
          ))}
        </div>
        {loading && (
          <div className="text-center p-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <div className="text-center p-4 text-white">
            <p>You've reached the end of the feed.</p>
          </div>
        )}
        {!loading && posts.length === 0 && (
          <div className="text-center pt-20">
            <h2 className="text-2xl font-bold text-white mb-2">No posts to show</h2>
            <p className="text-muted-foreground">Check back later for new content!</p>
          </div>
        )}
      </div>

      <SuggestedCommentsDrawer
        isOpen={showCommentsDrawer}
        onClose={() => setShowCommentsDrawer(false)}
        onSelectComment={handleSelectComment}
        onCustomComment={handleSelectComment}
      />

      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onMessage={handleStartChat}
      />

      <CelebrationAnimation
        type={celebrationType}
        onComplete={() => setCelebrationType(null)}
      />
    </div>
  );
};
