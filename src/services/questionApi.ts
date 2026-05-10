import {
  QuestionLabel,
  QuestionMemo
} from '../features/home/types';
import { apiRequest } from './apiClient';

type QuestionDataResponse = {
  questionMemos: QuestionMemo[];
  questionLabels: QuestionLabel[];
};

type QuestionMemoResponse = {
  questionMemo: QuestionMemo;
};

type QuestionLabelResponse = {
  label: QuestionLabel;
};

type QuestionLabelsResponse = {
  labels: QuestionLabel[];
};

export const fetchRemoteQuestionData = async (
  accessToken: string | null
) => {
  const response = await apiRequest<QuestionDataResponse>('/api/questions', {
    accessToken
  });

  return {
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

export const upsertRemoteQuestionMemo = async (
  questionMemo: QuestionMemo,
  accessToken: string | null
) => {
  const response = await apiRequest<QuestionMemoResponse>('/api/questions', {
    method: 'PUT',
    accessToken,
    body: {
      questionMemo: {
        ...questionMemo,
        companyId: questionMemo.companyId ?? null,
        labelIds: questionMemo.labelIds ?? []
      }
    }
  });

  return {
    ...response.questionMemo,
    companyId: response.questionMemo.companyId ?? null,
    labelIds: response.questionMemo.labelIds ?? []
  };
};

export const deleteRemoteQuestionMemo = async (
  id: string,
  accessToken: string | null
) => {
  await apiRequest(`/api/questions?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    accessToken
  });
};

export const createRemoteQuestionLabel = async (
  label: QuestionLabel,
  accessToken: string | null
) => {
  const response = await apiRequest<QuestionLabelResponse>(
    '/api/question-labels',
    {
      method: 'POST',
      accessToken,
      body: { label }
    }
  );

  return {
    ...response.label,
    sortOrder: response.label.sortOrder ?? 0
  };
};

export const reorderRemoteQuestionLabels = async (
  labels: QuestionLabel[],
  accessToken: string | null
) => {
  const response = await apiRequest<QuestionLabelsResponse>(
    '/api/question-labels',
    {
      method: 'PUT',
      accessToken,
      body: {
        labels: labels.map((label, index) => ({
          id: label.id,
          sortOrder: index
        }))
      }
    }
  );

  return response.labels.map((label) => ({
    ...label,
    sortOrder: label.sortOrder ?? 0
  }));
};

export const updateRemoteQuestionLabel = async (
  label: QuestionLabel,
  accessToken: string | null
) => {
  const response = await apiRequest<QuestionLabelResponse>(
    '/api/question-labels',
    {
      method: 'PUT',
      accessToken,
      body: {
        label: {
          id: label.id,
          name: label.name,
          sortOrder: label.sortOrder
        }
      }
    }
  );

  return {
    ...response.label,
    sortOrder: response.label.sortOrder ?? 0
  };
};

export const deleteRemoteQuestionLabel = async (
  id: string,
  accessToken: string | null
) => {
  await apiRequest(`/api/question-labels?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    accessToken
  });
};
