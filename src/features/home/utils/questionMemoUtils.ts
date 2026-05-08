import { Company, QuestionLabel, QuestionMemo } from '../types';

export type QuestionMemoSort =
  | 'titleAsc'
  | 'updatedAtDesc'
  | 'createdAtDesc';

export type QuestionMemoEntry = {
  company: Company | null;
  questionMemo: QuestionMemo;
  labels: QuestionLabel[];
};

export const UNASSIGNED_COMPANY_TITLE = '企業との対応なし';

export const flattenQuestionMemos = (
  companies: Company[],
  questionMemos: QuestionMemo[],
  labels: QuestionLabel[]
): QuestionMemoEntry[] => {
  const companyById = new Map(
    companies
      .filter((company) => !company.archived)
      .map((company) => [company.id, company])
  );
  const labelById = new Map(labels.map((label) => [label.id, label]));

  return questionMemos
    .filter((item) => item.question.trim() || item.answer.trim())
    .map((questionMemo) => ({
      company: questionMemo.companyId
        ? companyById.get(questionMemo.companyId) ?? null
        : null,
      questionMemo,
      labels: questionMemo.labelIds
        .map((labelId) => labelById.get(labelId))
        .filter((label): label is QuestionLabel => Boolean(label))
    }));
};

export const filterQuestionMemos = (
  entries: QuestionMemoEntry[],
  query: string,
  labelId: string | null
) => {
  const normalizedQuery = query.trim().toLowerCase();

  return entries
    .filter(
      (entry) => !labelId || entry.questionMemo.labelIds.includes(labelId)
    )
    .filter((entry) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
        entry.questionMemo.question,
        entry.questionMemo.answer,
        entry.company?.companyName,
        entry.company?.industry,
        entry.company?.role,
        entry.company?.memo,
        ...(entry.company?.tags ?? []),
        ...entry.labels.map((label) => label.name),
        entry.company ? '' : UNASSIGNED_COMPANY_TITLE
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
};

const toTime = (value?: string) => {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getCompanyName = (entry: QuestionMemoEntry) =>
  entry.company?.companyName ?? UNASSIGNED_COMPANY_TITLE;

const getUpdatedAtTime = (entry: QuestionMemoEntry) =>
  toTime(entry.questionMemo.updatedAt || entry.questionMemo.createdAt);

const getCreatedAtTime = (entry: QuestionMemoEntry) =>
  toTime(entry.questionMemo.createdAt);

export const sortQuestionMemos = (
  entries: QuestionMemoEntry[],
  sort: QuestionMemoSort
) =>
  [...entries].sort((a, b) => {
    if (sort === 'titleAsc') {
      const titleOrder = a.questionMemo.question.localeCompare(
        b.questionMemo.question,
        'ja'
      );

      if (titleOrder !== 0) {
        return titleOrder;
      }

      return getCompanyName(a).localeCompare(getCompanyName(b), 'ja');
    }

    const timeOrder =
      sort === 'createdAtDesc'
        ? getCreatedAtTime(b) - getCreatedAtTime(a)
        : getUpdatedAtTime(b) - getUpdatedAtTime(a);

    if (timeOrder !== 0) {
      return timeOrder;
    }

    return getCompanyName(a).localeCompare(getCompanyName(b), 'ja');
  });
