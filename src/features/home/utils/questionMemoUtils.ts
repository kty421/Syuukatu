import { Company, CompanyQuestionAnswer } from '../types';

export type QuestionMemoStatus = 'unanswered' | 'answered';
export type QuestionMemoFilter = 'all' | QuestionMemoStatus;
export type QuestionMemoSort =
  | 'titleAsc'
  | 'updatedAtDesc'
  | 'updatedAtAsc';

export type QuestionMemoEntry = {
  company: Company;
  questionAnswer: CompanyQuestionAnswer;
  status: QuestionMemoStatus;
};

export const hasQuestionMemoAnswer = (item: CompanyQuestionAnswer) => {
  return Boolean(item.answer.trim());
};

export const getQuestionMemoStatus = (
  item: CompanyQuestionAnswer
): QuestionMemoStatus => {
  return hasQuestionMemoAnswer(item) ? 'answered' : 'unanswered';
};

export const flattenQuestionMemos = (companies: Company[]): QuestionMemoEntry[] =>
  companies
    .filter((company) => !company.archived)
    .flatMap((company) =>
      (company.questionAnswers ?? [])
        .filter((item) => item.question.trim() || item.answer.trim())
        .map((questionAnswer) => ({
          company,
          questionAnswer,
          status: getQuestionMemoStatus(questionAnswer)
        }))
    );

export const countQuestionMemos = (entries: QuestionMemoEntry[]) =>
  entries.reduce(
    (counts, entry) => {
      counts.all += 1;
      counts[entry.status] += 1;
      return counts;
    },
    { all: 0, unanswered: 0, answered: 0 }
  );

export const filterQuestionMemos = (
  entries: QuestionMemoEntry[],
  query: string,
  filter: QuestionMemoFilter
) => {
  const normalizedQuery = query.trim().toLowerCase();

  return entries
    .filter((entry) => filter === 'all' || entry.status === filter)
    .filter((entry) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
        entry.questionAnswer.question,
        entry.questionAnswer.answer,
        entry.company.companyName,
        entry.company.industry,
        entry.company.role,
        entry.company.memo,
        ...entry.company.tags
      ]
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

const getUpdatedAtTime = (entry: QuestionMemoEntry) =>
  toTime(
    entry.questionAnswer.updatedAt ||
      entry.questionAnswer.createdAt ||
      entry.company.updatedAt
  );

export const sortQuestionMemos = (
  entries: QuestionMemoEntry[],
  sort: QuestionMemoSort
) =>
  [...entries].sort((a, b) => {
    if (sort === 'titleAsc') {
      const titleOrder = a.questionAnswer.question.localeCompare(
        b.questionAnswer.question,
        'ja'
      );

      if (titleOrder !== 0) {
        return titleOrder;
      }

      return a.company.companyName.localeCompare(b.company.companyName, 'ja');
    }

    const timeOrder =
      sort === 'updatedAtAsc'
        ? getUpdatedAtTime(a) - getUpdatedAtTime(b)
        : getUpdatedAtTime(b) - getUpdatedAtTime(a);

    if (timeOrder !== 0) {
      return timeOrder;
    }

    return a.company.companyName.localeCompare(b.company.companyName, 'ja');
  });
