import { useRef, useCallback } from 'react';

/**
 * Hook for detecting horizontal swipe gestures.
 * Returns touch event handlers to attach to a container element.
 *
 * @param {Object} callbacks
 * @param {function} callbacks.onSwipeLeft  - Called when user swipes left (go forward).
 * @param {function} callbacks.onSwipeRight - Called when user swipes right (go back).
 * @param {number} [threshold=50] - Minimum swipe distance in px.
 * @returns {{ onTouchStart: function, onTouchEnd: function }}
 */
export function useSwipeGesture({ onSwipeLeft, onSwipeRight }, threshold = 50) {
  const touchStart = useRef(null);
  const touchStartY = useRef(null);

  const onTouchStart = useCallback((e) => {
    touchStart.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (touchStart.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStart.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger if horizontal movement is dominant (not a scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    touchStart.current = null;
    touchStartY.current = null;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchEnd };
}
