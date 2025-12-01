/**
 * SolutionManagementSidebar Component
 * Navigation sidebar for the Solution Management module
 */

import { useLocation, useNavigate } from 'react-router';
import { FiBox, FiUsers } from 'react-icons/fi';
import { Menu } from '~/core/components/ui';

export function SolutionManagementSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine which top-level section is active based on current route
  const getSelectedKey = (): string[] => {
    if (location.pathname.startsWith('/personas')) {
      return ['personas'];
    }
    // Default to solutions for /solutions and any sub-routes
    return ['solutions'];
  };

  const menuItems = [
    {
      key: 'solutions',
      label: (
        <span className="flex items-center gap-2">
          <FiBox />
          Solutions
        </span>
      ),
      onClick: () => navigate('/solutions'),
    },
    {
      key: 'personas',
      label: (
        <span className="flex items-center gap-2">
          <FiUsers />
          Personas
        </span>
      ),
      onClick: () => navigate('/personas'),
    },
  ];

  return (
    <div className="p-4 h-full">
      <h3 className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wide mb-4">
        Solution Development
      </h3>
      <Menu
        items={menuItems}
        selectedKeys={getSelectedKey()}
        mode="vertical"
        colorScheme="app"
      />
    </div>
  );
}
