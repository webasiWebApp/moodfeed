import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostCard } from '@/components/feed/PostCard';
import { SuggestedCommentsDrawer } from '@/components/feed/SuggestedCommentsDrawer';
import { ActionSheet } from '@/components/feed/ActionSheet';
import { CelebrationAnimation } from '@/components/feed/CelebrationAnimation';
import { getFeedPosts, addComment, markNotForMe, Post } from '@/api/posts';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'like' | 'comment' | 'share' | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  // Load more posts when approaching the end
  useEffect(() => {
    const shouldLoadMore = 
      currentIndex >= posts.length - 2 && // Near the end
      hasMore && // Has more posts to load
      !loading && // Not currently loading
      posts.length > 0 && // Has some posts loaded
      page < 50; // Safety limit to prevent infinite loading

    if (shouldLoadMore) {
      console.log('Loading more posts...', { currentIndex, postsLength: posts.length, page });
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage);
    }
  }, [currentIndex, posts.length, hasMore, loading, page, loadPosts]);

  const handleSwipeLeft = async (postId: string) => {
    console.log('Swiped left on post (not for me):', postId);
    
    try {
      await markNotForMe(postId);
      toast({
        title: "Not Interested",
        description: "We'll show you less content like this"
      });
    } catch (error) {
      console.error('Error marking post as not for me:', error);
    }

    // Move to next post
    if (currentIndex < posts.length - 1) {
      setCurrentIndex(prev => prev + 1);
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

  const handleSwipeVertical = (direction: 'up' | 'down') => {
    setSwipeDirection(direction);
    if (direction === 'up' && currentIndex < posts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === 'down' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
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

      // Update post comments count
      setPosts(prev => prev.map(post =>
        post._id === selectedPostId
          ? { ...post, comments: post.comments + 1 }
          : post
      ));

      toast({
        title: "Comment Added",
        description: "Your comment has been posted"
      });

      // Move to next post after commenting
      if (currentIndex < posts.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const handleMessageAuthor = async () => {
    toast({
      title: "Feature Unavailable",
      description: "Messaging feature is not available",
      variant: "destructive"
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (event.key === 'ArrowDown' && currentIndex < posts.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, posts.length]);

  if (loading && posts.length === 0) {
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

  const currentPost = posts[currentIndex];

  if (!currentPost) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">No more posts</h2>
          <p className="text-muted-foreground">Check back later for new content!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg overflow-hidden">
      {/* Fixed Logo */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50  px-4 py-2 ">
        <img 
          src="/src/assets/moodfeedLogo.png" 
          alt="MoodFeed Logo" 
          className="h-12 w-auto object-contain drop-shadow-lg"
        />
      </div>

      <div className="h-screen relative">
        <AnimatePresence mode="wait">
          {posts.map((post, index) => (
            <motion.div
              key={post._id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: index === currentIndex ? 1 : 0,
              }}
              initial={{ y: index > currentIndex ? '100%' : '-100%' }}
              animate={{ y: index === currentIndex ? 0 : index < currentIndex ? '-100%' : '100%' }}
              exit={{ y: swipeDirection === 'up' ? '-100%' : '100%' }}
              transition={{ duration: 0.3 }}
            >
              <PostCard
                post={post}
                isActive={index === currentIndex}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onLongPress={handleLongPress}
                onComment={handleComment}
                onShare={handleShare}
                onSwipeVertical={handleSwipeVertical}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Post counter */}
      <div className="absolute top-20 right-4 glass-effect px-3 py-1 rounded-full">
        <span className="text-white text-sm">
          {currentIndex + 1} / {posts.length}
        </span>
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
        onShare={() => {
          if (selectedPostId) handleShare(selectedPostId);
          setShowActionSheet(false);
        }}
        onMessage={handleMessageAuthor}
      />

      <CelebrationAnimation
        type={celebrationType}
        onComplete={() => setCelebrationType(null)}
      />
    </div>
  );
};