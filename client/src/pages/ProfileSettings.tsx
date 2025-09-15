import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getCurrentUser, updateProfile, User } from '@/api/users';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';

interface ProfileForm {
  displayName: string;
  bio: string;
}

const moods = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😠', label: 'Angry' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🤩', label: 'Excited' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😐', label: 'Neutral' }
];

export const ProfileSettings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedMood, setSelectedMood] = useState('😊');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileForm>();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      console.log('Loading user profile for editing');
      const response = await getCurrentUser();
      console.log('User profile loaded for editing:', response.user);
      const userData = response.user;
      setUser(userData);
      
      // Safe fallback values
      const displayName = userData.displayName || userData.username || userData.email || 'User';
      const bio = userData.bio || '';
      const mood = userData.mood || '😊';
      
      setSelectedMood(mood);
      setValue('displayName', displayName);
      setValue('bio', bio);
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

  const onSubmit = async (data: ProfileForm) => {
    setSubmitting(true);

    try {
      console.log('Updating profile:', { ...data, mood: selectedMood });
      const response = await updateProfile({
        displayName: data.displayName,
        bio: data.bio,
        mood: selectedMood
      });

      setUser(response.user);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      navigate('/profile');
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update profile',
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

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Profile not found</h2>
          <Button onClick={() => navigate('/profile')} className="bg-primary hover:bg-primary/90">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Safe fallback values
  const displayName = user.displayName || user.username || user.email || 'User';
  const avatar = user.avatar || '';

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
              onClick={() => navigate('/profile')}
              className="text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
            <div className="w-10" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect p-6 rounded-2xl"
            >
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-24 h-24 border-4 border-primary">
                    <AvatarImage src={avatar} alt={displayName} />
                    <AvatarFallback className="text-2xl">{displayName[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="icon"
                    className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 text-black rounded-full"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <span className="absolute -top-2 -right-2 text-3xl bg-black rounded-full p-1">
                    {selectedMood}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Tap to change profile picture</p>
              </div>
            </motion.div>

            {/* Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-effect p-6 rounded-2xl space-y-4"
            >
              <div>
                <Label htmlFor="displayName" className="text-white font-medium">Display Name</Label>
                <Input
                  id="displayName"
                  {...register('displayName', { required: 'Display name is required' })}
                  className="mt-2 bg-transparent border-white/20 text-white placeholder:text-muted-foreground"
                  placeholder="Enter your display name"
                />
                {errors.displayName && (
                  <p className="text-red-400 text-sm mt-1">{errors.displayName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="bio" className="text-white font-medium">Bio</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  className="mt-2 bg-transparent border-white/20 text-white placeholder:text-muted-foreground resize-none"
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground mt-1">150 characters max</p>
              </div>
            </motion.div>

            {/* Mood Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-effect p-6 rounded-2xl"
            >
              <Label className="text-white font-medium mb-4 block">Current Mood</Label>
              <div className="grid grid-cols-6 gap-3">
                {moods.map((mood) => (
                  <motion.button
                    key={mood.emoji}
                    type="button"
                    onClick={() => setSelectedMood(mood.emoji)}
                    className={`p-3 rounded-xl text-2xl transition-colors ${
                      selectedMood === mood.emoji
                        ? 'bg-primary/20 border-2 border-primary'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    {mood.emoji}
                  </motion.button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3 text-center">
                Your mood appears next to your profile picture
              </p>
            </motion.div>

            {/* Save Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-bold py-4 rounded-2xl text-lg"
            >
              {submitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2"
                />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};