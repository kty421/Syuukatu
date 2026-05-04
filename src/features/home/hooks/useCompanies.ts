import { useCallback, useEffect, useRef, useState } from 'react';

import {
  deleteRemoteCompany,
  fetchRemoteCompanies,
  upsertRemoteCompany
} from '../../../services/companyApi';
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
  CompanyDraft
} from '../types';

const createId = () =>
  `company-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const sortCompanies = (companies: Company[]) =>
  [...companies].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

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

type UseCompaniesParams = {
  userId: string;
  getAccessToken: () => Promise<string | null>;
};

export const useCompanies = ({
  userId,
  getAccessToken
}: UseCompaniesParams) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [localMigrationAvailable, setLocalMigrationAvailable] = useState(false);
  const [isMigratingLocalData, setIsMigratingLocalData] = useState(false);
  const companiesRef = useRef<Company[]>([]);

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
        const localCompaniesPromise = hasCompletedLocalMigration(userId).then(
          (migrationCompleted) =>
            migrationCompleted ? [] : loadLocalCompaniesForMigration()
        );
        const [loadedCompanies, localCompanies] = await Promise.all([
          loadedCompaniesPromise,
          localCompaniesPromise
        ]);

        if (isMounted) {
          setCompaniesState(loadedCompanies);
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
  }, [getAccessToken, setCompaniesState, userId]);

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
        questionAnswers: (draft.questionAnswers ?? [])
          .map((item) => ({
            ...item,
            question: item.question.trim(),
            answer: item.answer.trim()
          }))
          .filter((item) => item.question || item.answer),
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

      void (async () => {
        try {
          const accessToken = await getAccessToken();
          await Promise.all([
            saveNativeCompanyPassword(nextCompany.id, nextCompany.password),
            upsertRemoteCompany(nextCompany, accessToken)
          ]);
          setStorageError(null);
        } catch {
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
        }
      })();

      return nextCompany;
    },
    [getAccessToken, setCompaniesState]
  );

  const deleteCompany = useCallback(
    async (id: string) => {
      const currentCompanies = companiesRef.current;
      const deletedCompany = currentCompanies.find(
        (company) => company.id === id
      );

      if (!deletedCompany) {
        return;
      }

      setCompaniesState(
        currentCompanies.filter((company) => company.id !== id)
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
          setStorageError('削除に失敗しました。もう一度お試しください。');
        }
      })();
    },
    [getAccessToken, setCompaniesState]
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

      setCompaniesState(nextCompanies);

      await Promise.all(
        nextCompanies.map((company) =>
          Promise.all([
            saveNativeCompanyPassword(company.id, company.password),
            upsertRemoteCompany(company, accessToken)
          ])
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
  }, [getAccessToken, setCompaniesState, userId]);

  const dismissLocalMigration = useCallback(async () => {
    await markLocalMigrationComplete(userId);
    setLocalMigrationAvailable(false);
  }, [userId]);

  const reloadCompanies = useCallback(async () => {
    setIsLoading(true);
    setStorageError(null);

    try {
      const accessToken = await getAccessToken();
      const remoteCompanies = await fetchRemoteCompanies(accessToken);
      setCompaniesState(await hydrateNativePasswords(remoteCompanies));
    } catch {
      setStorageError('保存データの再読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  return {
    companies,
    isLoading,
    storageError,
    localMigrationAvailable,
    isMigratingLocalData,
    upsertCompany,
    deleteCompany,
    importLocalCompanies,
    dismissLocalMigration,
    reloadCompanies
  };
};
