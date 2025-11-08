import { useEffect } from 'react';
import { useCommandStore } from '../store/commandStore';

interface UseKeyboardShortcutsOptions {
  /**
   * The scope for undo/redo operations (typically a diagram ID)
   */
  scope?: string;

  /**
   * Whether keyboard shortcuts are enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * Detect if we're on macOS
 */
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Check if the active element is an input field where we should disable shortcuts
 */
function isInputField(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea';
  const isContentEditable = (element as HTMLElement).isContentEditable;

  return isInput || isContentEditable;
}

/**
 * Hook to handle keyboard shortcuts for undo/redo
 * Provides platform-aware shortcuts:
 * - Mac: Cmd+Z (undo), Cmd+Shift+Z (redo)
 * - Windows/Linux: Ctrl+Z (undo), Ctrl+Shift+Z or Ctrl+Y (redo)
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { scope = 'global', enabled = true } = options;
  const { undo, redo, canUndo, canRedo } = useCommandStore();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if typing in an input field
      if (isInputField(event.target as Element)) {
        return;
      }

      // Get the appropriate modifier key based on platform
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      // Prevent shortcuts if the wrong modifier is used
      if (!modifierKey) {
        return;
      }

      const key = event.key.toLowerCase();

      // Undo: Cmd/Ctrl + Z (without Shift)
      if (key === 'z' && !event.shiftKey) {
        if (canUndo(scope)) {
          event.preventDefault();
          undo(scope);
        }
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z
      if (key === 'z' && event.shiftKey) {
        if (canRedo(scope)) {
          event.preventDefault();
          redo(scope);
        }
        return;
      }

      // Redo (Windows/Linux alternative): Ctrl + Y
      if (!isMac && key === 'y') {
        if (canRedo(scope)) {
          event.preventDefault();
          redo(scope);
        }
        return;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scope, enabled, undo, redo, canUndo, canRedo]);
}
