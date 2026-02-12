import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

/**
 * ToastProvider - Context provider for toast notifications
 * Wrap your app with this to enable toast notifications
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    info: (message, duration) => addToast(message, 'info', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * ToastContainer - Renders all active toasts
 */
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * ToastItem - Individual toast notification
 */
function ToastItem({ toast, onClose }) {
  const { message, type } = toast;

  const styles = {
    success: {
      bg: 'bg-green-500',
      icon: '✓',
      text: 'text-white',
    },
    error: {
      bg: 'bg-red-500',
      icon: '✕',
      text: 'text-white',
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: '⚠',
      text: 'text-gray-900',
    },
    info: {
      bg: 'bg-blue-500',
      icon: 'ℹ',
      text: 'text-white',
    },
  };

  const style = styles[type] || styles.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 300
      }}
      className={`${style.bg} ${style.text} rounded-xl shadow-lg p-4 flex items-center gap-3 pointer-events-auto`}
      role="alert"
      aria-live="polite"
    >
      <span className="text-2xl font-bold">{style.icon}</span>
      <p className="flex-1 font-medium">{message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        aria-label="Close notification"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

export default ToastContainer;
