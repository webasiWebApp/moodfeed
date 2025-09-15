import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SuggestedCommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComment: (comment: string) => void;
  onCustomComment: (comment: string) => void;
}

const suggestedComments = [
  '🔥 Love this!',
  '👏 Nice shot!',
  '😍 Amazing!',
  '💯 Perfect!',
  '✨ Beautiful!',
  '👌 Great work!',
  '🙌 Awesome!',
  '❤️ So good!'
];

export const SuggestedCommentsDrawer: React.FC<SuggestedCommentsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectComment,
  onCustomComment
}) => {
  const [customComment, setCustomComment] = React.useState('');

  const handleCustomSubmit = () => {
    if (customComment.trim()) {
      onCustomComment(customComment.trim());
      setCustomComment('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 max-h-[70vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black">Quick Comments</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5 text-black" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {suggestedComments.map((comment, index) => (
                <motion.button
                  key={index}
                  onClick={() => onSelectComment(comment)}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-left text-black font-medium transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  {comment}
                </motion.button>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-black">Custom Comment</h4>
              <div className="flex space-x-2">
                <Input
                  value={customComment}
                  onChange={(e) => setCustomComment(e.target.value)}
                  placeholder="Write your comment..."
                  className="flex-1 bg-gray-100 border-gray-200 text-black placeholder:text-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                />
                <Button
                  onClick={handleCustomSubmit}
                  disabled={!customComment.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  Send
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};