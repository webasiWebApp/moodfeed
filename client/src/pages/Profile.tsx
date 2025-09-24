import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getCurrentUser, User } from '@/api/users';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { PostCard } from '@/components/feed/PostCard';
import { getPostsByUserId, Post } from '@/api/posts';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        const userResponse = await getCurrentUser();
        setUser(userResponse.user);
        if (userResponse.user) {
          const postsResponse = await getPostsByUserId(userResponse.user._id);
          setPosts(postsResponse.posts);
        }
      } catch (error) { 
        console.error('Error loading profile data:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [toast]);

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

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Profile not found</h2>
          <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const { displayName, username, avatar, bio, mood, postsCount, followersCount, followingCount } = {
    displayName: user.displayName || user.username || user.email || 'User',
    username: user.username || 'user',
    avatar: user.avatar || '',
    bio: user.bio || '',
    mood: user.mood || '😊',
    postsCount: posts.length || 0,
    followersCount: user.followersCount || 0,
    followingCount: user.followingCount || 0,
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings/profile')}
              className="text-white hover:bg-white/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-effect p-6 rounded-2xl mb-6"
          >
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-24 h-24 border-4 border-primary">
                  <AvatarImage src={avatar} alt={displayName} />
                  <AvatarFallback className="text-2xl">{displayName[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-2 -right-2 text-3xl bg-black rounded-full p-1">
                  {mood}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-1">{displayName}</h2>
              <p className="text-muted-foreground mb-4">@{username}</p>

              {bio && (
                <p className="text-white mb-6 leading-relaxed">{bio}</p>
              )}

              <div className="flex justify-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{postsCount}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{followersCount}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{followingCount}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              onClick={() => navigate('/settings/profile')}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-bold py-3 rounded-2xl"
            >
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-black py-3 rounded-2xl"
            >
              Share Profile
            </Button>
          </div>

          <div className="space-y-4">
            {posts.map(post => (
              <PostCard 
                key={post._id} 
                post={post} 
                onSwipeLeft={() => {}} 
                onSwipeRight={() => {}} 
                onLongPress={() => {}} 
                onComment={() => navigate(`/post/${post._id}`)} 
                onShare={() => {}} 
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};