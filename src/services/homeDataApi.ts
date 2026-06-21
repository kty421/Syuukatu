import {
  Company,
  CompanySchedule,
  QuestionLabel,
  QuestionMemo,
  ScheduleCategory
} from '../features/home/types';
import { apiRequest } from './apiClient';

type HomeDataResponse = {
  companies: Company[];
  companySchedules: CompanySchedule[];
  scheduleCategories: ScheduleCategory[];
  questionMemos: QuestionMemo[];
  questionLabels: QuestionLabel[];
};

type CompaniesResponse = {
  companies: Company[];
};

type SchedulesResponse = {
  schedules: CompanySchedule[];
};

type ScheduleCategoriesResponse = {
  categories: ScheduleCategory[];
};

type QuestionDataResponse = {
  questionLabels: QuestionLabel[];
  questionMemos: QuestionMemo[];
};

const stripPassword = (company: Company): Company => ({
  ...company,
  password: ''
});

export const fetchRemoteHomeData = async (accessToken: string | null) => {
  const [companyResponse, scheduleResponse, categoryResponse, questionResponse] =
    await Promise.all([
      apiRequest<CompaniesResponse>('/api/companies', {
        accessToken
      }),
      apiRequest<SchedulesResponse>('/api/schedules', {
        accessToken
      }),
      apiRequest<ScheduleCategoriesResponse>('/api/schedule-categories', {
        accessToken
      }),
      apiRequest<QuestionDataResponse>('/api/questions', {
      accessToken
      })
    ]);

  const homeData: HomeDataResponse = {
    companies: companyResponse.companies.map(stripPassword),
    companySchedules: scheduleResponse.schedules,
    scheduleCategories: categoryResponse.categories,
    questionMemos: questionResponse.questionMemos.map((memo) => ({
      ...memo,
      companyId: memo.companyId ?? null,
      labelIds: memo.labelIds ?? []
    })),
    questionLabels: questionResponse.questionLabels.map((label) => ({
      ...label,
      sortOrder: label.sortOrder ?? 0
    }))
  };

  return homeData;
};
