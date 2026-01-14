import type {
  DesignWork,
  CreateDesignWorkDto,
  UpdateDesignWorkDto,
  DiagramRef,
  InterfaceRef,
  DocumentRef,
  Reference,
} from '../types';
import { httpClient, deserializeDates } from '~/core/api/httpClient';

/**
 * Backend response types for design work with content metadata
 */
interface ContentMetadataDto {
  id: string;
  name: string;
  type: string;
  order: number;
}

/**
 * Raw backend response for reference (before date deserialization)
 */
interface ReferenceDto {
  id: string;
  designWorkId: string;
  name: string;
  contentType: string;
  contentId: string;
  sourceShapeId: string;
  referenceType: string;
  metadata?: {
    sourceShapeType?: string;
    sourceShapeSubtype?: string;
    diagramType?: string;
    dropTarget?: 'canvas' | 'folder';
  };
  createdAt: string;
  updatedAt: string;
}

interface DesignWorkWithContentDto {
  id: string;
  solutionId: string;
  useCaseId?: string;
  parentDesignWorkId?: string;
  name: string;
  version: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  diagrams: ContentMetadataDto[];
  interfaces: ContentMetadataDto[];
  documents: ContentMetadataDto[];
  references: ReferenceDto[];
}

/**
 * Result of listing design works with content - includes both transformed design works
 * and full reference objects for syncing to the reference store
 */
export interface DesignWorksWithReferences {
  designWorks: DesignWork[];
  references: Reference[];
}

/**
 * Transform backend ContentMetadataDto to frontend DiagramRef
 */
function toDiagramRef(dto: ContentMetadataDto): DiagramRef {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type as DiagramRef['type'],
    order: dto.order,
  };
}

/**
 * Transform backend ContentMetadataDto to frontend InterfaceRef
 */
function toInterfaceRef(dto: ContentMetadataDto): InterfaceRef {
  return {
    id: dto.id,
    name: dto.name,
    fidelity: dto.type as InterfaceRef['fidelity'],
    order: dto.order,
  };
}

/**
 * Transform backend ContentMetadataDto to frontend DocumentRef
 */
function toDocumentRef(dto: ContentMetadataDto): DocumentRef {
  return {
    id: dto.id,
    name: dto.name,
    order: dto.order,
  };
}

/**
 * Transform backend ReferenceDto to frontend ReferenceRef (for DesignWork.references)
 */
function toReferenceRef(ref: ReferenceDto, index: number) {
  return {
    id: ref.id,
    name: ref.name,
    referenceType: ref.referenceType as 'link',
    order: index,
  };
}

/**
 * Transform backend ReferenceDto to full Reference object (for reference store)
 */
