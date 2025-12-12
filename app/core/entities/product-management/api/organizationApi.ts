import type { Organization, CreateOrganizationDto } from '../types';
import { createEntityApi } from '~/core/api/createEntityApi';

export const organizationApi = createEntityApi<Organization, CreateOrganizationDto>({
  endpoint: '/api/organizations',
});
