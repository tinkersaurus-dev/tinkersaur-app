/**
 * DocumentView Component
 * Editable markdown document with live preview
 */

import { useEffect, useRef } from 'react';
import { Empty } from '~/core/components/ui';
import { useDocument } from '../hooks';
import { useDesignStudioEntityStore } from '~/core/entities/design-studio';
import { DocumentEditor } from './document';

interface DocumentViewProps {
  documentId: string;
}

export function DocumentView({ documentId }: DocumentViewProps) {
  const { document, loading } = useDocument(documentId);
  const updateDocument = useDesignStudioEntityStore((state) => state.updateDocument);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const hasLoadedRef = useRef(false);

  // Track if we've successfully loaded the document at least once
  useEffect(() => {
    if (document && !loading) {
      hasLoadedRef.current = true;
    }
  }, [document, loading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Only show loading for initial load, not for updates
  if (loading && !hasLoadedRef.current) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        Loading document...
      </div>
    );
  }

  if (!document) {
    return <Empty description="Document not found" className='bg-[var(--bg)]'/>;
  }

  // Debounced auto-save handler
  const handleContentChange = (newContent: string) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      updateDocument(documentId, { content: newContent });
    }, 300);
  };

  // Manual save handler (for Cmd/Ctrl+S)
  const handleSave = (content: string) => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Save immediately
    updateDocument(documentId, { content });
  };

  return (
    <div className='bg-[var(--bg)] h-full'>
      <DocumentEditor
        initialContent={document.content}
        onContentChange={handleContentChange}
        onSave={handleSave}
        height="100%"
      />
    </div>
  );
}
