import type { FeedbackPersona, CreateFeedbackPersonaDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * FeedbackPersona API Client
 * Real implementation with backend API for the junction table
 */
class FeedbackPersonaApi {
  /**
   * Get all feedback-persona links for a feedback
   */
  async listByFeedback(feedbackId: string): Promise<FeedbackPersona[]> {
    const data = await httpClient.get<FeedbackPersona[]>(`/api/feedback-personas?feedbackId=${feedbackId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get all feedback-persona links for a persona
   */
  async listByPersona(personaId: string): Promise<FeedbackPersona[]> {
    const data = await httpClient.get<FeedbackPersona[]>(`/api/feedback-personas?personaId=${personaId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get a single link by ID
   */
  async get(id: string): Promise<FeedbackPersona | null> {
    try {
      const data = await httpClient.get<FeedbackPersona>(`/api/feedback-personas/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Check if a link already exists between a feedback and persona
   */
  async exists(feedbackId: string, personaId: string): Promise<boolean> {
    try {
      const data = await httpClient.get<FeedbackPersona[]>(
        `/api/feedback-personas?feedbackId=${feedbackId}&personaId=${personaId}`
      );
      return data.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Create a new feedback-persona link
   */
  async create(data: CreateFeedbackPersonaDto): Promise<FeedbackPersona> {
    const result = await httpClient.post<FeedbackPersona>('/api/feedback-personas', data);
    return deserializeDates(result);
  }

  /**
   * Delete a link by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/feedback-personas/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete all links for a feedback
   */
  async deleteByFeedbackId(feedbackId: string): Promise<number> {
    try {
      const links = await this.listByFeedback(feedbackId);
      let deletedCount = 0;
      for (const link of links) {
        const success = await this.delete(link.id);
        if (success) deletedCount++;
      }
      return deletedCount;
    } catch {
      return 0;
    }
  }

  /**
   * Delete all links for a persona
   */
  async deleteByPersonaId(personaId: string): Promise<number> {
    try {
      const links = await this.listByPersona(personaId);
      let deletedCount = 0;
      for (const link of links) {
        const success = await this.delete(link.id);
        if (success) deletedCount++;
      }
      return deletedCount;
    } catch {
      return 0;
    }
  }
}

export const feedbackPersonaApi = new FeedbackPersonaApi();
