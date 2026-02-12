import { motion } from 'framer-motion';

/**
 * EmptyState - Beautiful empty state with illustration and CTA
 * @param {string} icon - Emoji icon
 * @param {string} title - Main heading
 * @param {string} description - Supporting text
 * @param {string} action - CTA button text
 * @param {function} onAction - CTA callback
 */
export default function EmptyState({ 
  icon = '📭', 
  title, 
  description, 
  action, 
  onAction 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Icon/Illustration */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: 'spring',
          delay: 0.2,
          damping: 15,
          stiffness: 200
        }}
        className="text-8xl mb-6 animate-bounce-subtle"
      >
        {icon}
      </motion.div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-theme-text-primary mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-theme-text-secondary max-w-md mb-8">
        {description}
      </p>

      {/* CTA Button */}
      {action && onAction && (
        <motion.button
          onClick={onAction}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action}
        </motion.button>
      )}
    </motion.div>
  );
}
