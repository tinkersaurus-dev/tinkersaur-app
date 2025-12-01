/**
 * SolutionManagementLayout Component
 * Shared layout wrapper for all Solution Management pages
 * Includes the navigation sidebar
 */

import type { ReactNode } from 'react';
import { AppLayout } from '~/core/components';
import { Layout } from '~/core/components/ui';
import { SolutionManagementSidebar } from './SolutionManagementSidebar';

interface SolutionManagementLayoutProps {
  children: ReactNode;
}

export function SolutionManagementLayout({ children }: SolutionManagementLayoutProps) {
  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-48px)]">
        <Layout.Sider width={300}>
          <SolutionManagementSidebar />
        </Layout.Sider>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </AppLayout>
  );
}
