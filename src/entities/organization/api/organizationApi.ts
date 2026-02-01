import type { Organization, CreateOrganizationDto } from '../model/types';
import { createEntityApi } from '@/shared/api';

export const organizationApi = createEntityApi<Organization, CreateOrganizationDto>({
  endpoint: '/api/organizations',
});
