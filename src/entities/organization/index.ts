/**
 * Organization Entity
 * @module entities/organization
 */

export {
  OrganizationSchema,
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
} from './model/types';

export type {
  Organization,
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './model/types';

export { organizationApi } from './api/organizationApi';

export {
  useOrganizationsQuery,
  useOrganizationQuery,
  prefetchOrganizations,
  prefetchOrganization,
} from './api/queries';

export {
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
} from './api/mutations';
