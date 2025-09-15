import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Image, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createPost } from '@/api/posts';
import { uploadMedia } from '@/api/upload';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';

interface CreatePostForm {
  content: string;
}

const moods = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😠', label: 'Angry' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🤩', label: 'Excited' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😐', label: 'Neutral' }
];

export const CreatePost: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState('😊');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, watch } = useForm<CreatePostForm>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const content = watch('content', '');

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setMediaFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Error",
          description: "Please upload an image or video file",
          variant: "destructive"
        });
      }
    }
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const onSubmit = async (data: CreatePostForm) => {
    if (!data.content.trim() && !mediaFile) {
      toast({
        title: "Error",
        description: "Please add some content or media to your post",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let mediaUrl: string | undefined;
      let mediaType: 'image' | 'video' | undefined;

      if (mediaFile) {
        // Determine media type
        mediaType = mediaFile.type.startsWith('image/') ? 'image' : 
                   mediaFile.type.startsWith('video/') ? 'video' : 
                   undefined;
        
        // Upload media first
        mediaUrl = await uploadMedia(mediaFile);
      }

      // Create the post
      await createPost({
        content: data.content.trim(),
        mediaUrl,
        mediaType,
        mood: selectedMood
      });

      toast({
        title: "Success",
        description: "Your post has been created!",
      });

      // Navigate back to home/feed
      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto glass-effect p-6 rounded-xl"
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
            <h1 className="text-2xl font-bold text-white">Create Post</h1>
            <div className="w-10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-primary">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 text-lg">
                  {selectedMood}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <Textarea
                {...register('content', { required: !mediaFile })}
                placeholder="What's on your mind?"
                className="min-h-32 bg-transparent border-white/20 text-white placeholder:text-white/50 resize-none text-lg"
                maxLength={500}
              />
              <div className="flex justify-end">
                <span className="text-sm text-white/70">
                  {content.length}/500
                </span>
              </div>
            </div>

            {/* Media Preview */}
            {mediaPreview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                {mediaFile?.type.startsWith('image/') ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-[300px] object-cover rounded-xl"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full max-h-[300px] rounded-xl"
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveMedia}
                >
                  Remove
                </Button>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex space-x-2">
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  id="media-upload"
                  onChange={handleMediaSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('media-upload')?.click()}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Image className="h-4 w-4 mr-2" />
                  Add Media
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center -space-x-1">
                  {moods.map((mood) => (
                    <motion.button
                      key={mood.emoji}
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMoodSelect(mood.emoji)}
                      className={`text-2xl p-2 rounded-full transition-colors ${
                        selectedMood === mood.emoji
                          ? 'bg-white/20'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      {mood.emoji}
                    </motion.button>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};