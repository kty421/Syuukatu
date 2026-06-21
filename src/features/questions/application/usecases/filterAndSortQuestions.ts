import { QuestionLabel, QuestionMemo } from '../../domain/entities/question';

export type QuestionSort = 'newest' | 'oldest' | 'company';

const toTime = (value?: string) => {
  if (!value) {
    return 0;
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
};

export const uniqueLabelIds = (labelIds: string[]) =>
  [...new Set(labelIds.map((labelId) => labelId.trim()).filter(Boolean))];

export const sortQuestionLabels = (labels: QuestionLabel[]) =>
  [...labels].sort((a, b) => {
    const sortOrderDiff = a.sortOrder - b.sortOrder;

    if (sortOrderDiff !== 0) {
      return sortOrderDiff;
    }

    return toTime(a.createdAt) - toTime(b.createdAt);
  });

export const filterQuestionMemos = (
  memos: QuestionMemo[],
  query: string,
  selectedLabelId: string | null
) => {
  const normalizedQuery = query.trim().toLowerCase();

  return memos.filter((memo) => {
    if (selectedLabelId && !memo.labelIds.includes(selectedLabelId)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return `${memo.question} ${memo.answer}`.toLowerCase().includes(normalizedQuery);
  });
};

export const sortQuestionMemos = (
  memos: QuestionMemo[],
  sort: QuestionSort
) => {
  if (sort === 'oldest') {
    return [...memos].sort((a, b) => toTime(a.updatedAt) - toTime(b.updatedAt));
  }

  return [...memos].sort((a, b) => toTime(b.updatedAt) - toTime(a.updatedAt));
};
