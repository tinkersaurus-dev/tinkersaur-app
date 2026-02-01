/**
 * SidebarHeader Component
 * Displays logo and app name in the sidebar header
 */

import { Link } from 'react-router';

interface SidebarHeaderProps {
  isCollapsed: boolean;
}

export function SidebarHeader({ isCollapsed }: SidebarHeaderProps) {
  return (
    <div className="h-10 px-4 flex items-center border-b border-[var(--border-muted)] flex-shrink-0">
      <Link
        to="/"
        className="flex items-center gap-2 no-underline text-[var(--text)]"
      >
        <img
          src="/images/tinkersaur-logo-sm-2.png"
          alt="Tinkersaur Logo"
          width={24}
          height={24}
          className="flex-shrink-0 w-6 h-6 min-w-6 min-h-6"
        />
        {!isCollapsed && (
          <span className="text-base font-semibold truncate">Tinkersaur</span>
        )}
      </Link>
    </div>
  );
}
