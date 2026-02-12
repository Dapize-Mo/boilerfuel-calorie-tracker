import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BottomSheet - Modern mobile-first modal that slides up from bottom
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Callback when closed
 * @param {ReactNode} children - Content to display
 * @param {string} title - Optional header title
 * @param {string} size - 'sm' | 'md' | 'lg' | 'full' - Sheet height
 */
export default function BottomSheet({ 
  isOpen, 
  onClose, 
  children, 
  title,
  size = 'md' 
}) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const heightClasses = {
    sm: 'max-h-[40vh]',
    md: 'max-h-[60vh]',
    lg: 'max-h-[85vh]',
    full: 'h-[95vh]'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring',
              damping: 30,
              stiffness: 300
            }}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-theme-bg-secondary border-t border-theme-border-primary rounded-t-3xl shadow-2xl ${heightClasses[size]}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'bottom-sheet-title' : undefined}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-theme-border-primary rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="px-6 py-3 border-b border-theme-border-primary">
                <h2 
                  id="bottom-sheet-title"
                  className="text-xl font-semibold text-theme-text-primary"
                >
                  {title}
                </h2>
              </div>
            )}

            {/* Content - Scrollable */}
            <div className="overflow-y-auto overscroll-contain px-6 py-4" style={{ maxHeight: 'calc(100% - 80px)' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