function toFullReference(dto: ReferenceDto): Reference {
  // Transform metadata to match frontend type (sourceShapeType is required)
  const metadata = dto.metadata
    ? {
        sourceShapeType: dto.metadata.sourceShapeType || 'unknown',
        sourceShapeSubtype: dto.metadata.sourceShapeSubtype,
        diagramType: dto.metadata.diagramType,
        dropTarget: dto.metadata.dropTarget,
      }
    : undefined;

  return {
    id: dto.id,
    designWorkId: dto.designWorkId,
    name: dto.name,
    contentType: dto.contentType as 'diagram' | 'document' | 'interface',
    contentId: dto.contentId,
    sourceShapeId: dto.sourceShapeId,
    referenceType: dto.referenceType as 'link',
    metadata,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

/**
 * Transform backend DesignWorkWithContentDto to frontend DesignWork
 */
function transformDesignWorkWithContent(dto: DesignWorkWithContentDto): DesignWork {
  return {
    id: dto.id,
    solutionId: dto.solutionId,
    useCaseId: dto.useCaseId,
    parentDesignWorkId: dto.parentDesignWorkId,
    name: dto.name,
    version: dto.version,
    order: dto.order,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    diagrams: (dto.diagrams || []).map(toDiagramRef),
    interfaces: (dto.interfaces || []).map(toInterfaceRef),
    documents: (dto.documents || []).map(toDocumentRef),
    references: (dto.references || []).map(toReferenceRef),
  };
}

/**
 * Normalize a DesignWork response by ensuring arrays have defaults
 */
function normalizeDesignWork(dw: DesignWork): DesignWork {
  return {
    ...dw,
    diagrams: dw.diagrams || [],
    interfaces: dw.interfaces || [],
    documents: dw.documents || [],
    references: dw.references || [],
  };
}

/**
 * DesignWork API Client
 * Real implementation with backend API
 */
class DesignWorkApi {
  /**
   * Get all design works for a solution with content metadata for tree view.
   * Returns both DesignWorks (with ReferenceRefs) and full Reference objects
   * so the caller can sync references to the reference store.
   */
  async listWithContent(solutionId: string): Promise<DesignWorksWithReferences> {
    const data = await httpClient.get<DesignWorkWithContentDto[]>(
      `/api/design-works/with-content?solutionId=${solutionId}`
    );

    // Transform to DesignWorks (references become ReferenceRefs)
    const designWorks = data.map(transformDesignWorkWithContent);

    // Extract full Reference objects from all design works
    const references: Reference[] = data.flatMap((dw) => (dw.references || []).map(toFullReference));

    return { designWorks, references };
  }

  /**
   * Get all design works for a solution (basic endpoint without content metadata)
   * @deprecated Use listWithContent for tree view - this returns empty content arrays
   */
  async list(solutionId: string): Promise<DesignWork[]> {
    const { designWorks } = await this.listWithContent(solutionId);
    return designWorks;
  }

  /**
   * Get all design works for a use case with content metadata.
   * Used for embedded design studio view in use case detail.
   */
  async listWithContentByUseCase(solutionId: string, useCaseId: string): Promise<DesignWorksWithReferences> {
    const data = await httpClient.get<DesignWorkWithContentDto[]>(
      `/api/design-works/with-content/by-use-case?solutionId=${solutionId}&useCaseId=${useCaseId}`
    );

    const designWorks = data.map(transformDesignWorkWithContent);
    const references: Reference[] = data.flatMap((dw) => (dw.references || []).map(toFullReference));

    return { designWorks, references };
  }

  /**
   * Get a single design work by ID
   */
  async get(id: string): Promise<DesignWork> {
    const data = await httpClient.get<DesignWork>(`/api/design-works/${id}`);
    return normalizeDesignWork(deserializeDates(data));
  }

  /**
   * Create a new design work
   */
  async create(data: CreateDesignWorkDto): Promise<DesignWork> {
    const result = await httpClient.post<DesignWork>('/api/design-works', data);
    return normalizeDesignWork(deserializeDates(result));
  }

  /**
   * Update an existing design work
   */
  async update(id: string, updates: Partial<UpdateDesignWorkDto>): Promise<DesignWork> {
    const result = await httpClient.put<DesignWork>(`/api/design-works/${id}`, updates);
    return normalizeDesignWork(deserializeDates(result));
  }

  /**
   * Delete a design work
   */
  async delete(id: string): Promise<void> {
    await httpClient.delete(`/api/design-works/${id}`);
  }

  /**
   * Get all descendant IDs recursively (for cascade delete)
   * Note: This is computed client-side by fetching design works and traversing the hierarchy
   */
  async getAllDescendantIds(id: string): Promise<string[]> {
    // Get the design work to find its solution
    const designWork = await this.get(id);
    if (!designWork) return [];

    // Get all design works for the solution
    const allDesignWorks = await this.list(designWork.solutionId);
    const allIds: string[] = [];

    const collectDescendants = (parentId: string) => {
      const children = allDesignWorks.filter((dw) => dw.parentDesignWorkId === parentId);
      children.forEach((child) => {
        allIds.push(child.id);
        collectDescendants(child.id);
      });
    };

    collectDescendants(id);
    return allIds;
  }

  /**
   * Reorder items (folders, diagrams, interfaces, documents)
   * Updates order and optionally moves items to different parents
   */
  async reorder(items: ReorderItemDto[]): Promise<void> {
    await httpClient.post('/api/design-works/reorder', { items });
  }
}

/**
 * DTO for reordering items
 */
export interface ReorderItemDto {
  id: string;
  itemType: 'folder' | 'diagram' | 'interface' | 'document';
  newOrder: number;
  newParentDesignWorkId?: string;
}

export const designWorkApi = new DesignWorkApi();
