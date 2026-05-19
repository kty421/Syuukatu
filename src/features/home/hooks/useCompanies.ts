import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
  deleteRemoteCompany,
  deleteRemoteCompanySchedule,
  upsertRemoteCompanySchedule,
  upsertRemoteCompany
} from '../../../services/companyApi';
import { fetchRemoteHomeData } from '../../../services/homeDataApi';
import {
  createRemoteQuestionLabel,
  deleteRemoteQuestionLabel,
  deleteRemoteQuestionMemo,
  reorderRemoteQuestionLabels,
  updateRemoteQuestionLabel,
  upsertRemoteQuestionMemo
} from '../../../services/questionApi';
import {
  clearAccountLocalData,
  deleteCompanyCredential,
  hasCompletedLocalMigration,
  hydrateNativePasswords,
  loadLocalCompaniesForMigration,
  markLocalMigrationComplete,
  purgeLegacyWebCredentials,
  saveNativeCompanyPassword
} from '../../../services/secureCompanyStore';
import {
  Company,
  CompanyDraft,
  CompanySchedule,
  QuestionLabel,
  QuestionMemo,
  QuestionMemoDraft
} from '../types';
import { sortSchedules } from '../utils/scheduleUtils';

const createId = () =>
  `company-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createQuestionId = () =>
  `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createLabelId = () =>
  `label-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createScheduleId = () =>
  `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const LOCAL_QUESTION_LABEL_PREVIEW_NOTICE =
  'ローカルプレビューとして反映しました。API反映後に再確認してください。';
const shouldKeepLocalQuestionLabelPreview = __DEV__ && Platform.OS === 'ios';

const toTime = (value: string | undefined) => {
  if (!value) {
    return 0;
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
};

const sortCompanies = (companies: Company[]) =>
  [...companies].sort((a, b) => toTime(b.updatedAt) - toTime(a.updatedAt));

const sortQuestionMemosByUpdate = (questionMemos: QuestionMemo[]) =>
  [...questionMemos].sort(
    (a, b) => toTime(b.updatedAt) - toTime(a.updatedAt)
  );

const sortQuestionLabels = (labels: QuestionLabel[]) =>
  [...labels].sort((a, b) => {
    const sortOrderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

    if (sortOrderDiff !== 0) {
      return sortOrderDiff;
    }

    const timeOrder = toTime(a.createdAt) - toTime(b.createdAt);

    if (timeOrder !== 0) {
      return timeOrder;
    }

    return a.name.localeCompare(b.name, 'ja');
  });

const unique = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))];

const areStringArraysEqual = (first: string[], second: string[]) =>
  first.length === second.length &&
  first.every((value, index) => value === second[index]);

const mergeByNewestUpdate = (current: Company[], local: Company[]) => {
  const byId = new Map<string, Company>();

  for (const company of [...current, ...local]) {
    const existing = byId.get(company.id);

    if (
      !existing ||
      toTime(company.updatedAt) > toTime(existing.updatedAt)
    ) {
      byId.set(company.id, company);
    }
  }

  return sortCompanies([...byId.values()]);
};

const mergeQuestionMemosByNewestUpdate = (
  current: QuestionMemo[],
  incoming: QuestionMemo[]
) => {
  const byId = new Map<string, QuestionMemo>();

  for (const questionMemo of [...current, ...incoming]) {
    const existing = byId.get(questionMemo.id);

    if (
      !existing ||
      toTime(questionMemo.updatedAt) > toTime(existing.updatedAt)
    ) {
      byId.set(questionMemo.id, questionMemo);
    }
  }

  return sortQuestionMemosByUpdate([...byId.values()]);
};

