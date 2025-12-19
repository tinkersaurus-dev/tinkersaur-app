/**
 * GlobalSidebar Component
 * Main navigation sidebar visible on all pages
 * Contains team selector header and four main sections
 * Sections expand automatically based on current route
 */

import { useLocation, useNavigate } from 'react-router';
import { FiCompass, FiPenTool, FiCalendar, FiPackage, FiBox, FiUsers } from 'react-icons/fi';

interface NavSection {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: { key: string; label: string; path: string; icon: React.ReactNode }[];
}

export function GlobalSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const navSections: NavSection[] = [
    {
      key: 'discovery',
      label: 'Discovery',
      icon: <FiCompass />,
      path: '/discovery',
      children: [
        { key: 'solutions', label: 'Solutions', path: '/discovery/solutions', icon: <FiBox /> },
        { key: 'personas', label: 'Personas', path: '/discovery/personas', icon: <FiUsers /> },
      ],
    },
    {
      key: 'design',
      label: 'Design',
      icon: <FiPenTool />,
      path: '/design',
    },
    {
      key: 'planning',
      label: 'Planning',
      icon: <FiCalendar />,
      path: '/planning',
    },
    {
      key: 'delivery',
      label: 'Delivery',
      icon: <FiPackage />,
      path: '/delivery',
    },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);
  const isExactActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isExpanded = (section: NavSection) => section.children && isActive(section.path);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-dark)] border-r border-[var(--border)]">
      {/* Team Selector Header */}
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
          INSERT TEAM SELECTOR HERE
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-auto py-2">
        {navSections.map((section) => (
          <div key={section.key} className="mb-1">
            {/* Section Header */}
            <div
              className={`
                flex items-center gap-2 px-4 py-2 cursor-pointer
                text-sm transition-colors
                ${isActive(section.path)
                  ? 'text-[var(--primary)] bg-[var(--bg-light)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                }
              `}
              onClick={() => navigate(section.path)}
            >
              {section.icon}
              <span className="flex-1">{section.label}</span>
            </div>

            {/* Subsection Items - shown when route is active */}
            {isExpanded(section) && section.children && (
              <div className="ml-6 pl-2 border-l border-[var(--border)]">
                <div className="px-2 py-1">
                  <span className="text-[var(--text-muted)] text-xs uppercase tracking-wide">
                    Solution Development
                  </span>
                </div>
                {section.children.map((child) => (
                  <div
                    key={child.key}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 cursor-pointer text-xs transition-colors
                      ${isExactActive(child.path)
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
    </div>
  );
}
