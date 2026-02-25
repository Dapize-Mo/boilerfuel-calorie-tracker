import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

/**
 * Global keyboard shortcuts for BoilerFuel.
 *
 * Shortcuts:
 *   ?         — Toggle shortcut help overlay
 *   g then h  — Go to Home
 *   g then p  — Go to Profile
 *   g then s  — Go to Stats
 *   g then a  — Go to About
 *   g then c  — Go to Custom Foods
 *   /         — Focus search input (if present)
 *   Escape    — Close overlays / clear focus
 */
export function useKeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const [pendingG, setPendingG] = useState(false);

  const toggleHelp = useCallback(() => setShowHelp((v) => !v), []);

  useEffect(() => {
    let gTimeout;

    function handleKeyDown(e) {
      // Ignore when typing in inputs/textareas/contenteditable
      const tag = e.target.tagName;
      const isEditable =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
        e.target.isContentEditable;
      if (isEditable) return;

      // Ignore if modifier keys are held (except Shift for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;

      // ? — toggle help
      if (key === '?') {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }

      // Escape — close help, blur active element
      if (key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
          e.preventDefault();
        }
        return;
      }

      // / — focus search
      if (key === '/') {
        const searchInput = document.querySelector(
          'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i], input[aria-label*="search" i]'
        );
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
        return;
      }

      // g-key navigation (two-key combo)
      if (pendingG) {
        setPendingG(false);
        clearTimeout(gTimeout);
        const routes = {
          h: '/',
          p: '/profile',
          s: '/stats',
          a: '/about',
          c: '/custom-foods',
        };
        if (routes[key]) {
          e.preventDefault();
          router.push(routes[key]);
        }
        return;
      }

      if (key === 'g') {
        setPendingG(true);
        gTimeout = setTimeout(() => setPendingG(false), 800);
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gTimeout);
    };
  }, [router, pendingG, showHelp]);

  return { showHelp, toggleHelp, pendingG };
}

export const SHORTCUTS = [
  { keys: '?', description: 'Toggle this help' },
  { keys: 'g h', description: 'Go to Home' },
  { keys: 'g p', description: 'Go to Profile' },
  { keys: 'g s', description: 'Go to Stats' },
  { keys: 'g a', description: 'Go to About' },
  { keys: 'g c', description: 'Go to Custom Foods' },
  { keys: '/', description: 'Focus search' },
  { keys: 'Esc', description: 'Close overlay' },
];
