import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Grid, Heart, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getCurrentUser, User } from '@/api/users';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      console.log('Loading user profile');
      const response = await getCurrentUser();
      console.log('User profile loaded:', response.user);
      setUser(response.user);
    } catch (error: unknown) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to load profile',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  // Safe fallback values
  const displayName = user.displayName || user.username || user.email || 'User';
  const username = user.username || 'user';
  const avatar = user.avatar || '';
  const bio = user.bio || '';
  const mood = user.mood || '😊';
  const postsCount = user.postsCount || 0;
  const followersCount = user.followersCount || 0;
  const followingCount = user.followingCount || 0;

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

          {/* Profile Info */}
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

          {/* Action Buttons */}
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

          {/* Posts Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect p-6 rounded-2xl"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Grid className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">Your Posts</h3>
            </div>

            {/* Mock posts grid */}
            <div className="grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl relative overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                >
                  <img
                    src={`https://images.unsplash.com/photo-${1500000000000 + index}?w=200&h=200&fit=crop`}
                    alt={`Post ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-4 text-white">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{Math.floor(Math.random() * 100) + 10}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{Math.floor(Math.random() * 20) + 1}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};