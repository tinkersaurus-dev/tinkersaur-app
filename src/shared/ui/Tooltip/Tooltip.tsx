/**
 * Tooltip Component
 * A simple tooltip using floating-ui with configurable delay
 */

import { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from '@floating-ui/react';
import type { Placement } from '@floating-ui/core';

interface TooltipProps {
  /** The content to display in the tooltip */
  content: React.ReactNode;
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  /** Placement of the tooltip relative to the trigger */
  placement?: Placement;
  /** Delay before showing the tooltip in ms */
  delayOpen?: number;
  /** Delay before hiding the tooltip in ms */
  delayClose?: number;
}

export function Tooltip({
  content,
  children,
  placement = 'right',
  delayOpen = 100,
  delayClose = 0,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift()],
  });

  const setReference = refs.setReference;
  const setFloating = refs.setFloating;

  const hover = useHover(context, {
    delay: { open: delayOpen, close: delayClose },
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <span
        // eslint-disable-next-line react-hooks/refs
        ref={setReference}
        {...getReferenceProps()}
      >
        {children}
      </span>
      {isOpen && (
        <FloatingPortal>
          <div
            // eslint-disable-next-line react-hooks/refs
            ref={setFloating}
            style={{ ...floatingStyles }}
            {...getFloatingProps()}
            className="z-50 px-2 py-1 text-xs font-medium text-[var(--text-contrast)] bg-[var(--bg-dark)] border border-[var(--border-muted)] rounded"
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
