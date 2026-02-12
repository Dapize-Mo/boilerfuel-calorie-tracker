import { motion } from 'framer-motion';

/**
 * SkipToContent - Accessibility component for keyboard navigation
 * 
 * Provides a hidden link that becomes visible when focused,
 * allowing keyboard users to skip navigation and jump to main content.
 * 
 * Usage:
 * <SkipToContent />
 * 
 * Add id="main-content" to your main content container
 */
export default function SkipToContent() {
  return (
    <motion.a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
      initial={{ opacity: 0 }}
      whileFocus={{ opacity: 1 }}
    >
      Skip to main content
    </motion.a>
  );
}
