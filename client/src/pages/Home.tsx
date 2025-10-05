
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { PostCard } from '@/components/feed/PostCard';
import { SuggestedCommentsDrawer } from '@/components/feed/SuggestedCommentsDrawer';
import { ActionSheet } from '@/components/feed/ActionSheet';
import { CelebrationAnimation } from '@/components/feed/CelebrationAnimation';
import { getFeedPosts, addComment, markNotForMe, Post } from '@/api/posts';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { startConversation } from '@/api/chat';
import { useAuth } from '@/contexts/AuthContext';
import StatusList from '../components/feed/StatusList';

const fetchPosts = async ({ pageParam = 1 }) => {
  const response = await getFeedPosts(pageParam, 10) as any;
  return response;
};

export const Home: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, fetchNextPage, hasNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ['feedPosts'],
    queryFn: fetchPosts,
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
  });

  const posts = data?.pages.flatMap(page => page.posts) ?? [];

  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'like' | 'comment' | 'share' | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const observer = useRef<IntersectionObserver>();
  const lastPostElementRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasNextPage, fetchNextPage]);

  const postRefs = useRef(new Map());
  const activePostObserver = useRef<IntersectionObserver>();

  useEffect(() => {
    activePostObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActivePostId(entry.target.getAttribute('data-post-id'));
          }
        });
      },
      { threshold: 0.5 } // 50% of the post is visible
    );

    const observer = activePostObserver.current;
    postRefs.current.forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [posts]);

  const setPostRef = (node, postId) => {
    if (node) {
      postRefs.current.set(postId, node);
    } else {
      postRefs.current.delete(postId);
    }
  };

  const handleSwipeLeft = async (postId: string) => {
    console.log('Swiped left on post (not for me):', postId);
    
    try {
      await markNotForMe(postId);
      toast({
        title: "Not Interested",
        description: "We'll show you less content like this"
      });
      queryClient.setQueryData(['feedPosts'], (oldData: any) => ({
        ...oldData,
        pages: oldData.pages.map(page => ({...page, posts: page.posts.filter(p => p._id !== postId)}))
      }));
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

      queryClient.setQueryData(['feedPosts'], (oldData: any) => ({
        ...oldData,
        pages: oldData.pages.map(page => ({...page, posts: page.posts.map(post => 
          post._id === selectedPostId ? { ...post, comments: post.comments + 1 } : post
        )}))
      }));

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

  if (isLoading && posts.length === 0) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (isError) {
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive"
      });
  }

  return (
    <div className="min-h-screen gradient-bg">
      
      <div className="w-full bg-gradient-to-b from-black to-transparent flex items-center justify-center fixed top-0 left-1/2 transform -translate-x-1/2 z-50 px-4 py-6">
        <img 
          src="/src/assets/moodfeedLogo.png" 
          alt="MoodFeed Logo" 
          className="h-12 w-auto object-contain drop-shadow-lg"
        />
      </div>

      <div className="pt-20 pb-2">
        <StatusList />
        <div className="flex flex-col items-center gap-4 mt-4">
          {posts.map((post, index) => (
            <div 
              ref={node => {
                if (posts.length === index + 1) {
                  lastPostElementRef(node);
                }
                setPostRef(node, post._id);
              }}
              key={post._id} 
              className="w-full max-w-md"
              data-post-id={post._id}
            >
              <PostCard
                post={post}
                isActive={activePostId === post._id}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onLongPress={handleLongPress}
                onComment={handleComment}
                onShare={handleShare}
              />
            </div>
          ))}
        </div>
        {isLoading && (
          <div className="text-center p-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!hasNextPage && posts.length > 0 && (
          <div className="text-center p-4 text-white">
            <p>You've reached the end of the feed.</p>
          </div>
        )}
        {!isLoading && posts.length === 0 && (
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
