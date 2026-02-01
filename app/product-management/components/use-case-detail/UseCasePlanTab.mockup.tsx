/**
 * Plan Tab MOCKUP for Use Case Detail Page
 *
 * PURPOSE: Visual mockup only - not functional implementation
 * This shows a proposed UI for generating agile epics and stories from use case versions,
 * with drag-and-drop prioritization that cascades to epics and stories.
 *
 * Key Features:
 * 1. Select use case versions to include in planning
 * 2. Generate epics and user stories for selected versions
 * 3. Drag-and-drop prioritization of versions (cascades to epics/stories)
 * 4. View generated epics and stories in an organized hierarchy
 */

import { useState } from 'react';
import {
  FiChevronDown,
  FiChevronRight,
  FiPlus,
  FiRefreshCw,
  FiMove,
  FiFileText,
  FiLayers,
  FiCopy,
  FiDownload,
  FiInfo,
  FiEdit2,
  FiCheck,
} from 'react-icons/fi';
import { Button, Card, Tag, HStack } from '@/shared/ui';

// =============================================================================
// MOCKUP DATA - Shows what real data might look like
// =============================================================================

interface MockVersion {
  id: string;
  versionNumber: number;
  versionName: string;
  useCaseName: string;
  status: string;
  priority: number;
  selected: boolean;
}

interface MockAcceptanceCriteria {
  id: string;
  text: string;
}

interface MockStory {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'pending' | 'generated';
  acceptanceCriteria: MockAcceptanceCriteria[];
  expanded?: boolean;
}

interface MockEpic {
  id: string;
  versionId: string;
  title: string;
  description: string;
  stories: MockStory[];
  expanded: boolean;
  status: 'pending' | 'generating' | 'generated';
}

const mockVersions: MockVersion[] = [
  { id: 'v1', versionNumber: 1, versionName: 'MVP Release', useCaseName: 'User Authentication', status: 'Approved', priority: 1, selected: true },
  { id: 'v2', versionNumber: 2, versionName: 'Phase 2 - Analytics', useCaseName: 'Dashboard Analytics', status: 'Approved', priority: 2, selected: true },
  { id: 'v3', versionNumber: 3, versionName: 'Phase 3 - Integrations', useCaseName: 'Third-Party Integrations', status: 'Drafted', priority: 3, selected: false },
  { id: 'v4', versionNumber: 4, versionName: 'Phase 4 - Mobile', useCaseName: 'Mobile App Support', status: 'Drafted', priority: 4, selected: false },
];

