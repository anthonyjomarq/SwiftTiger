import React, { useEffect, useRef, useCallback } from 'react';

export const useFocusManagement = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const trapRef = useRef<HTMLElement | null>(null);

  // Store the currently focused element
  const storePreviousFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  // Restore focus to the previously focused element
  const restorePreviousFocus = useCallback(() => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus();
    }
  }, []);

  // Focus the first focusable element in a container
  const focusFirst = useCallback((container?: HTMLElement | null) => {
    const element = container || document;
    const firstFocusable = element.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), details, summary'
    );
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, []);

  // Focus the last focusable element in a container
  const focusLast = useCallback((container?: HTMLElement | null) => {
    const element = container || document;
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), details, summary'
    );
    const lastFocusable = focusableElements[focusableElements.length - 1];
    if (lastFocusable) {
      lastFocusable.focus();
    }
  }, []);

  // Get all focusable elements within a container
  const getFocusableElements = useCallback((container: HTMLElement) => {
    return container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), details, summary'
    );
  }, []);

  // Focus trap for modals and dialogs
  const setupFocusTrap = useCallback((container: HTMLElement) => {
    trapRef.current = container;
    storePreviousFocus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !trapRef.current) return;

      const focusableElements = getFocusableElements(trapRef.current);
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        removeFocusTrap();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEscapeKey);

    // Focus the first element
    focusFirst(container);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [getFocusableElements, focusFirst, storePreviousFocus]);

  // Remove focus trap
  const removeFocusTrap = useCallback(() => {
    trapRef.current = null;
    restorePreviousFocus();
  }, [restorePreviousFocus]);

  return {
    storePreviousFocus,
    restorePreviousFocus,
    focusFirst,
    focusLast,
    getFocusableElements,
    setupFocusTrap,
    removeFocusTrap
  };
};

// Hook for managing focus on route changes
export const useRouteAnnouncement = () => {
  const announceRouteChange = useCallback((routeName: string) => {
    // Create or update the route announcement
    let announcer = document.getElementById('route-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'route-announcer';
      announcer.setAttribute('aria-live', 'assertive');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      document.body.appendChild(announcer);
    }

    announcer.textContent = `Navigated to ${routeName}`;

    // Clear the announcement after a short delay
    setTimeout(() => {
      if (announcer) {
        announcer.textContent = '';
      }
    }, 1000);
  }, []);

  return { announceRouteChange };
};

// Skip link component for keyboard navigation
export const SkipLink: React.FC<{ targetId: string; children: React.ReactNode }> = ({
  targetId,
  children
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </a>
  );
};

export default useFocusManagement;