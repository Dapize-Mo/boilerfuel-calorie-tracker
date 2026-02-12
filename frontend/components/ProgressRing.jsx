import { motion } from 'framer-motion';

/**
 * ProgressRing - Circular progress indicator for goals
 * @param {number} value - Current value
 * @param {number} max - Maximum value (goal)
 * @param {number} size - Ring diameter in pixels
 * @param {number} strokeWidth - Ring thickness
 * @param {string} color - Tailwind color class
 * @param {string} label - Label text
 * @param {boolean} showValue - Show numeric value
 */
export default function ProgressRing({ 
  value = 0, 
  max = 100, 
  size = 120,
  strokeWidth = 8,
  color = 'stroke-primary-500',
  label,
  showValue = true,
  unit = ''
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-theme-border-primary fill-none"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`${color} fill-none`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 100,
              duration: 1
            }}
          />
        </svg>

        {/* Center text */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-2xl font-bold text-theme-text-primary"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {Math.round(value)}
              {unit && <span className="text-sm text-theme-text-tertiary ml-0.5">{unit}</span>}
            </motion.span>
            <span className="text-xs text-theme-text-tertiary">
              of {max}{unit}
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      {label && (
        <span className="text-sm font-medium text-theme-text-secondary">
          {label}
        </span>
      )}

      {/* Percentage badge */}
      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
        percentage >= 100 
          ? 'bg-green-500/20 text-green-600 dark:text-green-400'
          : percentage >= 75
          ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
          : 'bg-theme-bg-tertiary text-theme-text-tertiary'
      }`}>
        {Math.round(percentage)}%
      </div>
    </div>
  );
}
