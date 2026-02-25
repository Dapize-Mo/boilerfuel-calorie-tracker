import { motion } from 'framer-motion';

/**
 * Animated section wrapper using framer-motion.
 * Fades in and slides up when the component mounts.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {number} [props.delay=0] - Delay in seconds before animation starts.
 * @param {string} [props.className]
 */
export default function AnimatedSection({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated number counter — smoothly counts from 0 to value.
 * Great for stats, totals, and dashboard numbers.
 */
export function AnimatedNumber({ value, className = '' }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {value}
    </motion.span>
  );
}

/**
 * Stagger children animations — each child fades in with a slight delay.
 */
export function StaggerContainer({ children, className = '' }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
