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
    questionLabels: response.questionLabels
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
  await apiRequest(`/api/questions/${encodeURIComponent(id)}`, {
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

  return response.label;
};
