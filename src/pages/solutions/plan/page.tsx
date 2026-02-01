/**
 * Plan Page
 * Agile planning view for generating epics and stories from use case versions
 */

import { MainLayout } from '@/app/layouts/MainLayout';
import { PageHeader, PageContent } from '~/core/components';
import { PlanView } from '@/features/planning';

export default function PlanPage() {
  return (
    <MainLayout>
      <PageHeader title="Refinement" />
      <PageContent fillHeight>
        <PlanView />
      </PageContent>
    </MainLayout>
  );
}
