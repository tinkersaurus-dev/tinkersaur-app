import React, { useState, useRef, useEffect } from 'react';
import { LuCopy, LuCheck } from 'react-icons/lu';
import { FloatingPanel } from '@/shared/ui/FloatingPanel';
import { Button } from '@/shared/ui';
import { useMermaidViewerStore } from '@/features/diagram-management';

/**
 * MermaidViewer - Displays generated Mermaid syntax in a floating panel
 *
 * Features:
 * - Displays mermaid syntax in a monospace textarea
 * - Copy to clipboard functionality with success feedback
 * - Error display if generation fails
 * - Read-only textarea to prevent accidental edits
 */
export function MermaidViewer() {
  const { isOpen, mermaidSyntax, errorMessage, setOpen } = useMermaidViewerStore();
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mermaidSyntax);
      // Clear any existing timeout before setting a new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setCopied(true);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const textareaStyles = `
    w-full
    min-h-[200px]
    p-4
    font-mono
    text-xs
    bg-[var(--bg-dark)]
    border border-[var(--border)]
    rounded-sm
    text-[var(--text)]
    resize-none
    focus:outline-none
    focus:border-[var(--primary)]
  `.trim();

  const errorStyles = `
    w-full
    p-4
    bg-red-500/10
    border border-red-500/30
    rounded-sm
    text-red-500
    text-sm
  `.trim();

  const emptyStateStyles = `
    w-full
    p-8
    text-center
    text-[var(--text-muted)]
    text-sm
  `.trim();

  const footer = (
    <Button
      variant="primary"
      size="small"
      onClick={handleCopy}
      disabled={!mermaidSyntax || !!errorMessage}
    >
      {copied ? (
        <>
          <LuCheck  />
        </>
      ) : (
        <>
          <LuCopy  />
        </>
      )}
    </Button>
  );

  return (
    <FloatingPanel
      open={isOpen}
      onClose={handleClose}
      title="Mermaid Syntax"
      footer={footer}
      width={400}
      closable={true}
      backdropClosable={true}
    >
      {errorMessage ? (
        <div className={errorStyles}>
          <strong>Error:</strong> {errorMessage}
        </div>
      ) : mermaidSyntax ? (
        <textarea
          className={textareaStyles}
          value={mermaidSyntax}
          readOnly
          spellCheck={false}
        />
      ) : (
        <div className={emptyStateStyles}>
          No diagram elements to display. Add shapes to your canvas to generate Mermaid
          syntax.
        </div>
      )}
    </FloatingPanel>
  );
}
