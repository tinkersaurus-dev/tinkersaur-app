/**
 * User Story Card Component
 *
 * Displays a single user story as a selectable card with checkbox.
 * Renders story content as markdown with compact styling.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LuChevronUp, LuChevronDown } from 'react-icons/lu';
import type { UserStory } from '../../lib/llm/types';

export interface UserStoryCardProps {
  story: UserStory;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

/**
 * Convert a UserStory to markdown for rendering
 */
function storyToMarkdown(story: UserStory): string {
  let md = `### ${story.title}\n\n`;
  md += `${story.story}\n\n`;
  md += `#### Acceptance Criteria\n\n`;

  story.acceptanceCriteria.forEach((ac, index) => {
    md += `${index + 1}. ${ac}\n`;
  });

  return md;
}

export function UserStoryCard({
  story,
  selected,
  onSelect,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}: UserStoryCardProps) {
  const handleCheckboxChange = () => {
    onSelect(story.id, !selected);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle selection if clicking on the reorder buttons
    if ((e.target as HTMLElement).closest('[data-reorder-button]')) {
      return;
    }
    onSelect(story.id, !selected);
  };

  const markdown = storyToMarkdown(story);

  return (
    <div
      className={`
        relative border rounded-sm transition-all duration-150 cursor-pointer
        ${selected
          ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_5%,var(--bg-light))]'
          : 'border-[var(--border-muted)] bg-[var(--bg-light)] hover:border-[var(--border)]'
        }
      `}
      onClick={handleCardClick}
    >
      {/* Header with checkbox and reorder buttons */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-muted)]">
        {/* Checkbox */}
        <label
          className="flex items-center gap-2 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`
              w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-all
              ${selected
                ? 'bg-[var(--primary)] border-[var(--primary)]'
                : 'bg-[var(--bg-light)] border-[var(--border)] hover:border-[var(--primary)]'
              }
            `}
            onClick={handleCheckboxChange}
          >
            {selected && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <span className="text-xs text-[var(--text-muted)] select-none">
            {selected ? 'Selected' : 'Select'}
          </span>
        </label>

        {/* Reorder buttons */}
        <div className="flex items-center gap-1">
          <button
            data-reorder-button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp?.();
            }}
            disabled={!canMoveUp}
            className={`
              p-1 rounded-sm transition-all
              ${canMoveUp
                ? 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]'
                : 'text-[var(--text-disabled)] cursor-not-allowed'
              }
            `}
            title="Move up"
          >
            <LuChevronUp size={14} />
          </button>
          <button
            data-reorder-button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown?.();
            }}
            disabled={!canMoveDown}
            className={`
              p-1 rounded-sm transition-all
              ${canMoveDown
                ? 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]'
                : 'text-[var(--text-disabled)] cursor-not-allowed'
              }
            `}
            title="Move down"
          >
            <LuChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Story content */}
      <div className="p-3 text-[var(--text)] story-card-markdown text-xs">
        <style>{`
          .story-card-markdown {
            font-size: 12px;
            line-height: 1.5;
          }
          .story-card-markdown h3 {
            font-size: 1.1em;
            font-weight: bold;
            margin-bottom: 0.4em;
            margin-top: 0;
            color: var(--text);
          }
          .story-card-markdown h4 {
            font-size: 0.95em;
            font-weight: bold;
            margin-bottom: 0.3em;
            margin-top: 0.6em;
            color: var(--text);
          }
          .story-card-markdown p {
            margin-bottom: 0.4em;
            line-height: 1.5;
            color: var(--text);
          }
          .story-card-markdown ol {
            margin-bottom: 0.4em;
            padding-left: 1.5em;
            color: var(--text);
          }
          .story-card-markdown li {
            margin-bottom: 0.2em;
          }
          .story-card-markdown strong {
            font-weight: bold;
            color: var(--text);
          }
        `}</style>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
