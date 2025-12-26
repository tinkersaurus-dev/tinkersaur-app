/**
 * InlineSolutionSelector Component
 * Compact horizontal solution selector for use in the contextual sub-header
 * Layout: Solution: [SolutionName →]
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { FiChevronsRight } from 'react-icons/fi';
import { useSolutionStore } from '~/core/solution';
import { SolutionSelectorModal } from './SolutionSelectorModal';
import type { Solution } from '~/core/entities/product-management';
import { HStack } from './ui';

export function InlineSolutionSelector() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { selectedSolution, selectSolution } = useSolutionStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelect = (solution: Solution) => {
    selectSolution(solution);
    // Navigate to the solution detail page if we're in the scope area
    if (location.pathname.startsWith('/solution/scope')) {
      navigate(`/solution/scope/${solution.id}`);
    }
  };

  return (
    <>
      <HStack gap="sm" align="center">
        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Solution:</span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 hover:bg-[var(--bg-hover)] rounded px-2 py-1 transition-colors cursor-pointer"
          title="Select solution"
        >
          <span className={`text-xs font-medium ${selectedSolution ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
            {selectedSolution?.solutionName ?? 'Select...'}
          </span>
          <FiChevronsRight className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </HStack>

      <SolutionSelectorModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
}
