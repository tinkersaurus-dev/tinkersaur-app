import type { FeedbackUseCase, CreateFeedbackUseCaseDto } from '../types';
import { httpClient, deserializeDates, deserializeDatesArray } from '~/core/api/httpClient';

/**
 * FeedbackUseCase API Client
 * Real implementation with backend API for the junction table
 */
class FeedbackUseCaseApi {
  /**
   * Get all feedback-usecase links for a feedback
   */
  async listByFeedback(feedbackId: string): Promise<FeedbackUseCase[]> {
    const data = await httpClient.get<FeedbackUseCase[]>(`/api/feedback-use-cases?feedbackId=${feedbackId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get all feedback-usecase links for a use case
   */
  async listByUseCase(useCaseId: string): Promise<FeedbackUseCase[]> {
    const data = await httpClient.get<FeedbackUseCase[]>(`/api/feedback-use-cases?useCaseId=${useCaseId}`);
    return deserializeDatesArray(data);
  }

  /**
   * Get a single link by ID
   */
  async get(id: string): Promise<FeedbackUseCase | null> {
    try {
      const data = await httpClient.get<FeedbackUseCase>(`/api/feedback-use-cases/${id}`);
      return deserializeDates(data);
    } catch {
      return null;
    }
  }

  /**
   * Check if a link already exists between a feedback and use case
   */
  async exists(feedbackId: string, useCaseId: string): Promise<boolean> {
    try {
      const data = await httpClient.get<FeedbackUseCase[]>(
        `/api/feedback-use-cases?feedbackId=${feedbackId}&useCaseId=${useCaseId}`
      );
      return data.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Create a new feedback-usecase link
   */
  async create(data: CreateFeedbackUseCaseDto): Promise<FeedbackUseCase> {
    const result = await httpClient.post<FeedbackUseCase>('/api/feedback-use-cases', data);
    return deserializeDates(result);
  }

  /**
   * Delete a link by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/feedback-use-cases/${id}`);
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
   * Delete all links for a use case
   */
  async deleteByUseCaseId(useCaseId: string): Promise<number> {
    try {
      const links = await this.listByUseCase(useCaseId);
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

export const feedbackUseCaseApi = new FeedbackUseCaseApi();
