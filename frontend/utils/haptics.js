/**
 * Haptic feedback utilities for mobile devices.
 * Uses the Vibration API where available.
 */

/**
 * Light haptic tap — used for adding items, toggling.
 */
export function hapticLight() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

/**
 * Medium haptic — used for removing items, confirmations.
 */
export function hapticMedium() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(25);
  }
}

/**
 * Success haptic — double tap pattern for completed actions.
 */
export function hapticSuccess() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([10, 50, 10]);
  }
}

/**
 * Warning haptic — longer buzz for destructive actions.
 */
export function hapticWarning() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(50);
  }
}
