import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onMessage: () => void;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  onMessage
}) => {
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
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black">Actions</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5 text-black" />
              </Button>
            </div>

            <div className="space-y-3">
              <motion.button
                onClick={onMessage}
                className="w-full flex items-center space-x-4 p-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle className="w-6 h-6 text-black" />
                <span className="text-black font-medium">Drop a message</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};