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
import { generateUserDocsStructured } from '../../lib/llm/user-docs-generator-api';
import { generateTechSpecStructured } from '../../lib/llm/tech-spec-generator-api';
import { UserStoriesPanel } from './UserStoriesPanel';
import { UserDocsPanel } from './UserDocsPanel';
import { TechSpecPanel } from './TechSpecPanel';
import type { UserStory, UserDocument, TechSpecSection } from '../../lib/llm/types';
import { userStoriesToMarkdown, userDocumentsToMarkdown, techSpecSectionsToMarkdown } from '../../lib/llm/types';

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
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // User documentation generation state
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  // Technical specification generation state
  const [techSpecSections, setTechSpecSections] = useState<TechSpecSection[]>([]);
  const [isGeneratingTechSpec, setIsGeneratingTechSpec] = useState(false);
  const [techSpecError, setTechSpecError] = useState<string | null>(null);

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
    if (userStories.length > 0) {
      const markdown = userStoriesToMarkdown(userStories);
      await navigator.clipboard.writeText(markdown);
    }
  };

  const handleStoriesChange = (newStories: UserStory[]) => {
    setUserStories(newStories);
  };

  const handleGenerateUserDocs = async () => {
    setIsGeneratingDocs(true);
    setDocsError(null);
    try {
      const documents = await generateUserDocsStructured(content);
      setUserDocuments(documents);
    } catch (err) {
      setDocsError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGeneratingDocs(false);
    }
  };

  const handleCopyAllUserDocs = async () => {
    if (userDocuments.length > 0) {
      const markdown = userDocumentsToMarkdown(userDocuments);
      await navigator.clipboard.writeText(markdown);
    }
  };

  const handleDocumentsChange = (newDocuments: UserDocument[]) => {
    setUserDocuments(newDocuments);
  };

  const handleGenerateTechSpec = async () => {
    setIsGeneratingTechSpec(true);
    setTechSpecError(null);
    try {
      const sections = await generateTechSpecStructured(content);
      setTechSpecSections(sections);
    } catch (err) {
      setTechSpecError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGeneratingTechSpec(false);
    }
  };

  const handleCopyAllTechSpec = async () => {
    if (techSpecSections.length > 0) {
      const markdown = techSpecSectionsToMarkdown(techSpecSections);
      await navigator.clipboard.writeText(markdown);
    }
  };

  const handleTechSpecChange = (newSections: TechSpecSection[]) => {
    setTechSpecSections(newSections);
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
              disabled={userStories.length === 0}
            >
              Copy
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden bg-[var(--bg-light)]">
            {isGenerating ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Generating user stories...
              </div>
            ) : generateError ? (
              <div className="p-4 text-[var(--danger)]">
                <strong>Error:</strong> {generateError}
              </div>
            ) : (
              <UserStoriesPanel
                initialStories={userStories}
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
              onClick={handleCopyAllUserDocs}
              disabled={userDocuments.length === 0}
            >
              Copy All
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden bg-[var(--bg-light)]">
            {isGeneratingDocs ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Generating user documentation...
              </div>
            ) : docsError ? (
              <div className="p-4 text-[var(--danger)]">
                <strong>Error:</strong> {docsError}
              </div>
            ) : (
              <UserDocsPanel
                initialDocuments={userDocuments}
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
              onClick={handleGenerateTechSpec}
              loading={isGeneratingTechSpec}
              disabled={isGeneratingTechSpec || !content}
            >
              Generate
            </Button>
            <Button
              variant="default"
              size="small"
              icon={<LuCopy />}
              onClick={handleCopyAllTechSpec}
              disabled={techSpecSections.length === 0}
            >
              Copy All
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden bg-[var(--bg-light)]">
            {isGeneratingTechSpec ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Generating technical specification...
              </div>
            ) : techSpecError ? (
              <div className="p-4 text-[var(--danger)]">
                <strong>Error:</strong> {techSpecError}
              </div>
            ) : (
              <TechSpecPanel
                initialSections={techSpecSections}
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
