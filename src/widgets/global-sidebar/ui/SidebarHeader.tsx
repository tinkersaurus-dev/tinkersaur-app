/**
 * SidebarHeader Component
 * Displays logo and app name with collapse/expand toggle
 */

import { Link } from 'react-router';
import { FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function SidebarHeader({ isCollapsed, onToggleCollapse }: SidebarHeaderProps) {
  if (isCollapsed) {
    return (
      <div className="h-10 flex items-center justify-center flex-shrink-0">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          aria-label="Expand sidebar"
        >
          <FiChevronsRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="h-10 px-4 flex items-center border-b border-[var(--border-muted)] flex-shrink-0">
      <Link
        to="/"
        className="flex items-center gap-2 no-underline text-[var(--text)] flex-1 min-w-0"
      >
        <img
          src="/images/tinkersaur-logo-sm-2.png"
          alt="Tinkersaur Logo"
          width={24}
          height={24}
          className="flex-shrink-0 w-6 h-6 min-w-6 min-h-6"
        />
        <span className="text-base font-semibold truncate">Tinkersaur</span>
      </Link>
      <button
        onClick={onToggleCollapse}
        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer flex-shrink-0"
        aria-label="Collapse sidebar"
      >
        <FiChevronsLeft size={16} />
      </button>
    </div>
  );
}
