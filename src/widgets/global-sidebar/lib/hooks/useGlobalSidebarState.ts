/**
 * useGlobalSidebarState Hook
 * Manages state and logic for the GlobalSidebar component
 */

import { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSidebarUIStore } from '@/app/model/stores/sidebar-ui';
import { useSolutionStore } from '@/app/model/stores/solution';
import type { NavSection } from '@/shared/lib/config/navigation-config';

interface UseGlobalSidebarStateProps {
  pathname: string;
}

export function useGlobalSidebarState({ pathname }: UseGlobalSidebarStateProps) {
  const navigate = useNavigate();
  const { isCollapsed, flyoutSection, toggleCollapsed, setFlyoutSection } = useSidebarUIStore();
  const selectedSolution = useSolutionStore((state) => state.selectedSolution);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const flyoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const isExpanded = (section: NavSection) => section.children && isActive(section.path);

  // Close flyout when clicking outside
  useEffect(() => {
    if (!flyoutSection) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (sidebarRef.current?.contains(target)) return;
      if (target.closest('[data-flyout-menu]')) return;

      setFlyoutSection(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [flyoutSection, setFlyoutSection]);

  // Handle hover to show flyout (with delay)
  const handleIconHover = useCallback(
    (sectionKey: string) => {
      if (!isCollapsed) return;

      if (flyoutTimeoutRef.current) {
        clearTimeout(flyoutTimeoutRef.current);
      }

      flyoutTimeoutRef.current = setTimeout(() => {
        setFlyoutSection(sectionKey);
      }, 150);
    },
    [isCollapsed, setFlyoutSection]
  );

  const handleIconLeave = useCallback(() => {
    if (flyoutTimeoutRef.current) {
      clearTimeout(flyoutTimeoutRef.current);
      flyoutTimeoutRef.current = null;
    }

    // Close flyout after a short delay if mouse doesn't enter the flyout menu
    flyoutTimeoutRef.current = setTimeout(() => {
      setFlyoutSection(null);
    }, 100);
  }, [setFlyoutSection]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (flyoutTimeoutRef.current) {
        clearTimeout(flyoutTimeoutRef.current);
      }
    };
  }, []);

  const handleSectionClick = useCallback(
    (section: NavSection) => {
      const resolvedPath = getResolvedPath(section);
      if (isCollapsed) {
        if (flyoutSection === section.key) {
          navigate(resolvedPath);
          setFlyoutSection(null);
        } else {
          setFlyoutSection(section.key);
        }
      } else {
        navigate(resolvedPath);
      }
    },
    [isCollapsed, flyoutSection, getResolvedPath, navigate, setFlyoutSection]
  );

  return {
    sidebarRef,
    flyoutTimeoutRef,
    isCollapsed,
    flyoutSection,
    toggleCollapsed,
    setFlyoutSection,
    getResolvedPath,
    isActive,
    isExactActive,
    isExpanded,
    handleIconHover,
    handleIconLeave,
    handleSectionClick,
    navigate,
  };
}
