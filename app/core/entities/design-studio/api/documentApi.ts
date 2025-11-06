import { v4 as uuidv4 } from 'uuid';
import type { Document, CreateDocumentDto, UpdateDocumentDto } from '../types';
import { getFromStorage, saveToStorage, simulateDelay } from './storage';

const STORAGE_KEY = 'documents';

class DocumentApi {
  /**
   * Get all documents for a design work
   */
  async list(designWorkId: string): Promise<Document[]> {
    await simulateDelay();
    const documents = getFromStorage<Document>(STORAGE_KEY);
    return documents.filter((d) => d.designWorkId === designWorkId);
  }

  /**
   * Get all documents
   */
  async listAll(): Promise<Document[]> {
    await simulateDelay();
    return getFromStorage<Document>(STORAGE_KEY);
  }

  /**
   * Get a single document by ID
   */
  async get(id: string): Promise<Document | null> {
    await simulateDelay();
    const documents = getFromStorage<Document>(STORAGE_KEY);
    return documents.find((d) => d.id === id) || null;
  }

  /**
   * Create a new document
   */
  async create(data: CreateDocumentDto): Promise<Document> {
    await simulateDelay();

    const document: Document = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const documents = getFromStorage<Document>(STORAGE_KEY);
    documents.push(document);
    saveToStorage(STORAGE_KEY, documents);

    return document;
  }

  /**
   * Update an existing document
   */
  async update(id: string, updates: Partial<UpdateDocumentDto>): Promise<Document | null> {
    await simulateDelay();

    const documents = getFromStorage<Document>(STORAGE_KEY);
    const index = documents.findIndex((d) => d.id === id);

    if (index === -1) {
      return null;
    }

    documents[index] = {
      ...documents[index],
      ...updates,
      id,
      updatedAt: new Date(),
    };

    saveToStorage(STORAGE_KEY, documents);
    return documents[index];
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<boolean> {
    await simulateDelay();

    const documents = getFromStorage<Document>(STORAGE_KEY);
    const filtered = documents.filter((d) => d.id !== id);

    if (filtered.length === documents.length) {
      return false;
    }

    saveToStorage(STORAGE_KEY, filtered);
    return true;
  }

  /**
   * Delete all documents for a design work
   */
  async deleteByDesignWorkId(designWorkId: string): Promise<number> {
    await simulateDelay();

    const documents = getFromStorage<Document>(STORAGE_KEY);
    const filtered = documents.filter((d) => d.designWorkId !== designWorkId);
    const deletedCount = documents.length - filtered.length;

    saveToStorage(STORAGE_KEY, filtered);
    return deletedCount;
  }
}

export const documentApi = new DocumentApi();
