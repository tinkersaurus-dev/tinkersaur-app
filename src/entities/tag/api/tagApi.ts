import { httpClient, deserializeDatesArray } from '@/shared/api';
import type { Tag } from '../model/types';

export const tagApi = {
  listByTeam: async (teamId: string): Promise<Tag[]> => {
    const data = await httpClient.get<Tag[]>(`/api/tags?teamId=${teamId}`);
    return deserializeDatesArray(data);
  },
};
