/**
 * GlobalSidebar Component
 * Main navigation sidebar with collapsible mode and flyout menus
 * Sections expand automatically based on current route
 */

import { useLocation } from 'react-router';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { MODULE_NAVIGATION, type NavSection } from '@/shared/lib/config/navigation-config';
import { getActiveModule } from '@/shared/lib/utils';
import { useGlobalSidebarState } from '../lib/hooks';
import { FlyoutMenu } from './FlyoutMenu';

export function GlobalSidebar() {
  const location = useLocation();
  const {
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
  } = useGlobalSidebarState({ pathname: location.pathname });

  // Get navigation sections based on active module
  const activeModule = getActiveModule(location.pathname);
  const navSections: NavSection[] = activeModule ? MODULE_NAVIGATION[activeModule] : [];

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
            {/* Section Header */}
            <div
              data-section={section.key}
              className={`
                flex items-center py-2 cursor-pointer text-sm transition-colors whitespace-nowrap
                ${isCollapsed ? 'justify-center px-0' : 'gap-2 px-4'}
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
              {!isCollapsed && <span className="flex-1 overflow-hidden">{section.label}</span>}
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