const extractLegacyQuestionMemos = (companies: Company[]): QuestionMemo[] =>
  companies.flatMap((company) =>
    (company.questionAnswers ?? [])
      .filter((item) => item.question.trim() || item.answer.trim())
      .map((item, index) => ({
        id: item.id || `legacy-${company.id}-${index}`,
        companyId: company.id,
        question: item.question.trim(),
        answer: item.answer.trim(),
        labelIds: unique(item.labelIds ?? []),
        createdAt: item.createdAt || company.createdAt,
        updatedAt: item.updatedAt || company.updatedAt
      }))
  );

type UseCompaniesParams = {
  userId: string;
  getAccessToken: () => Promise<string | null>;
};

export const useCompanies = ({
  userId,
  getAccessToken
}: UseCompaniesParams) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySchedules, setCompanySchedules] = useState<CompanySchedule[]>(
    []
  );
  const [questionMemos, setQuestionMemos] = useState<QuestionMemo[]>([]);
  const [questionLabels, setQuestionLabels] = useState<QuestionLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [localMigrationAvailable, setLocalMigrationAvailable] = useState(false);
  const [isMigratingLocalData, setIsMigratingLocalData] = useState(false);
  const companiesRef = useRef<Company[]>([]);
  const companySchedulesRef = useRef<CompanySchedule[]>([]);
  const questionMemosRef = useRef<QuestionMemo[]>([]);
  const questionLabelsRef = useRef<QuestionLabel[]>([]);
  const pendingQuestionLabelSavesRef = useRef(
    new Map<string, Promise<QuestionLabel>>()
  );
  const questionLabelIdAliasesRef = useRef(new Map<string, string>());

  const setCompaniesState = useCallback(
    (nextCompanies: Company[] | ((current: Company[]) => Company[])) => {
      if (typeof nextCompanies !== 'function') {
        companiesRef.current = nextCompanies;
        setCompanies(nextCompanies);
        return;
      }

      setCompanies((currentCompanies) => {
        const resolvedCompanies = nextCompanies(currentCompanies);
        companiesRef.current = resolvedCompanies;
        return resolvedCompanies;
      });
    },
    []
  );

  const setCompanySchedulesState = useCallback(
    (
      nextSchedules:
        | CompanySchedule[]
        | ((current: CompanySchedule[]) => CompanySchedule[])
    ) => {
      if (typeof nextSchedules !== 'function') {
        companySchedulesRef.current = nextSchedules;
        setCompanySchedules(nextSchedules);
        return;
      }

      setCompanySchedules((currentSchedules) => {
        const resolvedSchedules = nextSchedules(currentSchedules);
        companySchedulesRef.current = resolvedSchedules;
        return resolvedSchedules;
      });
    },
    []
  );

  const setQuestionMemosState = useCallback(
    (nextQuestionMemos: QuestionMemo[] | ((current: QuestionMemo[]) => QuestionMemo[])) => {
      if (typeof nextQuestionMemos !== 'function') {
        questionMemosRef.current = nextQuestionMemos;
        setQuestionMemos(nextQuestionMemos);
        return;
      }

      setQuestionMemos((currentQuestionMemos) => {
        const resolvedQuestionMemos = nextQuestionMemos(currentQuestionMemos);
        questionMemosRef.current = resolvedQuestionMemos;
        return resolvedQuestionMemos;
      });
    },
    []
  );

  const setQuestionLabelsState = useCallback(
    (nextQuestionLabels: QuestionLabel[] | ((current: QuestionLabel[]) => QuestionLabel[])) => {
      if (typeof nextQuestionLabels !== 'function') {
        questionLabelsRef.current = nextQuestionLabels;
        setQuestionLabels(nextQuestionLabels);
        return;
      }

      setQuestionLabels((currentQuestionLabels) => {
        const resolvedQuestionLabels = nextQuestionLabels(currentQuestionLabels);
        questionLabelsRef.current = resolvedQuestionLabels;
        return resolvedQuestionLabels;
      });
    },
    []
  );

  const resolveQuestionLabelIds = useCallback(async (labelIds: string[]) => {
    const uniqueLabelIds = unique(labelIds);
    const pendingSaves = uniqueLabelIds
      .map((labelId) => pendingQuestionLabelSavesRef.current.get(labelId))
      .filter((promise): promise is Promise<QuestionLabel> => Boolean(promise));

    if (pendingSaves.length > 0) {
      await Promise.all(pendingSaves);
    }

    const availableLabelIds = new Set(
      questionLabelsRef.current.map((label) => label.id)
    );

    return unique(
      uniqueLabelIds.map(
        (labelId) => questionLabelIdAliasesRef.current.get(labelId) ?? labelId
      )
    ).filter((labelId) => availableLabelIds.has(labelId));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      if (isMounted) {
        setIsLoading(true);
        setStorageError(null);
      }

      try {
        const homeDataPromise = getAccessToken()
          .then(fetchRemoteHomeData)
          .then(async (homeData) => ({
            ...homeData,
            companies: await hydrateNativePasswords(homeData.companies)
          }));
        const localCompaniesPromise = hasCompletedLocalMigration(userId).then(
          (migrationCompleted) =>
            migrationCompleted ? [] : loadLocalCompaniesForMigration()
        );
        const [homeData, localCompanies] = await Promise.all([
          homeDataPromise,
          localCompaniesPromise
        ]);
        const loadedCompanies = homeData.companies;
        const legacyQuestionMemos = extractLegacyQuestionMemos(loadedCompanies);

        if (isMounted) {
          setCompaniesState(loadedCompanies);
          setCompanySchedulesState(sortSchedules(homeData.companySchedules));
          setQuestionMemosState(
            mergeQuestionMemosByNewestUpdate(
              homeData.questionMemos,
              legacyQuestionMemos
            )
          );
          setQuestionLabelsState(sortQuestionLabels(homeData.questionLabels));
          setLocalMigrationAvailable(localCompanies.length > 0);
        }
      } catch {
        if (isMounted) {
          setStorageError('保存データの読み込みに失敗しました。');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [
    getAccessToken,
    setCompaniesState,
    setQuestionLabelsState,
    setQuestionMemosState,
    userId
  ]);

  const upsertCompany = useCallback(
    async (draft: CompanyDraft) => {
      const currentCompanies = companiesRef.current;
      const now = new Date().toISOString();
      const existing = draft.id
        ? currentCompanies.find((company) => company.id === draft.id)
        : undefined;

      const nextCompany: Company = {
        ...draft,
        id: draft.id ?? createId(),
        tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
        questionAnswers: [],
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };

      const nextCompanies = existing
        ? currentCompanies.map((company) =>
            company.id === nextCompany.id ? nextCompany : company
          )
        : [nextCompany, ...currentCompanies];

      setCompaniesState(sortCompanies(nextCompanies));
      setStorageError(null);

      try {
        const accessToken = await getAccessToken();
        await Promise.all([
          saveNativeCompanyPassword(nextCompany.id, nextCompany.password),
          upsertRemoteCompany(nextCompany, accessToken)
        ]);
        setStorageError(null);
      } catch (error) {
        setCompaniesState((latestCompanies) => {
          const latestCompany = latestCompanies.find(
            (company) => company.id === nextCompany.id
          );

          if (
            !latestCompany ||
            latestCompany.updatedAt !== nextCompany.updatedAt
          ) {
            return latestCompanies;
          }

          return existing
            ? sortCompanies(
                latestCompanies.map((company) =>
                  company.id === existing.id ? existing : company
                )
              )
            : latestCompanies.filter(
                (company) => company.id !== nextCompany.id
              );
        });
        setStorageError('保存を完了できませんでした。');
        throw error;
      }

      return nextCompany;
    },
    [getAccessToken, setCompaniesState]
  );

  const upsertCompanySchedule = useCallback(
    async (draft: CompanySchedule) => {
      const currentSchedules = companySchedulesRef.current;
      const now = new Date().toISOString();
      const existing = draft.id
        ? currentSchedules.find((schedule) => schedule.id === draft.id)
        : undefined;
      const nextSchedule: CompanySchedule = {
        ...draft,
        id: draft.id || createScheduleId(),
        title: draft.title.trim() || draft.type || '予定',
        memo: draft.memo?.trim(),
        endDate: draft.endDate || draft.startDate,
        startTime: draft.isAllDay ? undefined : draft.startTime,
        endTime: draft.isAllDay ? undefined : draft.endTime,
        createdAt: existing?.createdAt ?? draft.createdAt ?? now,
        updatedAt: now
      };
      const nextSchedules = existing
        ? currentSchedules.map((schedule) =>
            schedule.id === nextSchedule.id ? nextSchedule : schedule
          )
        : [...currentSchedules, nextSchedule];

      setCompanySchedulesState(sortSchedules(nextSchedules));
      setStorageError(null);

      try {
        const accessToken = await getAccessToken();
        const savedSchedule = await upsertRemoteCompanySchedule(
          nextSchedule,
          accessToken
        );
        setCompanySchedulesState((latestSchedules) =>
          sortSchedules(
            latestSchedules.map((schedule) =>
              schedule.id === nextSchedule.id ? savedSchedule : schedule
            )
          )
        );
        setStorageError(null);
      } catch (error) {
        setCompanySchedulesState((latestSchedules) => {
          const latestSchedule = latestSchedules.find(
            (schedule) => schedule.id === nextSchedule.id
          );

          if (
            !latestSchedule ||
            latestSchedule.updatedAt !== nextSchedule.updatedAt
          ) {
            return latestSchedules;
          }

          return existing
            ? sortSchedules(
                latestSchedules.map((schedule) =>
                  schedule.id === existing.id ? existing : schedule
                )
              )
            : latestSchedules.filter(
                (schedule) => schedule.id !== nextSchedule.id
              );
        });
        setStorageError('日程の保存を完了できませんでした。');
        throw error;
      }

      return nextSchedule;
    },
    [getAccessToken, setCompanySchedulesState]
  );

  const deleteCompanySchedule = useCallback(
    async (id: string) => {
      const currentSchedules = companySchedulesRef.current;
      const deletedSchedule = currentSchedules.find(
        (schedule) => schedule.id === id
      );

      if (!deletedSchedule) {
        return;
      }

      setCompanySchedulesState(
        currentSchedules.filter((schedule) => schedule.id !== id)
      );
      setStorageError(null);

      try {
        const accessToken = await getAccessToken();
        await deleteRemoteCompanySchedule(id, accessToken);
        setStorageError(null);
      } catch (error) {
        setCompanySchedulesState((latestSchedules) => {
          if (latestSchedules.some((schedule) => schedule.id === id)) {
            return latestSchedules;
          }

          return sortSchedules([...latestSchedules, deletedSchedule]);
        });
        setStorageError('日程の削除に失敗しました。');
        throw error;
      }
    },
    [getAccessToken, setCompanySchedulesState]
  );

  const upsertQuestionMemo = useCallback(
    async (draft: QuestionMemoDraft | QuestionMemo) => {
      const currentQuestionMemos = questionMemosRef.current;
      const now = new Date().toISOString();
      const existing = draft.id
        ? currentQuestionMemos.find((questionMemo) => questionMemo.id === draft.id)
        : undefined;
      const nextQuestionMemo: QuestionMemo = {
        id: draft.id ?? createQuestionId(),
        companyId: draft.companyId ?? null,
        question: draft.question.trim(),
        answer: draft.answer.trim(),
        labelIds: unique(draft.labelIds ?? []),
        createdAt: existing?.createdAt ?? draft.createdAt ?? now,
        updatedAt: now
      };

      if (!nextQuestionMemo.question) {
        throw new Error('Question title is required.');
      }

      const nextQuestionMemos = existing
        ? currentQuestionMemos.map((questionMemo) =>
            questionMemo.id === nextQuestionMemo.id
              ? nextQuestionMemo
              : questionMemo
          )
        : [nextQuestionMemo, ...currentQuestionMemos];

      setQuestionMemosState(sortQuestionMemosByUpdate(nextQuestionMemos));
      setStorageError(null);

      try {
        const [accessToken, resolvedLabelIds] = await Promise.all([
          getAccessToken(),
          resolveQuestionLabelIds(nextQuestionMemo.labelIds)
        ]);
        const remoteQuestionMemo = {
          ...nextQuestionMemo,
          labelIds: resolvedLabelIds
        };

        if (
          !areStringArraysEqual(resolvedLabelIds, nextQuestionMemo.labelIds)
        ) {
          setQuestionMemosState((latestQuestionMemos) =>
            sortQuestionMemosByUpdate(
              latestQuestionMemos.map((questionMemo) =>
                questionMemo.id === nextQuestionMemo.id &&
                questionMemo.updatedAt === nextQuestionMemo.updatedAt
                  ? { ...questionMemo, labelIds: resolvedLabelIds }
                  : questionMemo
              )
            )
          );
        }

        await upsertRemoteQuestionMemo(remoteQuestionMemo, accessToken);
        setStorageError(null);
      } catch (error) {
        setQuestionMemosState((latestQuestionMemos) => {
          const latestQuestionMemo = latestQuestionMemos.find(
            (questionMemo) => questionMemo.id === nextQuestionMemo.id
          );

          if (
            !latestQuestionMemo ||
            latestQuestionMemo.updatedAt !== nextQuestionMemo.updatedAt
          ) {
            return latestQuestionMemos;
          }

          return existing
            ? sortQuestionMemosByUpdate(
                latestQuestionMemos.map((questionMemo) =>
                  questionMemo.id === existing.id ? existing : questionMemo
                )
              )
            : latestQuestionMemos.filter(
                (questionMemo) => questionMemo.id !== nextQuestionMemo.id
              );
        });
        setStorageError('質問メモの保存を完了できませんでした。');
        throw error;
      }

      return nextQuestionMemo;
    },
    [getAccessToken, resolveQuestionLabelIds, setQuestionMemosState]
  );

  const deleteQuestionMemo = useCallback(
    async (id: string) => {
      const currentQuestionMemos = questionMemosRef.current;
      const deletedQuestionMemo = currentQuestionMemos.find(
        (questionMemo) => questionMemo.id === id
      );

      if (!deletedQuestionMemo) {
        return;
      }

      setQuestionMemosState(
        currentQuestionMemos.filter((questionMemo) => questionMemo.id !== id)
      );
      setStorageError(null);

      try {
        const accessToken = await getAccessToken();
        await deleteRemoteQuestionMemo(id, accessToken);
        setStorageError(null);
      } catch (error) {
        setQuestionMemosState((latestQuestionMemos) => {
          if (
            latestQuestionMemos.some((questionMemo) => questionMemo.id === id)
          ) {
            return latestQuestionMemos;
          }

          return sortQuestionMemosByUpdate([
            ...latestQuestionMemos,
            deletedQuestionMemo
          ]);
        });
        setStorageError('質問メモの削除に失敗しました。');
        throw error;
      }
    },
    [getAccessToken, setQuestionMemosState]
  );

  const createQuestionLabel = useCallback(
    async (name: string) => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error('Question label name is required.');
      }

      const existing = questionLabelsRef.current.find(
        (label) => label.name === trimmedName
      );

      if (existing) {
        return existing;
      }

      const now = new Date().toISOString();
      const optimisticLabel: QuestionLabel = {
        id: createLabelId(),
        name: trimmedName,
        sortOrder: questionLabelsRef.current.length,
        createdAt: now,
        updatedAt: now
      };

      setQuestionLabelsState((currentLabels) =>
        sortQuestionLabels([...currentLabels, optimisticLabel])
      );
      setStorageError(null);

      const savePromise = (async () => {
        try {
          const accessToken = await getAccessToken();
          const savedLabel = await createRemoteQuestionLabel(
            optimisticLabel,
            accessToken
          );

          if (savedLabel.id !== optimisticLabel.id) {
            questionLabelIdAliasesRef.current.set(
              optimisticLabel.id,
              savedLabel.id
            );
            setQuestionMemosState((currentQuestionMemos) =>
              currentQuestionMemos.map((questionMemo) =>
                questionMemo.labelIds.includes(optimisticLabel.id)
                  ? {
                      ...questionMemo,
                      labelIds: unique(
                        questionMemo.labelIds.map((labelId) =>
                          labelId === optimisticLabel.id
                            ? savedLabel.id
                            : labelId
                        )
                      )
                    }
                  : questionMemo
              )
            );
          }

          setQuestionLabelsState((currentLabels) =>
            sortQuestionLabels(
              savedLabel.id !== optimisticLabel.id &&
                currentLabels.some((label) => label.id === savedLabel.id)
                ? currentLabels.filter((label) => label.id !== optimisticLabel.id)
                : currentLabels.map((label) =>
                    label.id === optimisticLabel.id ? savedLabel : label
                  )
            )
          );
          setStorageError(null);
          return savedLabel;
        } catch (error) {
          if (shouldKeepLocalQuestionLabelPreview) {
            setStorageError(LOCAL_QUESTION_LABEL_PREVIEW_NOTICE);
            return optimisticLabel;
          }

          setQuestionLabelsState((currentLabels) =>
            currentLabels.filter((label) => label.id !== optimisticLabel.id)
          );
          setQuestionMemosState((currentQuestionMemos) =>
            currentQuestionMemos.map((questionMemo) =>
              questionMemo.labelIds.includes(optimisticLabel.id)
                ? {
                    ...questionMemo,
                    labelIds: questionMemo.labelIds.filter(
                      (labelId) => labelId !== optimisticLabel.id
                    )
                  }
                : questionMemo
            )
          );
          setStorageError('ラベルの作成に失敗しました。');
          throw error;
        }
      })();
      pendingQuestionLabelSavesRef.current.set(optimisticLabel.id, savePromise);
      void savePromise
        .finally(() => {
          pendingQuestionLabelSavesRef.current.delete(optimisticLabel.id);
        })
        .catch(() => undefined);

      return optimisticLabel;
    },
    [getAccessToken, setQuestionLabelsState, setQuestionMemosState]
  );

  const reorderQuestionLabels = useCallback(
    async (nextLabels: QuestionLabel[]) => {
      const previousLabels = questionLabelsRef.current;
      const normalizedLabels = nextLabels.map((label, index) => ({
        ...label,
        sortOrder: index
      }));

      setQuestionLabelsState(sortQuestionLabels(normalizedLabels));
      setStorageError(null);

      try {
        const accessToken = await getAccessToken();
        const savedLabels = await reorderRemoteQuestionLabels(
          normalizedLabels,
          accessToken
        );

        setQuestionLabelsState(sortQuestionLabels(savedLabels));
        setStorageError(null);
      } catch (error) {
        if (shouldKeepLocalQuestionLabelPreview) {
          setStorageError(LOCAL_QUESTION_LABEL_PREVIEW_NOTICE);
          return;
        }

        setQuestionLabelsState(previousLabels);
        setStorageError('ラベルの並び替えに失敗しました。');
        throw error;
      }
    },
    [getAccessToken, setQuestionLabelsState]
  );

  const updateQuestionLabel = useCallback(
    async (id: string, name: string) => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error('Question label name is required.');
      }

      const previousLabels = questionLabelsRef.current;
      const existingLabel = previousLabels.find((label) => label.id === id);

      if (!existingLabel) {
        throw new Error('Question label not found.');
      }

      if (existingLabel.name === trimmedName) {
        return existingLabel;
      }

      if (
        previousLabels.some(
          (label) => label.id !== id && label.name === trimmedName
        )
      ) {
        throw new Error('同じ名前のラベルがあります。');
      }

      const optimisticLabel: QuestionLabel = {
        ...existingLabel,
        name: trimmedName,
        updatedAt: new Date().toISOString()
      };

      setQuestionLabelsState((currentLabels) =>
        sortQuestionLabels(
          currentLabels.map((label) =>
            label.id === id ? optimisticLabel : label
          )
        )
      );
      setStorageError(null);

      try {
        const accessToken = await getAccessToken();
        const savedLabel = await updateRemoteQuestionLabel(
          optimisticLabel,
          accessToken
        );

        setQuestionLabelsState((currentLabels) =>
          sortQuestionLabels(
            currentLabels.map((label) =>
              label.id === id ? savedLabel : label
            )
          )
        );
        setStorageError(null);
        return savedLabel;
      } catch (error) {
        if (shouldKeepLocalQuestionLabelPreview) {
          setStorageError(LOCAL_QUESTION_LABEL_PREVIEW_NOTICE);
          return optimisticLabel;
        }

        setQuestionLabelsState(previousLabels);
        setStorageError('ラベル名の変更に失敗しました。');
        throw error;
      }
    },
    [getAccessToken, setQuestionLabelsState]
  );

  const deleteQuestionLabel = useCallback(
    async (id: string) => {
      const previousLabels = questionLabelsRef.current;
      const previousQuestionMemos = questionMemosRef.current;

      setQuestionLabelsState(previousLabels.filter((label) => label.id !== id));
      setQuestionMemosState(
        previousQuestionMemos.map((questionMemo) => ({
          ...questionMemo,
          labelIds: questionMemo.labelIds.filter((labelId) => labelId !== id)
        }))
      );
      setStorageError(null);

      try {
        const accessToken = await getAccessToken();
        await deleteRemoteQuestionLabel(id, accessToken);
        setStorageError(null);
      } catch (error) {
        if (shouldKeepLocalQuestionLabelPreview) {
          setStorageError(LOCAL_QUESTION_LABEL_PREVIEW_NOTICE);
          return;
        }

        setQuestionLabelsState(previousLabels);
        setQuestionMemosState(previousQuestionMemos);
        setStorageError('ラベルの削除に失敗しました。');
        throw error;
      }
    },
    [getAccessToken, setQuestionLabelsState, setQuestionMemosState]
  );

  const deleteCompany = useCallback(
    async (id: string) => {
      const currentCompanies = companiesRef.current;
      const currentQuestionMemos = questionMemosRef.current;
      const currentSchedules = companySchedulesRef.current;
      const deletedCompany = currentCompanies.find(
        (company) => company.id === id
      );

      if (!deletedCompany) {
        return;
      }

      setCompaniesState(
        currentCompanies.filter((company) => company.id !== id)
      );
      setQuestionMemosState(
        currentQuestionMemos.map((questionMemo) =>
          questionMemo.companyId === id
            ? { ...questionMemo, companyId: null }
            : questionMemo
        )
      );
      setCompanySchedulesState(
        currentSchedules.filter((schedule) => schedule.companyId !== id)
      );
      setStorageError(null);

      void (async () => {
        try {
          const accessToken = await getAccessToken();
          await deleteRemoteCompany(id, accessToken);

          let credentialDeleteFailed = false;
          try {
            await deleteCompanyCredential(id);
          } catch {
            credentialDeleteFailed = true;
          }

          setStorageError(
            credentialDeleteFailed
              ? '端末内のパスワード削除に失敗しました。'
              : null
          );
        } catch {
          setCompaniesState((latestCompanies) => {
            if (latestCompanies.some((company) => company.id === id)) {
              return latestCompanies;
            }

            return sortCompanies([...latestCompanies, deletedCompany]);
          });
          setQuestionMemosState(currentQuestionMemos);
          setCompanySchedulesState(currentSchedules);
          setStorageError('削除に失敗しました。もう一度お試しください。');
        }
      })();
    },
    [
      getAccessToken,
      setCompaniesState,
      setCompanySchedulesState,
      setQuestionMemosState
    ]
  );

  const importLocalCompanies = useCallback(async () => {
    setIsMigratingLocalData(true);
    setStorageError(null);

    try {
      const previousCompanies = companiesRef.current;
      const [localCompanies, accessToken] = await Promise.all([
        loadLocalCompaniesForMigration(),
        getAccessToken()
      ]);
      const nextCompanies = mergeByNewestUpdate(
        previousCompanies,
        localCompanies
      );
      const localQuestionMemos = extractLegacyQuestionMemos(localCompanies);
      const nextQuestionMemos = mergeQuestionMemosByNewestUpdate(
        questionMemosRef.current,
        localQuestionMemos
      );

      setCompaniesState(nextCompanies);
      setQuestionMemosState(nextQuestionMemos);

      await Promise.all(
        nextCompanies.map((company) =>
          Promise.all([
            saveNativeCompanyPassword(company.id, company.password),
            upsertRemoteCompany(
              {
                ...company,
                questionAnswers: []
              },
              accessToken
            )
          ])
        )
      );
      await Promise.all(
        localQuestionMemos
          .filter((questionMemo) => questionMemo.question.trim())
          .map((questionMemo) =>
            upsertRemoteQuestionMemo(questionMemo, accessToken)
          )
      );
      await Promise.all([
        purgeLegacyWebCredentials(localCompanies),
        markLocalMigrationComplete(userId)
      ]);
      setLocalMigrationAvailable(false);
      setStorageError(null);
    } catch (error) {
      setStorageError('端末の保存データ移行に失敗しました。');
      throw error;
    } finally {
      setIsMigratingLocalData(false);
    }
  }, [getAccessToken, setCompaniesState, setQuestionMemosState, userId]);

  const dismissLocalMigration = useCallback(async () => {
    await markLocalMigrationComplete(userId);
    setLocalMigrationAvailable(false);
  }, [userId]);

  const reloadCompanies = useCallback(async () => {
    setIsLoading(true);
    setStorageError(null);

    try {
      const accessToken = await getAccessToken();
      const homeData = await fetchRemoteHomeData(accessToken);
      const hydratedCompanies = await hydrateNativePasswords(homeData.companies);

      setCompaniesState(hydratedCompanies);
      setCompanySchedulesState(sortSchedules(homeData.companySchedules));
      setQuestionMemosState(
        mergeQuestionMemosByNewestUpdate(
          homeData.questionMemos,
          extractLegacyQuestionMemos(hydratedCompanies)
        )
      );
      setQuestionLabelsState(sortQuestionLabels(homeData.questionLabels));
    } catch {
      setStorageError('保存データの再読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, [
    getAccessToken,
    setCompaniesState,
    setCompanySchedulesState,
    setQuestionLabelsState,
    setQuestionMemosState
  ]);

  const clearLocalAccountData = useCallback(async () => {
    await clearAccountLocalData(userId, companiesRef.current);
  }, [userId]);

  return {
    companies,
    companySchedules,
    questionMemos,
    questionLabels,
    isLoading,
    storageError,
    localMigrationAvailable,
    isMigratingLocalData,
    upsertCompany,
    upsertCompanySchedule,
    deleteCompanySchedule,
    upsertQuestionMemo,
    deleteQuestionMemo,
    createQuestionLabel,
    reorderQuestionLabels,
    updateQuestionLabel,
    deleteQuestionLabel,
    deleteCompany,
    importLocalCompanies,
    dismissLocalMigration,
    reloadCompanies,
    clearLocalAccountData
  };
};
