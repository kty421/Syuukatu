import { ScheduleCategory } from '../features/home/types';
import { apiRequest } from './apiClient';

type ScheduleCategoryResponse = {
  category: ScheduleCategory;
};

export const upsertRemoteScheduleCategory = async (
  category: ScheduleCategory,
  accessToken: string | null
) => {
  const response = await apiRequest<ScheduleCategoryResponse>(
    '/api/schedule-categories',
    {
      method: 'PUT',
      accessToken,
      body: {
        category
      }
    }
  );

  return response.category;
};

export const deleteRemoteScheduleCategory = async (
  id: string,
  accessToken: string | null
) => {
  await apiRequest(`/api/schedule-categories?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    accessToken
  });
};
