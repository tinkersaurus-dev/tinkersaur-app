/**
 * Folder Editor Component
 *
 * A read-only view of compiled folder content (diagrams + documents)
 * with a tabbed panel for LLM-generated output (User Stories, User Documentation).
 */

import { useRef, useState } from 'react';
import { LuSparkles, LuCopy } from 'react-icons/lu';
import { Tabs } from '~/core/components/ui';
import { Button } from '~/core/components/ui/Button';
import { generateUserStories } from '../../lib/llm/user-stories-generator-api';
import { generateUserDocs } from '../../lib/llm/user-docs-generator-api';

export interface FolderEditorProps {
  content: string;
  height?: string;
}

/**
 * Calculate line numbers for the content
 */
function getLineNumbers(content: string): number[] {
  const lines = content.split('\n');
  return Array.from({ length: lines.length }, (_, i) => i + 1);
}

/**
 * Folder Editor Component
 */
export function FolderEditor({ content, height = '100%' }: FolderEditorProps) {
  const [activeTab, setActiveTab] = useState('user-stories');
  const contentRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // User stories generation state
  const [userStories, setUserStories] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // User documentation generation state
  const [userDocs, setUserDocs] = useState<string>('');
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  // Sync scroll between line numbers and content
  const handleScroll = () => {
    if (contentRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = contentRef.current.scrollTop;
    }
  };

  const handleGenerateUserStories = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const stories = await generateUserStories(content);
      setUserStories(stories);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyUserStories = async () => {
    if (userStories) {
      await navigator.clipboard.writeText(userStories);
    }
  };

  const handleGenerateUserDocs = async () => {
    setIsGeneratingDocs(true);
    setDocsError(null);
    try {
      const docs = await generateUserDocs(content);
      setUserDocs(docs);
    } catch (err) {
      setDocsError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGeneratingDocs(false);
    }
  };

  const handleCopyUserDocs = async () => {
    if (userDocs) {
      await navigator.clipboard.writeText(userDocs);
    }
  };

  const lineNumbers = getLineNumbers(content);

  const rightPanelTabs = [
    {
      key: 'user-stories',
      label: 'User Stories',
      children: (
        <div className="h-full flex flex-col overflow-hidden bg-[var(--bg)]">
          {/* Button Group */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
            <Button
              variant="primary"
              size="small"
              icon={<LuSparkles />}
              onClick={handleGenerateUserStories}
              loading={isGenerating}
              disabled={isGenerating || !content}
            >
              Generate
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuCopy />}
              onClick={handleCopyUserStories}
              disabled={!userStories}
            >
              Copy
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            {isGenerating ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Generating user stories...
              </div>
            ) : generateError ? (
              <div className="p-4 text-[var(--danger)]">
                <strong>Error:</strong> {generateError}
              </div>
            ) : userStories ? (
              <pre
                className="p-4 m-0 bg-[var(--bg-light)] text-[var(--text)] h-full"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                {userStories}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                Click "Generate" to create user stories from the folder content.
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'user-documentation',
      label: 'User Documentation',
      children: (
        <div className="h-full flex flex-col overflow-hidden bg-[var(--bg)]">
          {/* Button Group */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
            <Button
              variant="primary"
              size="small"
              icon={<LuSparkles />}
              onClick={handleGenerateUserDocs}
              loading={isGeneratingDocs}
              disabled={isGeneratingDocs || !content}
            >
              Generate
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuCopy />}
              onClick={handleCopyUserDocs}
              disabled={!userDocs}
            >
              Copy
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            {isGeneratingDocs ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Generating user documentation...
              </div>
            ) : docsError ? (
              <div className="p-4 text-[var(--danger)]">
                <strong>Error:</strong> {docsError}
              </div>
            ) : userDocs ? (
              <pre
                className="p-4 m-0 bg-[var(--bg-light)] text-[var(--text)] h-full"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                {userDocs}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                Click "Generate" to create user documentation from the folder content.
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full" style={{ height }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="text-xs font-medium text-[var(--text)]">Folder Content</div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Raw Markdown (Read-only) */}
        <div className="flex-1 flex overflow-hidden border-r border-[var(--border)]">
          {/* Line Numbers */}
          <div
            ref={lineNumbersRef}
            className="w-[50px] bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden text-right pr-2 pt-3 select-none"
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
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

          {/* Raw Markdown Content */}
          <pre
            ref={contentRef}
            onScroll={handleScroll}
            className="flex-1 overflow-auto p-3 m-0 bg-[var(--bg-light)] text-[var(--text)]"
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {content}
          </pre>
        </div>

        {/* Right Panel - LLM Output Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs
            type="line"
            activeKey={activeTab}
            onChange={setActiveTab}
            items={rightPanelTabs}
            hideAdd
            style={{ height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
