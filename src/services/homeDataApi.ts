import { Company, QuestionLabel, QuestionMemo } from '../features/home/types';
import { apiRequest } from './apiClient';

type HomeDataResponse = {
  companies: Company[];
  questionMemos: QuestionMemo[];
  questionLabels: QuestionLabel[];
};

const stripPassword = (company: Company): Company => ({
  ...company,
  password: ''
});

export const fetchRemoteHomeData = async (accessToken: string | null) => {
  const response = await apiRequest<HomeDataResponse>('/api/home-data', {
    accessToken
  });

  return {
    companies: response.companies.map(stripPassword),
    questionMemos: response.questionMemos.map((memo) => ({
      ...memo,
      companyId: memo.companyId ?? null,
      labelIds: memo.labelIds ?? []
    })),
    questionLabels: response.questionLabels.map((label) => ({
      ...label,
      sortOrder: label.sortOrder ?? 0
    }))
  };
};
