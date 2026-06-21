import { apiRequest } from '../../../../shared/api/apiClient';
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';
import {
  CompanyScheduleDto,
  ScheduleCategoryDto,
  toCompanyScheduleDomain,
  toCompanyScheduleRequestDto,
  toScheduleCategoryDomain,
  toScheduleCategoryRequestDto
} from '../mappers/scheduleMapper';

type SchedulesResponse = {
  schedules: CompanyScheduleDto[];
};

type ScheduleResponse = {
  schedule: CompanyScheduleDto;
};

type CategoriesResponse = {
  categories: ScheduleCategoryDto[];
};

type CategoryResponse = {
  category: ScheduleCategoryDto;
};

export const httpScheduleRepository: ScheduleRepository = {
  deleteCategory: async (id, accessToken) => {
    await apiRequest(`/api/schedule-categories?id=${encodeURIComponent(id)}`, {
      accessToken,
      method: 'DELETE'
    });
  },
  deleteSchedule: async (id, accessToken) => {
    await apiRequest(`/api/schedules?id=${encodeURIComponent(id)}`, {
      accessToken,
      method: 'DELETE'
    });
  },
  listCategories: async (accessToken) => {
    const response = await apiRequest<CategoriesResponse>(
      '/api/schedule-categories',
      { accessToken }
    );

    return response.categories.map(toScheduleCategoryDomain);
  },
  listSchedules: async (accessToken) => {
    const response = await apiRequest<SchedulesResponse>('/api/schedules', {
      accessToken
    });

    return response.schedules.map(toCompanyScheduleDomain);
  },
  upsertCategory: async (category, accessToken) => {
    const response = await apiRequest<CategoryResponse>(
      '/api/schedule-categories',
      {
        accessToken,
        body: toScheduleCategoryRequestDto(category),
        method: 'PUT'
      }
    );

    return toScheduleCategoryDomain(response.category);
  },
  upsertSchedule: async (schedule, accessToken) => {
    const response = await apiRequest<ScheduleResponse>('/api/schedules', {
      accessToken,
      body: toCompanyScheduleRequestDto(schedule),
      method: 'PUT'
    });

    return toCompanyScheduleDomain(response.schedule);
  }
};
