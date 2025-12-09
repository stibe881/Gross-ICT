import { useEffect, RefObject } from 'react';

/**
 * Custom hook for enhanced keyboard navigation
 * Implements arrow key navigation for grid/list items
 */
export function useKeyboardNavigation(
  containerRef: RefObject<HTMLElement>,
  itemSelector: string,
  options: {
    columns?: number;
    onEnter?: (element: HTMLElement) => void;
    onEscape?: () => void;
  } = {}
) {
  const { columns = 3, onEnter, onEscape } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];
      const activeElement = document.activeElement as HTMLElement;
      const currentIndex = items.indexOf(activeElement);

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = Math.min(currentIndex + 1, items.length - 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = Math.min(currentIndex + columns, items.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = Math.max(currentIndex - columns, 0);
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (onEnter) {
            onEnter(items[currentIndex]);
          } else {
            items[currentIndex].click();
          }
          return;
        case 'Escape':
          e.preventDefault();
          if (onEscape) {
            onEscape();
          }
          return;
        default:
          return;
      }

      items[nextIndex]?.focus();
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, itemSelector, columns, onEnter, onEscape]);
}

/**
 * Custom hook for focus trap (useful for modals/dialogs)
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleTabKey);
  }, [containerRef, isActive]);
}

/**
 * Custom hook for announcing dynamic content changes to screen readers
 */
export function useAnnounce() {
  useEffect(() => {
    // Create live region if it doesn't exist
    if (!document.getElementById('sr-announcer')) {
      const announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }
  }, []);

  return (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };
}
