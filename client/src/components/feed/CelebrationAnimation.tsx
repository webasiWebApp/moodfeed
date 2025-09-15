import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share } from 'lucide-react';

interface CelebrationAnimationProps {
  type: 'like' | 'comment' | 'share' | null;
  onComplete: () => void;
}

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  type,
  onComplete
}) => {
  const getIcon = () => {
    switch (type) {
      case 'like':
        return <Heart className="w-12 h-12 fill-red-500 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-12 h-12 text-secondary" />;
      case 'share':
        return <Share className="w-12 h-12 text-primary" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'like':
        return '#ef4444';
      case 'comment':
        return '#FF7A00';
      case 'share':
        return '#19C37D';
      default:
        return '#19C37D';
    }
  };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {type && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -50 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 0.6,
              repeat: 1,
              ease: 'easeInOut'
            }}
            className="relative"
          >
            {getIcon()}
            
            {/* Confetti particles */}
            {type === 'like' && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{
                      opacity: 0,
                      scale: 0,
                      x: Math.cos((i * Math.PI * 2) / 8) * 50,
                      y: Math.sin((i * Math.PI * 2) / 8) * 50
                    }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: getColor() }}
                  />
                ))}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};