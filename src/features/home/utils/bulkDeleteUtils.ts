import {
  Company,
  CompanySchedule,
  QuestionMemo,
} from "../types";
import { sortSchedules } from "./scheduleUtils";

export type BulkDeleteResult = {
  succeededIds: string[];
  failedIds: string[];
  credentialCleanupFailedIds: string[];
};

export type CompanyBulkDeleteSnapshot = {
  targetIds: string[];
  companies: Company[];
  schedules: CompanySchedule[];
  questionLinks: Array<{
    memoId: string;
    companyId: string;
  }>;
};

export type CompanyBulkDeletePreview = {
  companies: Company[];
  schedules: CompanySchedule[];
  questionMemos: QuestionMemo[];
  snapshot: CompanyBulkDeleteSnapshot;
};

export type QuestionMemoBulkDeletePreview = {
  questionMemos: QuestionMemo[];
  deletedQuestionMemos: QuestionMemo[];
  targetIds: string[];
};

const toTime = (value?: string) => {
  if (!value) {
    return 0;
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
};

const sortCompanies = (companies: Company[]) =>
  [...companies].sort((first, second) =>
    toTime(second.updatedAt) - toTime(first.updatedAt),
  );

const sortQuestionMemos = (questionMemos: QuestionMemo[]) =>
  [...questionMemos].sort(
    (first, second) =>
      toTime(second.updatedAt) - toTime(first.updatedAt),
  );

const uniqueIds = (ids: Iterable<string>) => [...new Set(ids)];

export const createCompanyBulkDeletePreview = (
  companies: Company[],
  schedules: CompanySchedule[],
  questionMemos: QuestionMemo[],
  requestedIds: Iterable<string>,
): CompanyBulkDeletePreview => {
  const requestedIdSet = new Set(requestedIds);
  const deletedCompanies = companies.filter((company) =>
    requestedIdSet.has(company.id),
  );
  const targetIds = deletedCompanies.map((company) => company.id);
  const targetIdSet = new Set(targetIds);

  return {
    companies: companies.filter((company) => !targetIdSet.has(company.id)),
    schedules: schedules.filter(
      (schedule) => !targetIdSet.has(schedule.companyId),
    ),
    questionMemos: questionMemos.map((questionMemo) =>
      questionMemo.companyId && targetIdSet.has(questionMemo.companyId)
        ? { ...questionMemo, companyId: null }
        : questionMemo,
    ),
    snapshot: {
      targetIds,
      companies: deletedCompanies,
      schedules: schedules.filter((schedule) =>
        targetIdSet.has(schedule.companyId),
      ),
      questionLinks: questionMemos.flatMap((questionMemo) =>
        questionMemo.companyId && targetIdSet.has(questionMemo.companyId)
          ? [
              {
                memoId: questionMemo.id,
                companyId: questionMemo.companyId,
              },
            ]
          : [],
      ),
    },
  };
};

export const restoreFailedCompanyDeletes = (
  companies: Company[],
  schedules: CompanySchedule[],
  questionMemos: QuestionMemo[],
  snapshot: CompanyBulkDeleteSnapshot,
  failedIds: Iterable<string>,
) => {
  const failedIdSet = new Set(failedIds);
  const existingCompanyIds = new Set(companies.map((company) => company.id));
  const existingScheduleIds = new Set(schedules.map((schedule) => schedule.id));
  const restoredCompanies = snapshot.companies.filter(
    (company) =>
      failedIdSet.has(company.id) && !existingCompanyIds.has(company.id),
  );
  const restoredSchedules = snapshot.schedules.filter(
    (schedule) =>
      failedIdSet.has(schedule.companyId) &&
      !existingScheduleIds.has(schedule.id),
  );
  const failedQuestionLinks = new Map(
    snapshot.questionLinks
      .filter((link) => failedIdSet.has(link.companyId))
      .map((link) => [link.memoId, link.companyId]),
  );

  return {
    companies: sortCompanies([...companies, ...restoredCompanies]),
    schedules: sortSchedules([...schedules, ...restoredSchedules]),
    questionMemos: questionMemos.map((questionMemo) => {
      const companyId = failedQuestionLinks.get(questionMemo.id);

      if (!companyId || questionMemo.companyId !== null) {
        return questionMemo;
      }

      return { ...questionMemo, companyId };
    }),
  };
};

export const createQuestionMemoBulkDeletePreview = (
  questionMemos: QuestionMemo[],
  requestedIds: Iterable<string>,
): QuestionMemoBulkDeletePreview => {
  const requestedIdSet = new Set(requestedIds);
  const deletedQuestionMemos = questionMemos.filter((questionMemo) =>
    requestedIdSet.has(questionMemo.id),
  );
  const targetIds = deletedQuestionMemos.map((questionMemo) => questionMemo.id);
  const targetIdSet = new Set(targetIds);

  return {
    questionMemos: questionMemos.filter(
      (questionMemo) => !targetIdSet.has(questionMemo.id),
    ),
    deletedQuestionMemos,
    targetIds,
  };
};

export const restoreFailedQuestionMemoDeletes = (
  questionMemos: QuestionMemo[],
  deletedQuestionMemos: QuestionMemo[],
  failedIds: Iterable<string>,
) => {
  const failedIdSet = new Set(failedIds);
  const existingIds = new Set(questionMemos.map((questionMemo) => questionMemo.id));
  const restoredQuestionMemos = deletedQuestionMemos.filter(
    (questionMemo) =>
      failedIdSet.has(questionMemo.id) && !existingIds.has(questionMemo.id),
  );

  return sortQuestionMemos([...questionMemos, ...restoredQuestionMemos]);
};

export const partitionSettledDeleteIds = (
  ids: Iterable<string>,
  outcomes: PromiseSettledResult<unknown>[],
) => {
  const targetIds = uniqueIds(ids);
  const succeededIds: string[] = [];
  const failedIds: string[] = [];

  targetIds.forEach((id, index) => {
    if (outcomes[index]?.status === "fulfilled") {
      succeededIds.push(id);
      return;
    }

    failedIds.push(id);
  });

  return { succeededIds, failedIds };
};
