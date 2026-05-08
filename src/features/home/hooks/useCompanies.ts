import { useCallback, useEffect, useRef, useState } from 'react';

import {
  deleteRemoteCompany,
  fetchRemoteCompanies,
  upsertRemoteCompany
} from '../../../services/companyApi';
import {
  createRemoteQuestionLabel,
  deleteRemoteQuestionMemo,
  fetchRemoteQuestionData,
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
    const timeOrder =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    if (timeOrder !== 0) {
      return timeOrder;
    }

    return a.name.localeCompare(b.name, 'ja');
  });

const unique = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))];

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
        const accessToken = await getAccessToken();
        await upsertRemoteQuestionMemo(nextQuestionMemo, accessToken);
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
    [getAccessToken, setQuestionMemosState]
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
        createdAt: now,
        updatedAt: now
      };

      setQuestionLabelsState((currentLabels) =>
        sortQuestionLabels([...currentLabels, optimisticLabel])
      );
      setStorageError(null);

      try {
        const accessToken = await getAccessToken();
        const savedLabel = await createRemoteQuestionLabel(
          optimisticLabel,
          accessToken
        );

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
        setQuestionLabelsState((currentLabels) =>
          currentLabels.filter((label) => label.id !== optimisticLabel.id)
        );
        setStorageError('ラベルの作成に失敗しました。');
        throw error;
      }
    },
    [getAccessToken, setQuestionLabelsState]
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
    deleteCompany,
    importLocalCompanies,
    dismissLocalMigration,
    reloadCompanies
  };
};
