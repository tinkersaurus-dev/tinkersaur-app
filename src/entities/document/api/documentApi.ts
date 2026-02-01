import type { Document, CreateDocumentDto, UpdateDocumentDto } from '../model/types';
import { httpClient, deserializeDates, deserializeDatesArray } from '@/shared/api';

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
  async get(id: string): Promise<Document> {
    const data = await httpClient.get<Document>(`/api/documents/${id}`);
    return deserializeDates(data);
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
  async update(id: string, updates: Partial<UpdateDocumentDto>): Promise<Document> {
    const result = await httpClient.put<Document>(`/api/documents/${id}`, updates);
    return deserializeDates(result);
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    await httpClient.delete(`/api/documents/${id}`);
  }

  /**
   * Delete all documents for a design work
   */
  async deleteByDesignWorkId(designWorkId: string): Promise<number> {
    const documents = await this.list(designWorkId);
    for (const doc of documents) {
      await this.delete(doc.id);
    }
    return documents.length;
  }
}

export const documentApi = new DocumentApi();
