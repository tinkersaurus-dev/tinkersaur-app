/**
 * MainLayout Component
 * Global layout wrapper with collapsible sidebar for all main pages
 */

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { AppLayout } from './AppLayout';
import { Layout } from '~/core/components/ui';
import { GlobalSidebar } from './GlobalSidebar';
import { useSidebarUIStore } from '~/core/stores/sidebarUIStore';

interface MainLayoutProps {
  children: ReactNode;
}

const SIDEBAR_EXPANDED_WIDTH = 300;
const SIDEBAR_COLLAPSED_WIDTH = 48;

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { isCollapsed, setCollapsed } = useSidebarUIStore();

  // Detect if we're in the Design Studio (has solutionId in design path)
  const isDesignStudio = /^\/solution\/design\/[^/]+/.test(location.pathname);

  // Update collapsed state when route changes
  // Use setTimeout to ensure the DOM has rendered before triggering animation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCollapsed(isDesignStudio);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [isDesignStudio, setCollapsed]);

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-88px)]">
        <Layout.Sider
          width={SIDEBAR_EXPANDED_WIDTH}
          collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
          collapsed={isCollapsed}
        >
          <GlobalSidebar />
        </Layout.Sider>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </AppLayout>
  );
}
