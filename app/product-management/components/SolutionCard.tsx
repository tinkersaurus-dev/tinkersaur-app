/**
 * Solution Card Component
 * Displays a solution in a card format with type icon, description, and last updated time
 */

import { useNavigate } from 'react-router';
import { FiBox, FiServer, FiGitBranch, FiGitCommit, FiDatabase } from 'react-icons/fi';
import { Card, Tag } from '~/core/components/ui';
import type { TagColor } from '~/core/components/ui';
import type { Solution, SolutionType } from '~/core/entities/product-management';
import { formatRelativeTime } from '~/core/utils/formatRelativeTime';

interface SolutionCardProps {
  solution: Solution;
}

const solutionTypeIcons: Record<SolutionType, React.ReactNode> = {
  product: <FiBox />,
  service: <FiServer />,
  process: <FiGitBranch />,
  pipeline: <FiGitCommit />,
  infrastructure: <FiDatabase />,
};

const solutionTypeColors: Record<SolutionType, TagColor> = {
  product: 'blue',
  service: 'green',
  process: 'orange',
  pipeline: 'purple',
  infrastructure: 'red',
};

export function SolutionCard({ solution }: SolutionCardProps) {
  const navigate = useNavigate();

  const handleDoubleClick = () => {
    navigate(`/solutions/scope/${solution.id}`);
  };

  const typeLabel = solution.type.charAt(0).toUpperCase() + solution.type.slice(1);

  return (
    <Card
      hoverable
      className="h-full flex flex-col"
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex flex-col h-full">
        {/* Header: Icon + Name */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[var(--primary)] text-lg">
            {solutionTypeIcons[solution.type]}
          </span>
          <h3 className="text-base font-semibold text-[var(--text)] truncate">
            {solution.name}
          </h3>
        </div>

        {/* Type Tag */}
        <div className="mb-3">
          <Tag color={solutionTypeColors[solution.type]}>
            {typeLabel}
          </Tag>
        </div>

        {/* Description - truncated to 3 lines */}
        <p className="text-sm text-[var(--text-muted)] line-clamp-3 flex-grow mb-4">
          {solution.description}
        </p>

        {/* Footer: Last Updated */}
        <div className="text-xs text-[var(--text-disabled)] mt-auto">
          Last updated {formatRelativeTime(solution.updatedAt)}
        </div>
      </div>
    </Card>
  );
}
