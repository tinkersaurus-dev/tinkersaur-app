import type { Document, CreateDocumentDto, UpdateDocumentDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * Document API Client
 * Real implementation with backend API
 */
class DocumentApi {
  /**
   * Get all documents for a design work
   */
  async list(designWorkId: string): Promise<Document[]> {
    const data = await httpClient.get<Document[]>(`/api/documents?designWorkId=${designWorkId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get a single document by ID
   */
  async get(id: string): Promise<Document | null> {
    try {
      const data = await httpClient.get<Document>(`/api/documents/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Create a new document
   */
  async create(data: CreateDocumentDto): Promise<Document> {
    const result = await httpClient.post<Document>('/api/documents', data);
    return deserializeDates(result);
  }

  /**
   * Update an existing document
   */
  async update(id: string, updates: Partial<UpdateDocumentDto>): Promise<Document | null> {
    try {
      const result = await httpClient.put<Document>(`/api/documents/${id}`, updates);
      return deserializeDates(result);
    } catch {
      return null;
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/documents/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete all documents for a design work
   */
  async deleteByDesignWorkId(designWorkId: string): Promise<number> {
    try {
      const documents = await this.list(designWorkId);
      let deletedCount = 0;
      for (const doc of documents) {
        const success = await this.delete(doc.id);
        if (success) deletedCount++;
      }
      return deletedCount;
    } catch {
      return 0;
    }
  }
}

export const documentApi = new DocumentApi();
