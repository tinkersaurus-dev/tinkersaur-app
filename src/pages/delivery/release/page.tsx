/**
 * Release Page (Placeholder)
 * Coming soon page for Delivery > Release
 */

import { MainLayout } from '@/app/layouts/MainLayout';

export default function ReleasePage() {
  return (
    <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">
            Release
          </h1>
          <p className="text-[var(--text-muted)]">
            Coming Soon
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
