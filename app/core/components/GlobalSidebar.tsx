/**
 * GlobalSidebar Component
 * Main navigation sidebar with collapsible mode and flyout menus
 * Sections expand automatically based on current route
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useSidebarUIStore } from '~/core/stores/sidebarUIStore';
import { useSolutionStore } from '~/core/solution';
import { MODULE_NAVIGATION, type NavSection } from '~/core/config/navigation-config';
import { getActiveModule } from '~/core/utils/getActiveModule';

interface FlyoutMenuProps {
  section: NavSection;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
  flyoutTimeoutRef: React.RefObject<NodeJS.Timeout | null>;
  isExactActive: (path: string) => boolean;
  getResolvedPath: (section: NavSection) => string;
  navigate: (path: string) => void;
  setFlyoutSection: (section: string | null) => void;
}

function FlyoutMenu({
  section,
  sidebarRef,
  flyoutTimeoutRef,
  isExactActive,
  getResolvedPath,
  navigate,
  setFlyoutSection,
}: FlyoutMenuProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!sidebarRef.current) return;

    const sidebarRect = sidebarRef.current.getBoundingClientRect();
    const sectionElement = sidebarRef.current.querySelector(`[data-section="${section.key}"]`);

    if (!sectionElement) return;

    const sectionRect = sectionElement.getBoundingClientRect();

    setPosition({
      top: sectionRect.top,
      left: sidebarRect.right + 4,
    });
  }, [sidebarRef, section.key]);

  if (!position) return null;

  return createPortal(
    <div
      data-flyout-menu
      className="fixed bg-[var(--bg-light)] border border-[var(--border)] rounded-sm shadow-lg py-2 min-w-[200px] z-50"
      style={{
        top: position.top,
        left: position.left,
      }}
      onMouseEnter={() => {
        if (flyoutTimeoutRef.current) {
          clearTimeout(flyoutTimeoutRef.current);
        }
      }}
      onMouseLeave={() => {
        setFlyoutSection(null);
      }}
    >
      {/* Section header in flyout */}
      <div
        className="px-4 py-2 text-xs font-medium text-[var(--text)] border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)]"
        onClick={() => {
          navigate(getResolvedPath(section));
          setFlyoutSection(null);
        }}
      >
        {section.label}
      </div>

      {/* Children if any */}
      {section.children && section.children.length > 0 && (
        <div className="py-1">
          {section.children.map((child) => (
            <div
              key={child.key}
              className={`
                flex items-center gap-2 px-4 py-2 cursor-pointer text-xs transition-colors
                ${
                  isExactActive(child.path)
                    ? 'text-[var(--primary)] bg-[var(--bg-hover)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                }
              `}
              onClick={() => {
                navigate(child.path);
                setFlyoutSection(null);
              }}
            >
              {child.icon}
              {child.label}
            </div>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

export function GlobalSidebar() {
  const location = useLocation();
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

  // Get navigation sections based on active module
  const activeModule = getActiveModule(location.pathname);
  const navSections: NavSection[] = activeModule ? MODULE_NAVIGATION[activeModule] : [];

  const isActive = (path: string) => location.pathname.startsWith(path);
  const isExactActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');
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

  const handleSectionClick = (section: NavSection) => {
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
  };

  // Find the active flyout section
  const activeFlyoutSection = flyoutSection && isCollapsed
    ? navSections.find((s) => s.key === flyoutSection)
    : null;

  return (
    <div
      ref={sidebarRef}
      className="h-full flex flex-col bg-[var(--bg-dark)] border-r border-[var(--border)] relative overflow-hidden"
    >
      {/* Toggle Button */}
      <div className="flex justify-end p-2 border-b border-[var(--border)]">
        <button
          onClick={toggleCollapsed}
          className="p-1.5 rounded-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-hidden py-2">
        {navSections.map((section) => (
          <div key={section.key} className="mb-1">
            {/* Section Header - same structure, uses overflow to hide label */}
            <div
              data-section={section.key}
              className={`
                flex items-center gap-2 px-4 py-2
                cursor-pointer text-sm transition-colors whitespace-nowrap
                ${
                  isActive(section.path)
                    ? 'text-[var(--primary)] bg-[var(--bg-light)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                }
                ${flyoutSection === section.key ? 'bg-[var(--bg-light)]' : ''}
              `}
              onClick={() => handleSectionClick(section)}
              onMouseEnter={() => handleIconHover(section.key)}
              onMouseLeave={handleIconLeave}
              title={isCollapsed ? section.label : undefined}
            >
              <span className="flex-shrink-0">{section.icon}</span>
              <span className="flex-1 overflow-hidden">{section.label}</span>
            </div>

            {/* Subsection Items - only shown when NOT collapsed and route is active */}
            {!isCollapsed && isExpanded(section) && section.children && (
              <div className="ml-6 pl-2 border-l border-[var(--border)]">
                {section.children.map((child) => (
                  <div
                    key={child.key}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 cursor-pointer text-xs transition-colors
                      ${
                        isExactActive(child.path)
                          ? 'text-[var(--primary)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }
                    `}
                    onClick={() => navigate(child.path)}
                  >
                    {child.icon}
                    {child.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Flyout Portal */}
      {activeFlyoutSection && (
        <FlyoutMenu
          section={activeFlyoutSection}
          sidebarRef={sidebarRef}
          flyoutTimeoutRef={flyoutTimeoutRef}
          isExactActive={isExactActive}
          getResolvedPath={getResolvedPath}
          navigate={navigate}
          setFlyoutSection={setFlyoutSection}
        />
      )}
    </div>
  );
}
