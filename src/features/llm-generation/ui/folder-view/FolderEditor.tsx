/**
 * Folder Editor Component
 *
 * A read-only view of compiled folder content (diagrams + documents)
 * with a tabbed panel for LLM-generated output (User Stories, User Documentation).
 */

import { useState, useCallback } from 'react';
import { LuSparkles, LuCopy } from 'react-icons/lu';
import { MarkdownContent, Tabs } from '@/shared/ui';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/shared/auth';
import {
  generateUserStories,
  generateUserDocsStructured,
  generateTechSpecStructured,
  userDocumentsToMarkdown,
  techSpecSectionsToMarkdown,
  type UserStory,
  type UserDocument,
  type TechSpecSection,
} from '@/features/llm-generation';
import { UserStoriesPanel } from './panels/UserStoriesPanel';
import { UserDocsPanel } from './panels/UserDocsPanel';
import { TechSpecPanel } from './panels/TechSpecPanel';
import { useAsyncGeneration } from '../../lib/useAsyncGeneration';

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
 * Folder Editor Component
 */
export function FolderEditor({ content, height = '100%' }: FolderEditorProps) {
  const [activeTab, setActiveTab] = useState('context');
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId ?? '');

  // Async generation hooks for LLM operations
  const userStoriesGen = useAsyncGeneration<UserStory>({
    generatorFn: useCallback(() => generateUserStories(content, teamId), [content, teamId]),
  });

  const userDocsGen = useAsyncGeneration<UserDocument>({
    generatorFn: useCallback(() => generateUserDocsStructured(content, teamId), [content, teamId]),
  });

  const techSpecGen = useAsyncGeneration<TechSpecSection>({
    generatorFn: useCallback(() => generateTechSpecStructured(content, teamId), [content, teamId]),
  });

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

  const tabs = [
    {
      key: 'context',
      label: 'Context',
      children: (
        <div className="h-full flex flex-col overflow-hidden bg-[var(--bg)]">
          {/* Toolbar placeholder for future actions */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]" />
          {/* Rendered markdown content */}
          <div className="flex-1 overflow-auto p-4 bg-[var(--bg-light)]">
            <div className="markdown-content markdown-content--compact">
              <MarkdownContent content={content} />
            </div>
          </div>
        </div>
      ),
    },
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
      {/* Main Content Area - Full-width Tabs */}
      <Tabs
        type="line"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabs}
        hideAdd
        style={{ height: '100%' }}
      />
    </div>
  );
}
