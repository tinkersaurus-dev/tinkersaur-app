/**
 * GlobalSidebar Component
 * Main navigation sidebar with integrated module bar
 * Sections expand automatically based on current route
 */

import { useLocation } from 'react-router';
import { MODULE_NAVIGATION, type NavSection } from '@/shared/lib/config/navigation-config';
import { getActiveModule } from '@/shared/lib/utils';
import { ModuleBar } from '@/widgets/module-bar';
import { useGlobalSidebarState } from '../lib/hooks';
import { SidebarHeader } from './SidebarHeader';
import { SidebarFooter } from './SidebarFooter';

export function GlobalSidebar() {
  const location = useLocation();
  const {
    isCollapsed,
    isActive,
    isExactActive,
    isExpanded,
    handleModuleClick,
    handleSectionClick,
    navigate,
  } = useGlobalSidebarState({ pathname: location.pathname });

  // Get navigation sections based on active module
  const activeModule = getActiveModule(location.pathname);
  const navSections: NavSection[] = activeModule ? MODULE_NAVIGATION[activeModule] : [];

  return (
    <div className="h-full flex flex-col bg-[var(--bg-light)] overflow-hidden border-r border-[var(--border-muted)]">
      {/* Header with Logo - full width */}
      <SidebarHeader isCollapsed={isCollapsed} />

      {/* Middle Section: ModuleBar + Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Module Bar - always visible */}
        <ModuleBar onModuleClick={handleModuleClick} />

        {/* Content sections - hidden when collapsed */}
        {!isCollapsed && (
          <nav className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
            {/* Current Module Label */}
            {activeModule && (
              <div className="px-2 py-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {activeModule}
              </div>
            )}

            {navSections.map((section) => (
              <div key={section.key}>
                {/* Section Header */}
                <div
                  data-section={section.key}
                  className={`
                    h-8 flex items-center gap-2 px-4 cursor-pointer text-xs font-medium transition-colors whitespace-nowrap
                    ${
                      isActive(section.path)
                        ? 'text-[var(--primary)] bg-[var(--bg)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                    }
                  `}
                  onClick={() => handleSectionClick(section)}
                >
                  <span className="flex-shrink-0">{section.icon}</span>
                  <span className="flex-1 overflow-hidden">{section.label}</span>
                </div>

                {/* Subsection Items - only shown when route is active */}
                {isExpanded(section) && section.children && (
                  <div className="ml-6 pl-2 border-l border-[var(--border-muted)]">
                    {section.children.map((child) => (
                      <div
                        key={child.key}
                        className={`
                          flex items-center gap-2 px-2 py-1.5 cursor-pointer text-[11px] transition-colors
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
        )}
      </div>

      {/* Footer with User Avatar - full width */}
      <SidebarFooter isCollapsed={isCollapsed} />
    </div>
  );
}
