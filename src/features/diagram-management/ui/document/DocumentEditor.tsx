/**
 * Document Editor Component
 *
 * A markdown-based document editor with live preview and line numbers.
 * Supports split view, edit-only, and preview-only modes.
 */

import { useEffect, useRef, useState } from 'react';
import { LuEye, LuPencil, LuColumns2 } from 'react-icons/lu';
import { MarkdownContent } from '@/shared/ui';
import { Button } from '@/shared/ui/Button';

export type DocumentViewMode = 'edit' | 'split' | 'preview';

export interface DocumentEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
  height?: string;
}

/**
 * Calculate line numbers for the editor
 */
function getLineNumbers(content: string): number[] {
  const lines = content.split('\n');
  return Array.from({ length: lines.length }, (_, i) => i + 1);
}

/**
 * Document Editor Component
 */
export function DocumentEditor({
  initialContent = '',
  onContentChange,
  onSave,
  height = '100%',
}: DocumentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const tabTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use local state for immediate UI feedback
  const [content, setContentState] = useState(initialContent);
  const [viewMode, setViewMode] = useState<DocumentViewMode>('split');

  // Update content when initialContent prop changes
  useEffect(() => {
    setContentState(initialContent);
  }, [initialContent]);

  // Sync scroll between line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setContentState(newContent);
    onContentChange?.(newContent);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      onSave?.(content);
    }

    // Tab inserts spaces instead of moving focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      handleContentChange(newContent);

      // Clear any existing timeout before setting a new one
      if (tabTimeoutRef.current) {
        clearTimeout(tabTimeoutRef.current);
      }

      // Restore cursor position after React updates
      tabTimeoutRef.current = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
        tabTimeoutRef.current = null;
      }, 0);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tabTimeoutRef.current) {
        clearTimeout(tabTimeoutRef.current);
      }
    };
  }, []);

  const lineNumbers = getLineNumbers(content);
  const showEditor = viewMode === 'edit' || viewMode === 'split';
  const showPreview = viewMode === 'preview' || viewMode === 'split';

  return (
    <div className="flex flex-col w-full" style={{ height }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="text-xs font-medium text-[var(--text)]">
          Markdown Editor
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'edit' ? 'primary' : 'default'}
            size="small"
            onClick={() => setViewMode('edit')}
            icon={<LuPencil />}
          />
          <Button
            variant={viewMode === 'split' ? 'primary' : 'default'}
            size="small"
            onClick={() => setViewMode('split')}
            icon={<LuColumns2 />}
          />
          <Button
            variant={viewMode === 'preview' ? 'primary' : 'default'}
            size="small"
            onClick={() => setViewMode('preview')}
            icon={<LuEye />}
          />
        </div>
      </div>

      {/* Editor and Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        {showEditor && (
          <div
            className={`flex overflow-hidden ${
              showPreview ? 'flex-1 border-r border-[var(--border)]' : 'flex-[2]'
            }`}
          >
            {/* Line Numbers */}
            <div
              ref={lineNumbersRef}
              className="w-[50px] bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden text-right pr-2 pt-3 select-none"
              style={{
                fontFamily: 'monospace',
                fontSize: 'var(--font-size-sm)',
                lineHeight: '1.5',
                color: 'var(--text-tertiary)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <style>{`
                .line-numbers::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {lineNumbers.map((num) => (
                <div key={num} style={{ height: '1.5em' }}>
                  {num}
                </div>
              ))}
            </div>

            {/* Editor Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                placeholder="Start writing your markdown here..."
                className="w-full h-full p-3 border-0 outline-none resize-none bg-[var(--bg-light)] text-[var(--text)]"
                style={{
                  fontFamily: 'monospace',
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: '1.5',
                }}
              />
            </div>
          </div>
        )}

        {/* Preview Panel */}
        {showPreview && (
          <div
            className={`overflow-auto px-6 py-4 bg-[var(--bg)] ${
              showEditor ? 'flex-1' : 'flex-[2]'
            }`}
          >
            <div className="markdown-content">
              <MarkdownContent content={content || '*No content to preview*'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
