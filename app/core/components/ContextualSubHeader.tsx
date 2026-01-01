/**
 * ContextualSubHeader Component
 * Secondary header containing contextual selectors (Team, Solution)
 * Sits between AppHeader and main content area
 * Content varies based on the current app module
 */

import { useLocation } from 'react-router';
import { HStack } from '~/core/components/ui';
import { InlineTeamSelector } from './InlineTeamSelector';
import { InlineSolutionSelector } from './InlineSolutionSelector';

export function ContextualSubHeader() {
  const location = useLocation();

  // Show solution selector for Strategy and Design modules
  const showSolutionSelector =
    location.pathname.startsWith('/strategy') ||
    location.pathname.startsWith('/design');

  return (
    <div className="h-10 flex items-center px-6 bg-[var(--bg)] border-b border-[var(--border)] flex-shrink-0">
      <HStack gap="lg" align="center">
        <InlineTeamSelector />
        {showSolutionSelector && (
          <>
            <div className="w-px h-5 bg-[var(--border)]" />
            <InlineSolutionSelector />
          </>
        )}
      </HStack>
    </div>
  );
}
