import { useRouter } from 'next/router';
import { useCallback } from 'react';

/**
 * Returns a back-navigation function that stays within the site.
 * If the user arrived directly (no SPA navigation history), goes to /
 * instead of router.back() which could exit to an external site like Google.
 */
export function useSmartBack() {
  const router = useRouter();
  return useCallback(() => {
    if (typeof window !== 'undefined' && window._boilerfuelHasHistory) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);
}
