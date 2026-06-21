import { apiRequest } from '../../../../shared/api/apiClient';
import { QuestionMemo } from '../../domain/entities/question';
import { QuestionRepository } from '../../domain/repositories/QuestionRepository';
import {
  QuestionLabelDto,
  QuestionMemoDto,
  toQuestionLabelDomain,
  toQuestionMemoDomain,
  toQuestionMemoRequestDto
} from '../mappers/questionMapper';

type QuestionDataResponse = {
  questionLabels: QuestionLabelDto[];
  questionMemos: QuestionMemoDto[];
};

type QuestionMemoResponse = {
  questionMemo: QuestionMemoDto;
};

type QuestionLabelResponse = {
  label: QuestionLabelDto;
};

type QuestionLabelsResponse = {
  labels: QuestionLabelDto[];
};

export const httpQuestionRepository: QuestionRepository = {
  createLabel: async (label, accessToken) => {
    const response = await apiRequest<QuestionLabelResponse>(
      '/api/question-labels',
      {
        accessToken,
        body: { label },
        method: 'POST'
      }
    );

    return toQuestionLabelDomain(response.label);
  },
  deleteLabel: async (id, accessToken) => {
    await apiRequest(`/api/question-labels?id=${encodeURIComponent(id)}`, {
      accessToken,
      method: 'DELETE'
    });
  },
  deleteMemo: async (id, accessToken) => {
    await apiRequest(`/api/questions?id=${encodeURIComponent(id)}`, {
      accessToken,
      method: 'DELETE'
    });
  },
  listQuestionData: async (accessToken) => {
    const response = await apiRequest<QuestionDataResponse>('/api/questions', {
      accessToken
    });

    return {
      questionLabels: response.questionLabels.map(toQuestionLabelDomain),
      questionMemos: response.questionMemos.map(toQuestionMemoDomain)
    };
  },
  reorderLabels: async (labels, accessToken) => {
    const response = await apiRequest<QuestionLabelsResponse>(
      '/api/question-labels',
      {
        accessToken,
        body: {
          labels: labels.map((label, index) => ({
            id: label.id,
            sortOrder: index
          }))
        },
        method: 'PUT'
      }
    );

    return response.labels.map(toQuestionLabelDomain);
  },
  updateLabel: async (label, accessToken) => {
    const response = await apiRequest<QuestionLabelResponse>(
      '/api/question-labels',
      {
        accessToken,
        body: { label },
        method: 'PUT'
      }
    );

    return toQuestionLabelDomain(response.label);
  },
  upsertMemo: async (memo: QuestionMemo, accessToken) => {
    const response = await apiRequest<QuestionMemoResponse>('/api/questions', {
      accessToken,
      body: toQuestionMemoRequestDto(memo),
      method: 'PUT'
    });

    return toQuestionMemoDomain(response.questionMemo);
  }
};