const mockEpics: MockEpic[] = [
  {
    id: 'e1',
    versionId: 'v1',
    title: 'User Authentication & Onboarding',
    description: 'Enable users to securely sign up, log in, and complete initial profile setup. This epic covers the complete authentication flow including registration, login, password recovery, and the initial onboarding experience that guides new users through profile completion.',
    expanded: true,
    status: 'generated',
    stories: [
      {
        id: 's1',
        title: 'As a user, I can sign up with email and password',
        description: 'New users should be able to create an account using their email address and a secure password.',
        points: 3,
        status: 'generated',
        expanded: true,
        acceptanceCriteria: [
          { id: 'ac1', text: 'Email format is validated before submission' },
          { id: 'ac2', text: 'Password must be at least 8 characters with one uppercase and one number' },
          { id: 'ac3', text: 'Duplicate email addresses are rejected with clear error message' },
          { id: 'ac4', text: 'Confirmation email is sent upon successful registration' },
        ],
      },
      {
        id: 's2',
        title: 'As a user, I can log in with my credentials',
        description: 'Registered users can securely access their account using email and password.',
        points: 2,
        status: 'generated',
        acceptanceCriteria: [
          { id: 'ac5', text: 'Invalid credentials show appropriate error message' },
          { id: 'ac6', text: 'Account locks after 5 failed attempts' },
          { id: 'ac7', text: 'Session persists across browser refreshes' },
        ],
      },
      {
        id: 's3',
        title: 'As a user, I can reset my password via email',
        description: 'Users who forgot their password can request a reset link sent to their registered email.',
        points: 3,
        status: 'generated',
        acceptanceCriteria: [
          { id: 'ac8', text: 'Reset link expires after 24 hours' },
          { id: 'ac9', text: 'Link can only be used once' },
          { id: 'ac10', text: 'User is notified of successful password change' },
        ],
      },
      {
        id: 's4',
        title: 'As a user, I can complete my profile during onboarding',
        description: 'New users are guided through a multi-step onboarding flow to complete their profile.',
        points: 5,
        status: 'generated',
        acceptanceCriteria: [
          { id: 'ac11', text: 'Progress indicator shows current step' },
          { id: 'ac12', text: 'Users can skip optional fields' },
          { id: 'ac13', text: 'Profile photo upload supports JPG and PNG formats' },
          { id: 'ac14', text: 'Data is saved between steps' },
          { id: 'ac15', text: 'Completion triggers welcome email' },
        ],
      },
    ],
  },
  {
    id: 'e2',
    versionId: 'v1',
    title: 'Core Dashboard Experience',
    description: 'Provide users with an intuitive dashboard to view key metrics and navigate features. The dashboard serves as the central hub for users to monitor their activity, access quick actions, and customize their view.',
    expanded: false,
    status: 'generated',
    stories: [
      {
        id: 's5',
        title: 'As a user, I can view my dashboard with key metrics',
        description: 'Users see an overview of their most important metrics and recent activity upon login.',
        points: 5,
        status: 'generated',
        acceptanceCriteria: [
          { id: 'ac16', text: 'Dashboard loads within 2 seconds' },
          { id: 'ac17', text: 'Key metrics are displayed prominently' },
          { id: 'ac18', text: 'Recent activity shows last 10 items' },
        ],
      },
      {
        id: 's6',
        title: 'As a user, I can customize which widgets appear on my dashboard',
        description: 'Users can add, remove, and rearrange dashboard widgets to personalize their experience.',
        points: 8,
        status: 'generated',
        acceptanceCriteria: [
          { id: 'ac19', text: 'Drag and drop to reorder widgets' },
          { id: 'ac20', text: 'At least 6 widget types available' },
          { id: 'ac21', text: 'Layout persists across sessions' },
          { id: 'ac22', text: 'Reset to default option available' },
        ],
      },
      {
        id: 's7',
        title: 'As a user, I can navigate to all major features from the dashboard',
        description: 'Quick access links and navigation elements allow users to reach any feature.',
        points: 3,
        status: 'generated',
        acceptanceCriteria: [
          { id: 'ac23', text: 'All main features accessible within 2 clicks' },
          { id: 'ac24', text: 'Quick actions panel visible' },
        ],
      },
    ],
  },
  {
    id: 'e3',
    versionId: 'v2',
    title: 'Analytics & Reporting',
    description: 'Enable users to track usage patterns and generate insights from their data. This epic provides comprehensive analytics tools including visualizations, filtering, and export capabilities.',
    expanded: false,
    status: 'generating',
    stories: [
      {
        id: 's8',
        title: 'As a user, I can view usage analytics over time',
        description: 'Interactive charts show usage trends with customizable date ranges.',
        points: 5,
        status: 'pending',
        acceptanceCriteria: [
          { id: 'ac25', text: 'Line and bar chart options available' },
          { id: 'ac26', text: 'Date range picker supports custom ranges' },
          { id: 'ac27', text: 'Data updates in real-time' },
        ],
      },
      {
        id: 's9',
        title: 'As a user, I can export reports in PDF format',
        description: 'Users can generate and download formatted PDF reports of their analytics data.',
        points: 3,
        status: 'pending',
        acceptanceCriteria: [
          { id: 'ac28', text: 'PDF includes all visible charts' },
          { id: 'ac29', text: 'Company branding applied to exports' },
        ],
      },
    ],
  },
];

// =============================================================================
// MOCKUP COMPONENT
// =============================================================================

