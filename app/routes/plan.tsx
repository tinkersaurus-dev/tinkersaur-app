/**
 * Plan Page (Placeholder)
 * Coming soon page for Plan section
 */

import { MainLayout } from '~/core/components/MainLayout';

export default function PlanPage() {
  return (
    <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">
            Plan
          </h1>
          <p className="text-[var(--text-muted)]">
            Coming Soon
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
