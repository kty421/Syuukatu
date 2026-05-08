import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
  deleteRemoteCompany,
  fetchRemoteCompanies,
  upsertRemoteCompany
} from '../../../services/companyApi';
import {
  createRemoteQuestionLabel,
  deleteRemoteQuestionLabel,
  deleteRemoteQuestionMemo,
  fetchRemoteQuestionData,
  reorderRemoteQuestionLabels,
  upsertRemoteQuestionMemo
} from '../../../services/questionApi';
import {
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
  QuestionLabel,
  QuestionMemo,
  QuestionMemoDraft
} from '../types';

const createId = () =>
  `company-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createQuestionId = () =>
  `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createLabelId = () =>
  `label-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const LOCAL_QUESTION_LABEL_PREVIEW_NOTICE =
  'ローカルプレビューとして反映しました。API反映後に再確認してください。';
const shouldKeepLocalQuestionLabelPreview = __DEV__ && Platform.OS === 'ios';

const sortCompanies = (companies: Company[]) =>
  [...companies].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

const sortQuestionMemosByUpdate = (questionMemos: QuestionMemo[]) =>
  [...questionMemos].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

const sortQuestionLabels = (labels: QuestionLabel[]) =>
  [...labels].sort((a, b) => {
    const sortOrderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

    if (sortOrderDiff !== 0) {
      return sortOrderDiff;
    }

    const timeOrder =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

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
      new Date(company.updatedAt).getTime() >
        new Date(existing.updatedAt).getTime()
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
      new Date(questionMemo.updatedAt).getTime() >
        new Date(existing.updatedAt).getTime()
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
  const [questionMemos, setQuestionMemos] = useState<QuestionMemo[]>([]);
  const [questionLabels, setQuestionLabels] = useState<QuestionLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [localMigrationAvailable, setLocalMigrationAvailable] = useState(false);
  const [isMigratingLocalData, setIsMigratingLocalData] = useState(false);
  const companiesRef = useRef<Company[]>([]);
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
        const accessTokenPromise = getAccessToken();
        const loadedCompaniesPromise = accessTokenPromise
          .then(fetchRemoteCompanies)
          .then(hydrateNativePasswords);
        const questionDataPromise =
          accessTokenPromise.then(fetchRemoteQuestionData);
        const localCompaniesPromise = hasCompletedLocalMigration(userId).then(
          (migrationCompleted) =>
            migrationCompleted ? [] : loadLocalCompaniesForMigration()
        );
        const [loadedCompanies, questionData, localCompanies] = await Promise.all([
          loadedCompaniesPromise,
          questionDataPromise,
          localCompaniesPromise
        ]);
        const legacyQuestionMemos = extractLegacyQuestionMemos(loadedCompanies);

        if (isMounted) {
          setCompaniesState(loadedCompanies);
          setQuestionMemosState(
            mergeQuestionMemosByNewestUpdate(
              questionData.questionMemos,
              legacyQuestionMemos
            )
          );
          setQuestionLabelsState(sortQuestionLabels(questionData.questionLabels));
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
          setStorageError('削除に失敗しました。もう一度お試しください。');
        }
      })();
    },
    [getAccessToken, setCompaniesState, setQuestionMemosState]
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
      const [remoteCompanies, questionData] = await Promise.all([
        fetchRemoteCompanies(accessToken),
        fetchRemoteQuestionData(accessToken)
      ]);
      const hydratedCompanies = await hydrateNativePasswords(remoteCompanies);

      setCompaniesState(hydratedCompanies);
      setQuestionMemosState(
        mergeQuestionMemosByNewestUpdate(
          questionData.questionMemos,
          extractLegacyQuestionMemos(hydratedCompanies)
        )
      );
      setQuestionLabelsState(sortQuestionLabels(questionData.questionLabels));
    } catch {
      setStorageError('保存データの再読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, [
    getAccessToken,
    setCompaniesState,
    setQuestionLabelsState,
    setQuestionMemosState
  ]);

  return {
    companies,
    questionMemos,
    questionLabels,
    isLoading,
    storageError,
    localMigrationAvailable,
    isMigratingLocalData,
    upsertCompany,
    upsertQuestionMemo,
    deleteQuestionMemo,
    createQuestionLabel,
    reorderQuestionLabels,
    deleteQuestionLabel,
    deleteCompany,
    importLocalCompanies,
    dismissLocalMigration,
    reloadCompanies
  };
};
