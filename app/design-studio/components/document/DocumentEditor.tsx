/**
 * Document Editor Component
 *
 * A markdown-based document editor with live preview and line numbers.
 * Supports split view, edit-only, and preview-only modes.
 */

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LuEye, LuPencil, LuColumns2 } from 'react-icons/lu';
import { Button } from '~/core/components/ui/Button';

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

      // Restore cursor position after React updates
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const lineNumbers = getLineNumbers(content);
  const showEditor = viewMode === 'edit' || viewMode === 'split';
  const showPreview = viewMode === 'preview' || viewMode === 'split';

  return (
    <div className="flex flex-col w-full" style={{ height }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="text-sm font-medium text-[var(--text-secondary)]">
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
                fontSize: '14px',
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
                className="w-full h-full p-3 border-0 outline-none resize-none bg-[var(--bg)] text-[var(--text)]"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
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
            <div className="markdown-preview">
              <style>{`
                .markdown-preview h1 {
                  font-size: 2em;
                  font-weight: bold;
                  margin-bottom: 0.5em;
                  margin-top: 0.5em;
                  border-bottom: 1px solid var(--border);
                  padding-bottom: 0.25em;
                  color: var(--text);
                }
                .markdown-preview h2 {
                  font-size: 1.5em;
                  font-weight: bold;
                  margin-bottom: 0.5em;
                  margin-top: 1em;
                  border-bottom: 1px solid var(--border);
                  padding-bottom: 0.25em;
                  color: var(--text);
                }
                .markdown-preview h3 {
                  font-size: 1.25em;
                  font-weight: bold;
                  margin-bottom: 0.5em;
                  margin-top: 1em;
                  color: var(--text);
                }
                .markdown-preview h4,
                .markdown-preview h5,
                .markdown-preview h6 {
                  font-size: 1em;
                  font-weight: bold;
                  margin-bottom: 0.5em;
                  margin-top: 1em;
                  color: var(--text);
                }
                .markdown-preview p {
                  margin-bottom: 1em;
                  line-height: 1.6;
                  color: var(--text);
                }
                .markdown-preview ul,
                .markdown-preview ol {
                  margin-bottom: 1em;
                  padding-left: 2em;
                  color: var(--text);
                }
                .markdown-preview li {
                  margin-bottom: 0.25em;
                }
                .markdown-preview code {
                  background-color: var(--surface);
                  padding: 0.2em 0.4em;
                  border-radius: 3px;
                  font-family: monospace;
                  font-size: 0.9em;
                  color: var(--text);
                }
                .markdown-preview pre {
                  background-color: var(--surface);
                  padding: 1em;
                  border-radius: 6px;
                  overflow: auto;
                  margin-bottom: 1em;
                }
                .markdown-preview pre code {
                  background-color: transparent;
                  padding: 0;
                }
                .markdown-preview blockquote {
                  border-left: 4px solid var(--border);
                  padding-left: 1em;
                  margin-left: 0;
                  margin-bottom: 1em;
                  color: var(--text-secondary);
                }
                .markdown-preview table {
                  border-collapse: collapse;
                  width: 100%;
                  margin-bottom: 1em;
                }
                .markdown-preview th,
                .markdown-preview td {
                  border: 1px solid var(--border);
                  padding: 0.5em;
                  text-align: left;
                  color: var(--text);
                }
                .markdown-preview th {
                  background-color: var(--surface);
                  font-weight: bold;
                }
                .markdown-preview a {
                  color: var(--primary);
                  text-decoration: underline;
                }
                .markdown-preview img {
                  max-width: 100%;
                  height: auto;
                }
                .markdown-preview hr {
                  border: none;
                  border-top: 1px solid var(--border);
                  margin: 2em 0;
                }
              `}</style>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*No content to preview*'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
