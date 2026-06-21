import { QuestionLabel, QuestionMemo } from '../entities/question';

export type QuestionRepository = {
  createLabel: (
    label: QuestionLabel,
    accessToken: string | null
  ) => Promise<QuestionLabel>;
  deleteLabel: (id: string, accessToken: string | null) => Promise<void>;
  deleteMemo: (id: string, accessToken: string | null) => Promise<void>;
  listQuestionData: (
    accessToken: string | null
  ) => Promise<{
    questionLabels: QuestionLabel[];
    questionMemos: QuestionMemo[];
  }>;
  reorderLabels: (
    labels: QuestionLabel[],
    accessToken: string | null
  ) => Promise<QuestionLabel[]>;
  updateLabel: (
    label: Pick<QuestionLabel, 'id' | 'name' | 'sortOrder'>,
    accessToken: string | null
  ) => Promise<QuestionLabel>;
  upsertMemo: (
    memo: QuestionMemo,
    accessToken: string | null
  ) => Promise<QuestionMemo>;
};
