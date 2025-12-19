/**
 * AppHeader Component
 * Top navigation bar with logo, module switcher, and user menu
 */

import { Layout, Menu, Dropdown, Avatar, HStack, Button } from '~/core/components/ui';
import type { MenuItemType, DropdownMenuItem } from '~/core/components/ui';
import { FaUser, FaRegLightbulb, FaLightbulb } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTheme } from '../theme/ThemeProvider';
import { useAuthStore } from '~/core/auth';

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const userInfo = useAuthStore((state) => state.userInfo);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // User menu items
  const userMenuItems: DropdownMenuItem[] = [
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
      key: 'logout',
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  // Module navigation items (no icons)
  const moduleMenuItems: MenuItemType[] = [
    {
      key: 'discovery',
      label: <Link to="/discovery">Solution Management</Link>,
    },
    {
      key: 'studio',
      label: 'Design Studio',
      disabled: true, // Enabled via specific design work link
    },
  ];

  // Determine selected module based on current path
  const selectedModule = location.pathname.startsWith('/discovery')
    ? 'discovery'
    : location.pathname.startsWith('/studio')
    ? 'studio'
    : '';

  return (
    <Layout.Header className="flex items-center justify-between bg-[var(--bg-brand)]">
      {/* Logo and App Name */}
      <HStack gap="lg" align="center">
        <Link to="/" className="flex items-center text-[var(--text-brand)] no-underline">
          <h1 className="m-0 text-[var(--text-brand)] text-xl font-semibold">
            Tinkersaur
          </h1>
        </Link>

        {/* Module Navigation */}
        <Menu
          mode="horizontal"
          selectedKeys={[selectedModule]}
          items={moduleMenuItems}
          className="min-w-[300px] text-sm"
          colorScheme='brand'
        />
      </HStack>

      {/* Right side - Theme toggle + User Menu */}
      <HStack gap="md" align="center">
        {/* Theme Toggle */}
        <Button
          variant="text"
          icon={theme === 'dark' ? <FaLightbulb /> : <FaRegLightbulb />}
          onClick={toggleTheme}
          className="text-white"
        />

        {/* User Menu */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <HStack gap="sm" align="center" className="cursor-pointer text-white">
            <Avatar size="small" icon={<FaUser />} />
            <span>{userInfo?.name ?? 'Guest'}</span>
          </HStack>
        </Dropdown>
      </HStack>
    </Layout.Header>
  );
}
