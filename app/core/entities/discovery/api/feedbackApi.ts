import type { Feedback, CreateFeedbackDto } from '../types';
import { createEntityApi } from '~/core/api/createEntityApi';

const baseApi = createEntityApi<Feedback, CreateFeedbackDto>({
  endpoint: '/api/feedbacks',
  parentParam: 'teamId',
});

export const feedbackApi = {
  ...baseApi,
  listByTeam: baseApi.list,
};
