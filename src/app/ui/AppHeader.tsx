/**
 * AppHeader Component
 * Top navigation bar with logo, module switcher, and user menu
 */

import { Layout, Menu, Dropdown, Avatar, HStack, Button } from '@/shared/ui';
import type { MenuItemType, DropdownMenuItem } from '@/shared/ui';
import { FaUser, FaRegLightbulb, FaLightbulb } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/features/auth';
import { getActiveModule } from '@/shared/lib/utils';

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
      label: <Link to="/discovery/intake">Discovery</Link>,
    },
    {
      key: 'solutions',
      label: <Link to="/solutions/strategy/overview">Solutions</Link>,
    },
    {
      key: 'design',
      label: <Link to="/design/spec">Design</Link>,
    },
    {
      key: 'delivery',
      label: <Link to="/delivery/prioritize">Delivery</Link>,
    },
  ];

  // Determine selected module based on current path
  const selectedModule = getActiveModule(location.pathname) ?? '';

  return (
    <Layout.Header className="flex items-center justify-between bg-[var(--bg-brand)]">
      {/* Logo and App Name */}
      <HStack gap="lg" align="center">
        <Link to="/" className="flex items-center gap-2 text-[var(--text-brand)] no-underline">
          <img
            src="/images/tinkersaur-logo-sm-2.png"
            alt="Tinkersaur Logo"
            width={32}
            height={32}
          />
          <h1 className="m-0 text-[var(--text-brand)] text-xl font-semibold">
            Tinkersaur
          </h1>
        </Link>

        {/* Module Navigation */}
        <Menu
          mode="horizontal"
          selectedKeys={[selectedModule]}
          items={moduleMenuItems}
          className="text-sm"
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
