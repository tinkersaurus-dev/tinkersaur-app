/**
 * useGlobalSidebarState Hook
 * Manages state and logic for the GlobalSidebar component
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSidebarUIStore } from '@/app/model/stores/sidebar-ui';
import { useSolutionStore } from '@/entities/solution';
import type { NavSection } from '@/shared/lib/config/navigation-config';

interface UseGlobalSidebarStateProps {
  pathname: string;
}

export function useGlobalSidebarState({ pathname }: UseGlobalSidebarStateProps) {
  const navigate = useNavigate();
  const { isCollapsed, setCollapsed, toggleCollapsed } = useSidebarUIStore();
  const selectedSolution = useSolutionStore((state) => state.selectedSolution);

  // Resolve the actual path for sections that depend on selected solution
  const getResolvedPath = useCallback(
    (section: NavSection): string => {
      if (section.key === 'spec' && selectedSolution?.solutionId) {
        return `/design/spec/${selectedSolution.solutionId}`;
      }
      return section.path;
    },
    [selectedSolution]
  );

  const isActive = (path: string) => pathname.startsWith(path);
  const isExactActive = (path: string) => pathname === path || pathname.startsWith(path + '/');
  const isExpanded = (section: NavSection) => !!section.children;

  // Handle module click from ModuleBar
  const handleModuleClick = useCallback(
    (moduleKey: string, isActiveModule: boolean, defaultRoute: string) => {
      if (isActiveModule) {
        return;
      }
      navigate(defaultRoute);
    },
    [navigate]
  );

  const handleSectionClick = useCallback(
    (section: NavSection) => {
      const resolvedPath = getResolvedPath(section);
      navigate(resolvedPath);
    },
    [getResolvedPath, navigate]
  );

  return {
    isCollapsed,
    setCollapsed,
    toggleCollapsed,
    getResolvedPath,
    isActive,
    isExactActive,
    isExpanded,
    handleModuleClick,
    handleSectionClick,
    navigate,
  };
}
