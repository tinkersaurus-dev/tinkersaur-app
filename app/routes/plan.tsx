/**
 * Plan Page
 * Agile planning view for generating epics and stories from use case versions
 */

import { MainLayout } from '~/core/components/MainLayout';
import { PageHeader, PageContent } from '~/core/components';
import { PlanView } from '~/product-management/components/plan';

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
