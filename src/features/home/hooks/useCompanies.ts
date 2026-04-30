import { useCallback, useEffect, useState } from 'react';

import {
  deleteCompanyCredential,
  loadCompanies,
  saveCompanies
} from '../../../services/secureCompanyStore';
import {
  Company,
  CompanyDraft
} from '../types';

const createId = () =>
  `company-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const loadedCompanies = await loadCompanies();
        if (isMounted) {
          setCompanies(loadedCompanies);
        }
      } catch {
        if (isMounted) {
          setStorageError('保存データの読み込みに失敗しました');
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
  }, []);

  const commit = useCallback(
    async (nextCompanies: Company[], previousCompanies: Company[]) => {
      setCompanies(nextCompanies);

      try {
        const { credentialSaveFailed } = await saveCompanies(nextCompanies);
        setStorageError(
          credentialSaveFailed
            ? '企業は保存されましたが、ログイン情報の保存に失敗した項目があります。'
            : null
        );
      } catch (error) {
        setCompanies(previousCompanies);
        setStorageError('端末への書き込みを完了できませんでした。');
        throw error;
      }
    },
    []
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
        const { credentialSaveFailed } = await saveCompanies(nextCompanies);

        try {
          await deleteCompanyCredential(id);
          setStorageError(
            credentialSaveFailed
              ? '企業は保存されましたが、ログイン情報の保存に失敗した項目があります。'
              : null
          );
        } catch {
          setStorageError(
            '企業は削除されましたが、ログイン情報の削除に失敗した可能性があります。'
          );
        }
      } catch (error) {
        setCompanies(companies);
        setStorageError('削除に失敗しました。もう一度お試しください。');
        throw error;
      }
    },
    [companies]
  );

  return {
    companies,
    isLoading,
    storageError,
    upsertCompany,
    deleteCompany
  };
};
