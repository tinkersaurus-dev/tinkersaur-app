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
function toDiagramRef(dto: ContentMetadataDto, index: number): DiagramRef {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type as DiagramRef['type'],
    order: index,
  };
}

/**
 * Transform backend ContentMetadataDto to frontend InterfaceRef
 */
function toInterfaceRef(dto: ContentMetadataDto, index: number): InterfaceRef {
  return {
    id: dto.id,
    name: dto.name,
    fidelity: dto.type as InterfaceRef['fidelity'],
    order: index,
  };
}

/**
 * Transform backend ContentMetadataDto to frontend DocumentRef
 */
function toDocumentRef(dto: ContentMetadataDto, index: number): DocumentRef {
  return {
    id: dto.id,
    name: dto.name,
    order: index,
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
   * Get a single design work by ID
   */
  async get(id: string): Promise<DesignWork | null> {
    try {
      const data = await httpClient.get<DesignWork>(`/api/design-works/${id}`);
      return normalizeDesignWork(deserializeDates(data));
    } catch {
      return null;
    }
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
  async update(id: string, updates: Partial<UpdateDesignWorkDto>): Promise<DesignWork | null> {
    try {
      const result = await httpClient.put<DesignWork>(`/api/design-works/${id}`, updates);
      return normalizeDesignWork(deserializeDates(result));
    } catch {
      return null;
    }
  }

  /**
   * Delete a design work
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/design-works/${id}`);
      return true;
    } catch {
      return false;
    }
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
}

export const designWorkApi = new DesignWorkApi();
