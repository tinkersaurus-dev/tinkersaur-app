/**
 * Folder Editor Component
 *
 * A read-only view of compiled folder content (diagrams + documents)
 * with a tabbed panel for LLM-generated output (User Stories, User Documentation).
 */

import { useRef, useState, useCallback, useMemo } from 'react';
import { LuSparkles, LuCopy } from 'react-icons/lu';
import { Tabs } from '~/core/components/ui';
import { Button } from '~/core/components/ui/Button';
import { generateUserStories } from '../../lib/llm/user-stories-generator-api';
import { generateUserDocsStructured } from '../../lib/llm/user-docs-generator-api';
import { generateTechSpecStructured } from '../../lib/llm/tech-spec-generator-api';
import { UserStoriesPanel } from './UserStoriesPanel';
import { UserDocsPanel } from './UserDocsPanel';
import { TechSpecPanel } from './TechSpecPanel';
import type { UserStory, UserDocument, TechSpecSection } from '../../lib/llm/types';
import { userDocumentsToMarkdown, techSpecSectionsToMarkdown } from '../../lib/llm/types';
import { useAsyncGeneration } from '../../hooks';

/**
 * Convert user stories to markdown for clipboard copy
 * Stories are already markdown content, just join them with separators
 */
function userStoriesToMarkdown(stories: UserStory[]): string {
  return stories.map((story) => story.content).join('\n\n----\n\n');
}

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

  // Async generation hooks for LLM operations
  const userStoriesGen = useAsyncGeneration<UserStory>({
    generatorFn: useCallback(() => generateUserStories(content), [content]),
  });

  const userDocsGen = useAsyncGeneration<UserDocument>({
    generatorFn: useCallback(() => generateUserDocsStructured(content), [content]),
  });

  const techSpecGen = useAsyncGeneration<TechSpecSection>({
    generatorFn: useCallback(() => generateTechSpecStructured(content), [content]),
  });

  // Sync scroll between line numbers and content
  const handleScroll = () => {
    if (contentRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = contentRef.current.scrollTop;
    }
  };

  const handleCopyUserStories = async () => {
    if (userStoriesGen.data.length > 0) {
      const markdown = userStoriesToMarkdown(userStoriesGen.data);
      await navigator.clipboard.writeText(markdown);
    }
  };

  const handleStoriesChange = (newStories: UserStory[]) => {
    userStoriesGen.setData(newStories);
  };

  const handleCopyAllUserDocs = async () => {
    if (userDocsGen.data.length > 0) {
      const markdown = userDocumentsToMarkdown(userDocsGen.data);
      await navigator.clipboard.writeText(markdown);
    }
  };

  const handleDocumentsChange = (newDocuments: UserDocument[]) => {
    userDocsGen.setData(newDocuments);
  };

  const handleCopyAllTechSpec = async () => {
    if (techSpecGen.data.length > 0) {
      const markdown = techSpecSectionsToMarkdown(techSpecGen.data);
      await navigator.clipboard.writeText(markdown);
    }
  };

  const handleTechSpecChange = (newSections: TechSpecSection[]) => {
    techSpecGen.setData(newSections);
  };

  const lineNumbers = useMemo(() => getLineNumbers(content), [content]);

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
              onClick={userStoriesGen.generate}
              loading={userStoriesGen.isLoading}
              disabled={userStoriesGen.isLoading || !content}
            >
              Generate
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuCopy />}
              onClick={handleCopyUserStories}
              disabled={userStoriesGen.data.length === 0}
            >
              Copy
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden bg-[var(--bg-light)]">
            {userStoriesGen.isLoading ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Generating user stories...
              </div>
            ) : userStoriesGen.error ? (
              <div className="p-4 text-[var(--danger)]">
                <strong>Error:</strong> {userStoriesGen.error}
              </div>
            ) : (
              <UserStoriesPanel
                initialStories={userStoriesGen.data}
                folderContent={content}
                onStoriesChange={handleStoriesChange}
              />
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
              onClick={userDocsGen.generate}
              loading={userDocsGen.isLoading}
              disabled={userDocsGen.isLoading || !content}
            >
              Generate
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuCopy />}
              onClick={handleCopyAllUserDocs}
              disabled={userDocsGen.data.length === 0}
            >
              Copy All
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden bg-[var(--bg-light)]">
            {userDocsGen.isLoading ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Generating user documentation...
              </div>
            ) : userDocsGen.error ? (
              <div className="p-4 text-[var(--danger)]">
                <strong>Error:</strong> {userDocsGen.error}
              </div>
            ) : (
              <UserDocsPanel
                initialDocuments={userDocsGen.data}
                folderContent={content}
                onDocumentsChange={handleDocumentsChange}
              />
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'tech-spec',
      label: 'Tech Spec',
      children: (
        <div className="h-full flex flex-col overflow-hidden bg-[var(--bg)]">
          {/* Button Group */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
            <Button
              variant="primary"
              size="small"
              icon={<LuSparkles />}
              onClick={techSpecGen.generate}
              loading={techSpecGen.isLoading}
              disabled={techSpecGen.isLoading || !content}
            >
              Generate
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuCopy />}
              onClick={handleCopyAllTechSpec}
              disabled={techSpecGen.data.length === 0}
            >
              Copy All
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden bg-[var(--bg-light)]">
            {techSpecGen.isLoading ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Generating technical specification...
              </div>
            ) : techSpecGen.error ? (
              <div className="p-4 text-[var(--danger)]">
                <strong>Error:</strong> {techSpecGen.error}
              </div>
            ) : (
              <TechSpecPanel
                initialSections={techSpecGen.data}
                folderContent={content}
                onSectionsChange={handleTechSpecChange}
              />
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
