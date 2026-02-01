/**
 * Plan Page
 * Agile planning view for generating epics and stories from use case versions
 */

import { PageHeader, PageContent } from '@/shared/ui';
import { PlanView } from '@/features/planning';

export default function PlanPage() {
  return (
    <>
      <PageHeader title="Refinement" />
      <PageContent fillHeight>
        <PlanView />
      </PageContent>
    </>
  );
}
