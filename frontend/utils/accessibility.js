/**
 * Accessibility utilities for BoilerFuel calorie tracker.
 *
 * Provides focus trapping, screen-reader announcements, keyboard helpers,
 * contrast-ratio calculation, reduced-motion detection, and unique ID generation.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * CSS selector that matches all natively focusable elements that are not
 * disabled and not hidden via tabindex="-1".
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  'details > summary',
].join(', ');

// ---------------------------------------------------------------------------
// Focus trap
// ---------------------------------------------------------------------------

/**
 * Trap keyboard focus inside `containerElement`.
 *
 * When the user presses Tab (or Shift+Tab) the focus cycles through the
 * focusable children of the container rather than leaving it.
 *
 * @param {HTMLElement} containerElement - DOM node to trap focus within.
 * @returns {function} cleanup - Call this to remove the event listener.
 */
export function trapFocus(containerElement) {
  if (!containerElement) return () => {};

  function handleKeyDown(event) {
    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      containerElement.querySelectorAll(FOCUSABLE_SELECTOR)
    ).filter((el) => el.offsetParent !== null); // skip hidden elements

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      // Shift+Tab: if focus is on first element, wrap to last
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab: if focus is on last element, wrap to first
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  containerElement.addEventListener('keydown', handleKeyDown);

  return () => {
    containerElement.removeEventListener('keydown', handleKeyDown);
  };
}

// ---------------------------------------------------------------------------
// Screen-reader announcements
// ---------------------------------------------------------------------------

let liveRegionElement = null;

/**
 * Lazily create (or return the existing) persistent ARIA live region element
 * used for dynamic announcements.
 */
function getOrCreateLiveRegion(priority) {
  const id =
    priority === 'assertive'
      ? 'a11y-live-assertive'
      : 'a11y-live-polite';

  let el = document.getElementById(id);
  if (el) return el;

  el = document.createElement('div');
  el.id = id;
  el.setAttribute('aria-live', priority === 'assertive' ? 'assertive' : 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.setAttribute('role', 'status');

  // Screen-reader-only styles (mirrors Tailwind's `sr-only` utility)
  Object.assign(el.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });

  document.body.appendChild(el);
  return el;
}

/**
 * Announce a message to screen readers via an ARIA live region.
 *
 * A persistent live region element is lazily inserted into the DOM and reused
 * across calls.  The text is cleared briefly before setting the new value so
 * that repeated identical messages are still announced.
 *
 * @param {string}  message  - Text to announce.
 * @param {'polite'|'assertive'} [priority='polite'] - Live region priority.
 */
export function announceToScreenReader(message, priority = 'polite') {
  if (typeof document === 'undefined') return;

  const region = getOrCreateLiveRegion(priority);

  // Clear the region first so that identical consecutive messages are
  // still picked up by assistive technology.
  region.textContent = '';

  // Use a microtask / rAF so the DOM mutation is observed as two separate
  // changes by the accessibility tree.
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

// ---------------------------------------------------------------------------
// Keyboard helpers
// ---------------------------------------------------------------------------

/**
 * Return an event handler that invokes `callback` when the Escape key is
 * pressed.  Suitable for attaching to `keydown` listeners.
 *
 * @param {function} callback - Function to call on Escape.
 * @returns {function} keydown event handler.
 */
export function handleEscapeKey(callback) {
  return function onKeyDown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      callback(event);
    }
  };
}

// ---------------------------------------------------------------------------
// Contrast ratio
// ---------------------------------------------------------------------------

/**
 * Parse a hex colour string (#RGB, #RRGGBB, or without the hash) into an
 * { r, g, b } object with values in 0-255.
 */
function parseHexColor(hex) {
  let h = hex.replace(/^#/, '');

  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }

  const num = parseInt(h, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

/**
 * Convert an sRGB channel value (0-255) to its relative luminance component
 * per WCAG 2.x.
 */
function sRGBtoLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Compute the relative luminance of a colour given as a hex string.
 * Follows the WCAG 2.x formula.
 *
 * @param {string} hex - Colour in "#RRGGBB" or "#RGB" format.
 * @returns {number} Relative luminance (0-1).
 */
function relativeLuminance(hex) {
  const { r, g, b } = parseHexColor(hex);
  return (
    0.2126 * sRGBtoLinear(r) +
    0.7152 * sRGBtoLinear(g) +
    0.0722 * sRGBtoLinear(b)
  );
}

/**
 * Calculate the WCAG 2.x contrast ratio between two colours.
 *
 * @param {string} foreground - Foreground colour hex string.
 * @param {string} background - Background colour hex string.
 * @returns {number} Contrast ratio (1-21).
 */
export function getContrastRatio(foreground, background) {
  const lum1 = relativeLuminance(foreground);
  const lum2 = relativeLuminance(background);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Reduced motion
// ---------------------------------------------------------------------------

/**
 * Check whether the user has requested reduced motion via their OS /
 * browser settings.
 *
 * @returns {boolean} `true` if the user prefers reduced motion.
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---------------------------------------------------------------------------
// Unique ID generation
// ---------------------------------------------------------------------------

let idCounter = 0;

/**
 * Generate a unique ID string.  Useful for associating form labels, ARIA
 * `aria-describedby` / `aria-labelledby` attributes, etc.
 *
 * @param {string} [prefix='a11y'] - Optional prefix for the ID.
 * @returns {string} A unique ID such as "a11y-42".
 */
export function generateId(prefix = 'a11y') {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
