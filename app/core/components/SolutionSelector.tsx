/**
 * SolutionSelector Component
 * Sidebar component showing selected solution name with button to open picker modal
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { FiChevronsRight } from 'react-icons/fi';
import { useSolutionStore } from '~/core/solution';
import { SolutionSelectorModal } from './SolutionSelectorModal';
import type { Solution } from '~/core/entities/product-management';
import { HStack } from './ui';

export function SolutionSelector() {
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
      <div className="flex items-center justify-between px-1 py-1.5">
        <div className="flex-1 min-w-0">
          
          <span className="text-[10px] uppercase tracking-wide text-[var(--text-disabled)] block mb-0.5">
            Solution
          </span>
          

          <HStack align='center' justify='between' className='pr-1'>
            <span className={`text-sm font-medium truncate block ${selectedSolution ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
              {selectedSolution?.solutionName ?? 'No solution selected'}
            </span>
            <button
            onClick={() => setIsModalOpen(true)}
            className="p-0 rounded-sm hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            title="Select solution"
            >
              <FiChevronsRight className="text-[var(--text-muted)]" size={12}/>
            </button>
          </HStack>
        </div>
      </div>

      <SolutionSelectorModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
}
