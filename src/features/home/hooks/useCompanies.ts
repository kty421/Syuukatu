import { useCallback, useEffect, useState } from 'react';

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

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const accessToken = await getAccessToken();
        const remoteCompanies = await fetchRemoteCompanies(accessToken);
        const loadedCompanies = await hydrateNativePasswords(remoteCompanies);
        const migrationCompleted = await hasCompletedLocalMigration(userId);
        const localCompanies = migrationCompleted
          ? []
          : await loadLocalCompaniesForMigration();

        if (isMounted) {
          setCompanies(loadedCompanies);
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
  }, [getAccessToken, userId]);

  const commit = useCallback(
    async (nextCompanies: Company[], previousCompanies: Company[]) => {
      setCompanies(nextCompanies);

      try {
        const accessToken = await getAccessToken();
        const changedCompanies = nextCompanies.filter((nextCompany) => {
          const previous = previousCompanies.find(
            (company) => company.id === nextCompany.id
          );

          return !previous || previous.updatedAt !== nextCompany.updatedAt;
        });

        await Promise.all(
          changedCompanies.map(async (company) => {
            await saveNativeCompanyPassword(company.id, company.password);
            await upsertRemoteCompany(company, accessToken);
          })
        );
        setStorageError(null);
      } catch (error) {
        setCompanies(previousCompanies);
        setStorageError(
          error instanceof Error ? error.message : '保存を完了できませんでした。'
        );
        throw error;
      }
    },
    [getAccessToken]
  );

  const upsertCompany = useCallback(
    async (draft: CompanyDraft) => {
      const now = new Date().toISOString();
      const existing = draft.id
        ? companies.find((company) => company.id === draft.id)
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
        ? companies.map((company) =>
            company.id === nextCompany.id ? nextCompany : company
          )
        : [nextCompany, ...companies];

      await commit(nextCompanies, companies);
    },
    [commit, companies]
  );

  const deleteCompany = useCallback(
    async (id: string) => {
      const nextCompanies = companies.filter((company) => company.id !== id);
      setCompanies(nextCompanies);

      try {
        const accessToken = await getAccessToken();
        await deleteRemoteCompany(id, accessToken);
        await deleteCompanyCredential(id);
        setStorageError(null);
      } catch (error) {
        setCompanies(companies);
        setStorageError('削除に失敗しました。もう一度お試しください。');
        throw error;
      }
    },
    [companies, getAccessToken]
  );

  const importLocalCompanies = useCallback(async () => {
    setIsMigratingLocalData(true);
    setStorageError(null);

    try {
      const localCompanies = await loadLocalCompaniesForMigration();
      const nextCompanies = mergeByNewestUpdate(companies, localCompanies);
      const accessToken = await getAccessToken();

      setCompanies(nextCompanies);

      await Promise.all(
        nextCompanies.map(async (company) => {
          await saveNativeCompanyPassword(company.id, company.password);
          await upsertRemoteCompany(company, accessToken);
        })
      );
      await purgeLegacyWebCredentials(localCompanies);
      await markLocalMigrationComplete(userId);
      setLocalMigrationAvailable(false);
      setStorageError(null);
    } catch (error) {
      setStorageError('端末の保存データ移行に失敗しました。');
      throw error;
    } finally {
      setIsMigratingLocalData(false);
    }
  }, [companies, getAccessToken, userId]);

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
      setCompanies(await hydrateNativePasswords(remoteCompanies));
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
