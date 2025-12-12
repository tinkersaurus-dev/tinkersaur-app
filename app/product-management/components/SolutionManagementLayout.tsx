/**
 * SolutionManagementLayout Component
 * Shared layout wrapper for all Solution Management pages
 * Includes the navigation sidebar
 */

import type { ReactNode } from 'react';
import { AppLayout } from '~/core/components';
import { Layout } from '~/core/components/ui';
import { APP_CONFIG } from '~/core/config/app-config';
import { SolutionManagementSidebar } from './SolutionManagementSidebar';

interface SolutionManagementLayoutProps {
  children: ReactNode;
}

export function SolutionManagementLayout({ children }: SolutionManagementLayoutProps) {
  return (
    <AppLayout>
      <div className="h-[calc(100vh-48px)] overflow-auto">
        <div
          className="mx-auto flex h-full"
          style={{ maxWidth: APP_CONFIG.ui.layout.solutionManagementMaxWidth }}
        >
          <Layout.Sider width={300}>
            <SolutionManagementSidebar />
          </Layout.Sider>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
