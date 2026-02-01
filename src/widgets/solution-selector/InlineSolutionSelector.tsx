/**
 * InlineSolutionSelector Component
 * Compact horizontal solution selector for use in the contextual sub-header
 * Layout: Solution: [SolutionName →]
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { FiChevronsRight } from 'react-icons/fi';
import { useSolutionStore } from '@/app/model/stores/solution';
import { SolutionSelectorModal } from './SolutionSelectorModal'
import type { Solution } from '@/entities/solution';
import { HStack } from '@/shared/ui';

export function InlineSolutionSelector() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { selectedSolution, selectSolution } = useSolutionStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelect = (solution: Solution) => {
    selectSolution(solution);
    // Navigate to the solution detail page based on current area
    if (location.pathname.startsWith('/solutions/scope')) {
      navigate(`/solutions/scope/${solution.id}`);
    } else if (location.pathname.startsWith('/solutions/strategy')) {
      navigate(`/solutions/strategy/overview/${solution.id}`);
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
