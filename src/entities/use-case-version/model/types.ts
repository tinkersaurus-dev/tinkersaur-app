import { z } from 'zod';

/**
 * UseCaseVersion domain model
 * Represents a versioned snapshot of a use case, its requirements, and design works
 */

// Version status enum
export const UseCaseVersionStatus = {
  Drafted: 'Drafted',
  Designed: 'Designed',
  Delivered: 'Delivered',
  Rejected: 'Rejected',
} as const;

export type UseCaseVersionStatus = (typeof UseCaseVersionStatus)[keyof typeof UseCaseVersionStatus];

// Snapshot schemas (read-only representations of versioned data)
export const RequirementSnapshotSchema = z.object({
  originalId: z.string().uuid(),
  text: z.string(),
  type: z.string(),
  status: z.string(),
});

export type RequirementSnapshot = z.infer<typeof RequirementSnapshotSchema>;

export const DiagramSnapshotSchema = z.object({
  originalId: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  order: z.number(),
  mermaidSyntax: z.string().nullable(),
});

export type DiagramSnapshot = z.infer<typeof DiagramSnapshotSchema>;

export const DocumentSnapshotSchema = z.object({
  originalId: z.string().uuid(),
  name: z.string(),
  content: z.string(),
  order: z.number(),
});

export type DocumentSnapshot = z.infer<typeof DocumentSnapshotSchema>;

export const InterfaceSnapshotSchema = z.object({
  originalId: z.string().uuid(),
  name: z.string(),
  fidelity: z.string(),
  order: z.number(),
});

export type InterfaceSnapshot = z.infer<typeof InterfaceSnapshotSchema>;

export const ReferenceSnapshotSchema = z.object({
  originalId: z.string().uuid(),
  name: z.string(),
  contentType: z.string(),
  contentId: z.string().uuid(),
  sourceShapeId: z.string(),
  referenceType: z.string(),
});

export type ReferenceSnapshot = z.infer<typeof ReferenceSnapshotSchema>;

export const DesignWorkSnapshotSchema = z.object({
  originalId: z.string().uuid(),
  parentDesignWorkId: z.string().uuid().nullable(),
  name: z.string(),
  order: z.number(),
  diagrams: z.array(DiagramSnapshotSchema),
  documents: z.array(DocumentSnapshotSchema),
  interfaces: z.array(InterfaceSnapshotSchema),
  references: z.array(ReferenceSnapshotSchema),
  requirementRefIds: z.array(z.string().uuid()),
});

export type DesignWorkSnapshot = z.infer<typeof DesignWorkSnapshotSchema>;

export const UseCaseSnapshotSchema = z.object({
  name: z.string(),
  description: z.string(),
  quotes: z.array(z.string()),
  solutionId: z.string().uuid().nullable(),
  requirements: z.array(RequirementSnapshotSchema),
  designWorks: z.array(DesignWorkSnapshotSchema),
  snapshotTakenAt: z.string().datetime(),
});

export type UseCaseSnapshot = z.infer<typeof UseCaseSnapshotSchema>;

// Version schemas
export const UseCaseVersionSchema = z.object({
  id: z.string().uuid(),
  useCaseId: z.string().uuid(),
  versionName: z.string(),
  versionNumber: z.number(),
  status: z.string(),
  description: z.string().nullable(),
  createdByUserId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UseCaseVersion = z.infer<typeof UseCaseVersionSchema>;

export const UseCaseVersionDetailSchema = UseCaseVersionSchema.extend({
  snapshot: UseCaseSnapshotSchema,
  compiledSpecification: z.string(),
});

export type UseCaseVersionDetail = z.infer<typeof UseCaseVersionDetailSchema>;

// Request schemas
export const CreateUseCaseVersionSchema = z.object({
  versionName: z.string().min(1, 'Version name is required').max(100),
  description: z.string().max(2000).optional(),
});

export type CreateUseCaseVersionDto = z.infer<typeof CreateUseCaseVersionSchema>;

export const UpdateUseCaseVersionSchema = z.object({
  versionName: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
});

export type UpdateUseCaseVersionDto = z.infer<typeof UpdateUseCaseVersionSchema>;

export const TransitionVersionStatusSchema = z.object({
  targetStatus: z.string(),
});

export type TransitionVersionStatusDto = z.infer<typeof TransitionVersionStatusSchema>;

// Version diff schema
export const VersionDiffSchema = z.object({
  nameChanged: z.boolean(),
  descriptionChanged: z.boolean(),
  requirementsAdded: z.number(),
  requirementsRemoved: z.number(),
  requirementsModified: z.number(),
  designWorksAdded: z.number(),
  designWorksRemoved: z.number(),
  designWorksModified: z.number(),
  changeSummary: z.array(z.string()),
});

export type VersionDiff = z.infer<typeof VersionDiffSchema>;

export const VersionComparisonSchema = z.object({
  version1: UseCaseVersionSchema,
  version2: UseCaseVersionSchema,
  diff: VersionDiffSchema,
});

export type VersionComparison = z.infer<typeof VersionComparisonSchema>;

// Helper functions
export function getStatusColor(status: string): 'default' | 'blue' | 'green' | 'red' {
  switch (status) {
    case UseCaseVersionStatus.Drafted:
      return 'default';
    case UseCaseVersionStatus.Designed:
      return 'blue';
    case UseCaseVersionStatus.Delivered:
      return 'green';
    case UseCaseVersionStatus.Rejected:
      return 'red';
    default:
      return 'default';
  }
}

export function getValidTransitions(status: string): string[] {
  switch (status) {
    case UseCaseVersionStatus.Drafted:
      return [UseCaseVersionStatus.Designed, UseCaseVersionStatus.Rejected];
    case UseCaseVersionStatus.Designed:
      return [UseCaseVersionStatus.Delivered, UseCaseVersionStatus.Rejected];
    case UseCaseVersionStatus.Delivered:
    case UseCaseVersionStatus.Rejected:
      return []; // Terminal states
    default:
      return [];
  }
}

export function formatVersionNumber(versionNumber: number): string {
  return `v${versionNumber}`;
}

export function formatVersionDisplay(version: UseCaseVersion): string {
  return `${formatVersionNumber(version.versionNumber)} - ${version.versionName}`;
}

/**
 * Find the latest version matching a given status, by highest versionNumber.
 * Returns null if no versions match.
 */
export function getLatestVersionByStatus(
  versions: UseCaseVersion[],
  status: UseCaseVersionStatus,
): UseCaseVersion | null {
  const matching = versions.filter((v) => v.status === status);
  if (matching.length === 0) return null;
  return matching.reduce((latest, current) =>
    current.versionNumber > latest.versionNumber ? current : latest,
  );
}
