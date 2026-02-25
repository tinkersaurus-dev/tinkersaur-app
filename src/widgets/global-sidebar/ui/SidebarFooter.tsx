/**
 * SidebarFooter Component
 * Displays user avatar with dropdown menu including theme toggle
 */

import { useNavigate } from 'react-router';
import { FaUser, FaSun, FaMoon } from 'react-icons/fa';
import { Dropdown, Avatar, HStack, useTheme } from '@/shared/ui';
import type { DropdownMenuItem } from '@/shared/ui';
import { useAuthStore } from '@/shared/auth';

interface SidebarFooterProps {
  isCollapsed: boolean;
}

export function SidebarFooter({ isCollapsed: _isCollapsed }: SidebarFooterProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const userInfo = useAuthStore((state) => state.userInfo);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems: DropdownMenuItem[] = [
    {
      key: 'profile',
      label: 'Profile',
    },
    {
      key: 'settings',
      label: 'Settings',
    },
    {
      key: 'divider-1',
      label: '',
      type: 'divider',
    },
    {
      key: 'theme',
      label: (
        <HStack gap="sm" align="center">
          {theme === 'dark' ? <FaSun size={12} /> : <FaMoon size={12} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </HStack>
      ),
      onClick: toggleTheme,
    },
    {
      key: 'divider-2',
      label: '',
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <div className="h-10 px-4 flex items-center border-t border-[var(--border-muted)] flex-shrink-0">
      <Dropdown menu={{ items: menuItems }} placement="topLeft">
        <div className="flex items-center gap-2 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          <Avatar size="small" icon={<FaUser />} />
          <span className="text-sm truncate">{userInfo?.name ?? 'Guest'}</span>
        </div>
      </Dropdown>
    </div>
  );
}