export function UseCasePlanTabMockup() {
  // Local state for interactivity demo
  const [versions, setVersions] = useState(mockVersions);
  const [epics, setEpics] = useState(mockEpics);
  const [draggedVersion, setDraggedVersion] = useState<string | null>(null);

  const totalPoints = epics
    .filter(e => e.status === 'generated')
    .flatMap(e => e.stories)
    .reduce((sum, s) => sum + s.points, 0);
  const totalStories = epics
    .filter(e => e.status === 'generated')
    .flatMap(e => e.stories).length;

  const toggleEpicExpanded = (id: string) => {
    setEpics(prev => prev.map(e =>
      e.id === id ? { ...e, expanded: !e.expanded } : e
    ));
  };

  const toggleStoryExpanded = (epicId: string, storyId: string) => {
    setEpics(prev => prev.map(e =>
      e.id === epicId
        ? {
            ...e,
            stories: e.stories.map(s =>
              s.id === storyId ? { ...s, expanded: !s.expanded } : s
            ),
          }
        : e
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'green';
      case 'Drafted': return 'blue';
      case 'Rejected': return 'red';
      default: return 'default';
    }
  };

  return (
    <div className="pt-4 h-[calc(90vh-160px)]">
      <div className="grid grid-cols-12 gap-4 h-full">

        {/* ================================================================= */}
        {/* LEFT PANEL: Version Prioritization */}
        {/* ================================================================= */}
        <div className="col-span-4 h-full overflow-hidden flex flex-col">
          <Card className="flex-1 flex flex-col" contentClassName="p-0 flex flex-col flex-1">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border-muted)] bg-[var(--bg)]">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  Version Prioritization
                </h3>
                <FiInfo
                  size={14}
                  className="text-[var(--text-muted)]"
                  title="Drag to reorder priority"
                />
              </div>
            </div>

            {/* Version List - Draggable */}
            <div className="flex-1 overflow-auto p-2">
              {versions.map((version, index) => {
                const versionEpics = epics.filter(e => e.versionId === version.id);
                const hasStories = versionEpics.some(e => e.stories.length > 0);

                return (
                  <div
                    key={version.id}
                    draggable
                    onDragStart={() => setDraggedVersion(version.id)}
                    onDragEnd={() => setDraggedVersion(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedVersion && draggedVersion !== version.id) {
                        // Reorder logic would go here
                        const draggedIdx = versions.findIndex(v => v.id === draggedVersion);
                        const newVersions = [...versions];
                        const [removed] = newVersions.splice(draggedIdx, 1);
                        newVersions.splice(index, 0, removed);
                        // Update priorities
                        setVersions(newVersions.map((v, i) => ({ ...v, priority: i + 1 })));
                      }
                    }}
                    className={`
                      mb-2 px-3 py-2 rounded border cursor-grab active:cursor-grabbing
                      transition-all duration-150
                      border-[var(--border-muted)] bg-[var(--bg-light)]
                      ${draggedVersion === version.id ? 'opacity-50 scale-95' : ''}
                      hover:border-[var(--primary)]
                    `}
                  >
                    <div className="flex items-start gap-2">
                      {/* Drag Handle */}
                      <FiMove className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />

                      {/* Priority Badge */}
                      <div className="w-5 h-5 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] flex-shrink-0">
                        {version.priority}
                      </div>

                      {/* Version Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[var(--text-muted)]">
                            v{version.versionNumber}
                          </span>
                          <span className="font-medium text-sm text-[var(--text)] truncate">
                            {version.versionName}
                          </span>
                          <Tag color={getStatusColor(version.status)} className="flex-shrink-0 ml-auto">
                            {version.status}
                          </Tag>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-[var(--text-muted)] truncate">
                            {version.useCaseName}
                          </span>
                          {!hasStories ? (
                            <Button
                              variant="primary"
                              size="small"
                              icon={<FiPlus />}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Generate
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] flex-shrink-0 ml-2">
                              <span className="flex items-center gap-1">
                                <FiLayers size={11} />
                                {versionEpics.length}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiFileText size={11} />
                                {versionEpics.flatMap(e => e.stories).length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ================================================================= */}
        {/* RIGHT PANEL: Generated Epics & Stories */}
        {/* ================================================================= */}
        <div className="col-span-8 h-full overflow-hidden flex flex-col">
          <Card className="flex-1 flex flex-col" contentClassName="p-0 flex flex-col flex-1">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border-muted)] bg-[var(--bg)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  Epics & User Stories
                </h3>
                <Button variant="default" size="small" icon={<FiDownload />}>
                  Export
                </Button>
              </div>
            </div>

            {/* Epics List */}
            <div className="flex-1 overflow-auto">
              <div className="p-4 space-y-3">
                {versions.map(version => {
                  const versionEpics = epics.filter(e => e.versionId === version.id);
                  const hasStories = versionEpics.some(e => e.stories.length > 0);

                  return (
                    <div key={version.id} className="space-y-2">
                      {/* Version Group Header */}
                      <div className="flex items-center gap-2 py-2 border-b border-[var(--border-muted)]">
                        <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-xs font-bold text-white">
                          {version.priority}
                        </div>
                        <span className="text-xs font-mono text-[var(--text-muted)]">v{version.versionNumber}</span>
                        <span className="font-semibold text-[var(--text)]">{version.versionName}</span>
                        <Tag color={getStatusColor(version.status)} className="ml-auto">
                          {version.status}
                        </Tag>
                      </div>

                      {/* Epics for this version */}
                      {!hasStories ? (
                        <div className="ml-7 py-4 text-sm text-[var(--text-muted)] italic">
                          No stories created yet
                        </div>
                      ) : (
                        versionEpics.map(epic => (
                          <div
                            key={epic.id}
                            className="ml-7 border border-[var(--border-muted)] rounded bg-[var(--bg-light)]"
                          >
                            {/* Epic Header */}
                            <div
                              className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[var(--bg)]"
                              onClick={() => toggleEpicExpanded(epic.id)}
                            >
                              {epic.expanded ? (
                                <FiChevronDown className="text-[var(--text-muted)]" />
                              ) : (
                                <FiChevronRight className="text-[var(--text-muted)]" />
                              )}

                              <FiLayers className="text-[var(--primary)]" />

                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-[var(--text)] truncate">
                                  {epic.title}
                                </div>
                                <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                                  {epic.description}
                                </div>
                              </div>

                              {epic.status === 'generating' ? (
                                <div className="flex items-center gap-2 text-xs text-[var(--primary)]">
                                  <FiRefreshCw className="animate-spin" />
                                  Generating...
                                </div>
                              ) : (
                                <HStack gap="sm">
                                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                    <span>{epic.stories.length} stories</span>
                                    <span className="font-medium">
                                      {epic.stories.reduce((sum, s) => sum + s.points, 0)} pts
                                    </span>
                                  </div>
                                  <Button
                                    variant="text"
                                    size="small"
                                    icon={<FiEdit2 />}
                                    onClick={(e) => e.stopPropagation()}
                                    title="Edit epic"
                                  />
                                  <Button
                                    variant="text"
                                    size="small"
                                    icon={<FiCopy />}
                                    onClick={(e) => e.stopPropagation()}
                                    title="Copy epic"
                                  />
                                </HStack>
                              )}
                            </div>

                            {/* Stories (Expanded) */}
                            {epic.expanded && epic.status === 'generated' && (
                              <div className="border-t border-[var(--border-muted)]">
                                {epic.stories.map((story, storyIndex) => (
                                  <div
                                    key={story.id}
                                    className={`
                                      ${storyIndex < epic.stories.length - 1 ? 'border-b border-[var(--border-muted)]' : ''}
                                    `}
                                  >
                                    {/* Story Header Row */}
                                    <div
                                      className="px-4 py-2 flex items-center gap-3 text-sm hover:bg-[var(--bg)] cursor-pointer"
                                      onClick={() => toggleStoryExpanded(epic.id, story.id)}
                                    >
                                      {story.expanded ? (
                                        <FiChevronDown className="text-[var(--text-muted)] flex-shrink-0" size={14} />
                                      ) : (
                                        <FiChevronRight className="text-[var(--text-muted)] flex-shrink-0" size={14} />
                                      )}
                                      <div className="w-5 h-5 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
                                        {storyIndex + 1}
                                      </div>
                                      <FiFileText className="text-[var(--text-muted)] flex-shrink-0" />
                                      <span className="flex-1 text-[var(--text)]">{story.title}</span>
                                      {!story.expanded && story.acceptanceCriteria.length > 0 && (
                                        <span className="text-xs text-[var(--text-muted)]">
                                          {story.acceptanceCriteria.length} criteria
                                        </span>
                                      )}
                                      <Tag color="blue">{story.points} pts</Tag>
                                      <Button
                                        variant="text"
                                        size="small"
                                        icon={<FiEdit2 />}
                                        onClick={(e) => e.stopPropagation()}
                                        title="Edit story"
                                      />
                                      <Button
                                        variant="text"
                                        size="small"
                                        icon={<FiCopy />}
                                        onClick={(e) => e.stopPropagation()}
                                        title="Copy story"
                                      />
                                    </div>

                                    {/* Acceptance Criteria (Expanded) */}
                                    {story.expanded && (
                                      <div className="pl-16 pr-4 pb-3 bg-[var(--bg)]">
                                        {story.description && (
                                          <p className="text-sm text-[var(--text-muted)] mb-2">
                                            {story.description}
                                          </p>
                                        )}
                                        <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                                          Acceptance Criteria
                                        </div>
                                        <ul className="space-y-1">
                                          {story.acceptanceCriteria.map((ac) => (
                                            <li key={ac.id} className="flex items-start gap-2 text-sm text-[var(--text)]">
                                              <FiCheck className="text-green-500 flex-shrink-0 mt-0.5" size={14} />
                                              <span>{ac.text}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {/* Add story button */}
                                <div className="px-4 py-2 border-t border-dashed border-[var(--border-muted)]">
                                  <Button variant="text" size="small" icon={<FiPlus />} className="text-[var(--text-muted)]">
                                    Add Story
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Footer */}
            <div className="px-4 py-3 border-t border-[var(--border-muted)] bg-[var(--bg)]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">
                  {versions.length} versions
                </span>
                <div className="flex items-center gap-4 text-[var(--text)]">
                  <span>{totalStories} stories</span>
                  <span className="font-semibold">{totalPoints} points</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
