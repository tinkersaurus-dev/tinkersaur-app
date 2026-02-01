import { httpClient } from '@/shared/api';
import type {
  UseCaseVersion,
  UseCaseVersionDetail,
  CreateUseCaseVersionDto,
  UpdateUseCaseVersionDto,
  VersionComparison,
} from '../model/types';

const getEndpoint = (useCaseId: string) => `/api/use-cases/${useCaseId}/versions`;

export const useCaseVersionApi = {
  /**
   * List all versions for a use case
   */
  async list(useCaseId: string): Promise<UseCaseVersion[]> {
    return httpClient.get<UseCaseVersion[]>(getEndpoint(useCaseId));
  },

  /**
   * Get version metadata by ID
   */
  async get(useCaseId: string, versionId: string): Promise<UseCaseVersion> {
    return httpClient.get<UseCaseVersion>(`${getEndpoint(useCaseId)}/${versionId}`);
  },

  /**
   * Get version with full snapshot and compiled specification
   */
  async getWithSnapshot(useCaseId: string, versionId: string): Promise<UseCaseVersionDetail> {
    return httpClient.get<UseCaseVersionDetail>(`${getEndpoint(useCaseId)}/${versionId}/snapshot`);
  },

  /**
   * Create a new version from the current state
   */
  async create(useCaseId: string, data: CreateUseCaseVersionDto): Promise<UseCaseVersion> {
    return httpClient.post<UseCaseVersion>(getEndpoint(useCaseId), data);
  },

  /**
   * Update version metadata (Draft versions only)
   */
  async update(useCaseId: string, versionId: string, data: UpdateUseCaseVersionDto): Promise<UseCaseVersion> {
    return httpClient.put<UseCaseVersion>(`${getEndpoint(useCaseId)}/${versionId}`, data);
  },

  /**
   * Delete a version (Draft versions only)
   */
  async delete(useCaseId: string, versionId: string): Promise<void> {
    await httpClient.delete(`${getEndpoint(useCaseId)}/${versionId}`);
  },

  /**
   * Transition version to a new status
   */
  async transitionStatus(useCaseId: string, versionId: string, targetStatus: string): Promise<UseCaseVersion> {
    return httpClient.post<UseCaseVersion>(`${getEndpoint(useCaseId)}/${versionId}/transition`, {
      targetStatus,
    });
  },

  /**
   * Revert the use case to match a version's snapshot
   */
  async revert(useCaseId: string, versionId: string): Promise<{ message: string }> {
    return httpClient.post<{ message: string }>(`${getEndpoint(useCaseId)}/${versionId}/revert`, {});
  },

  /**
   * Compare two versions
   */
  async compare(useCaseId: string, versionId1: string, versionId2: string): Promise<VersionComparison> {
    return httpClient.get<VersionComparison>(
      `${getEndpoint(useCaseId)}/compare?v1=${versionId1}&v2=${versionId2}`
    );
  },
};
