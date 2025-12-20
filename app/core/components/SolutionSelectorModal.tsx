/**
 * SolutionSelectorModal Component
 * Modal for selecting or creating solutions with text filter
 */

import { useState, useMemo } from 'react';
import { FiPlus, FiBox, FiServer, FiGitBranch, FiGitCommit, FiDatabase, FiSearch } from 'react-icons/fi';
import { Modal, Input, Button, Card, Tag, Empty } from '~/core/components/ui';
import type { TagColor } from '~/core/components/ui';
import type { Solution, SolutionType } from '~/core/entities/product-management';
import { useSolutionsQuery } from '~/product-management/queries';
import { useAuthStore } from '~/core/auth';
import { formatRelativeTime } from '~/core/utils/formatRelativeTime';
import { CreateSolutionModal } from './CreateSolutionModal';

interface SolutionSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (solution: Solution) => void;
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

export function SolutionSelectorModal({ open, onClose, onSelect }: SolutionSelectorModalProps) {
  const [filter, setFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const teamId = selectedTeam?.teamId;
  const { data: solutions = [], isLoading } = useSolutionsQuery(teamId);

  const filteredSolutions = useMemo(() => {
    if (!filter.trim()) return solutions;

    const lowerFilter = filter.toLowerCase();
    return solutions.filter(
      (solution) =>
        solution.name.toLowerCase().includes(lowerFilter) ||
        solution.description.toLowerCase().includes(lowerFilter)
    );
  }, [solutions, filter]);

  const handleDoubleClick = (solution: Solution) => {
    onSelect(solution);
    onClose();
    setFilter('');
  };

  const handleClose = () => {
    onClose();
    setFilter('');
  };

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (solution: Solution) => {
    setIsCreateModalOpen(false);
    onSelect(solution);
    onClose();
    setFilter('');
  };

  return (
    <>
      <Modal
        title="Select Solution"
        open={open}
        onCancel={handleClose}
        footer={null}
        width={900}
      >
        <div className="space-y-4 mt-4">
          {/* Filter and Create */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by name or description..."
                className="pl-9"
              />
            </div>
            <Button variant="primary" icon={<FiPlus />} onClick={handleCreateClick}>
              Create
            </Button>
          </div>

          {/* Solutions Grid */}
          <div className="h-[340px] overflow-auto">
            {!teamId ? (
              <Empty description="No team selected. Please select a team first." />
            ) : isLoading ? (
              <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
            ) : filteredSolutions.length === 0 ? (
              <Empty
                description={
                  filter
                    ? 'No solutions match your filter.'
                    : 'No solutions yet. Click "Create" to add one.'
                }
              />
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {filteredSolutions.map((solution) => (
                  <Card
                    key={solution.id}
                    hoverable
                    className="cursor-pointer"
                    onDoubleClick={() => handleDoubleClick(solution)}
                  >
                    <div className="flex flex-col">
                      {/* Header: Icon + Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[var(--primary)] text-lg">
                          {solutionTypeIcons[solution.type]}
                        </span>
                        <h3 className="text-sm font-semibold text-[var(--text)] truncate">
                          {solution.name}
                        </h3>
                      </div>

                      {/* Type Tag */}
                      <div className="mb-2">
                        <Tag color={solutionTypeColors[solution.type]}>
                          {solution.type.charAt(0).toUpperCase() + solution.type.slice(1)}
                        </Tag>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">
                        {solution.description}
                      </p>

                      {/* Footer */}
                      <div className="text-xs text-[var(--text-disabled)] mt-auto">
                        Updated {formatRelativeTime(solution.updatedAt)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Help Text */}
          {filteredSolutions.length > 0 && (
            <p className="text-xs text-[var(--text-muted)] text-center">
              Double-click a solution to select it
            </p>
          )}
        </div>
      </Modal>

      <CreateSolutionModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
