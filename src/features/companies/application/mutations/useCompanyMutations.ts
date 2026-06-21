import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Company } from '../../domain/entities/company';
import { CompanyRepository } from '../../domain/repositories/CompanyRepository';
import { httpCompanyRepository } from '../../infrastructure/repositories/HttpCompanyRepository';
import {
  deleteCompanyFromList,
  upsertCompanyInList
} from './companyOptimisticUpdates';
import { companyQueryKeys } from '../queries/companyQueryKeys';

type CompanyMutationParams = {
  getAccessToken: () => Promise<string | null>;
  repository?: CompanyRepository;
  userId: string;
};

export const useUpsertCompanyMutation = ({
  getAccessToken,
  repository = httpCompanyRepository,
  userId
}: CompanyMutationParams) => {
  const queryClient = useQueryClient();
  const queryKey = companyQueryKeys.list(userId);

  return useMutation({
    mutationFn: async (company: Company) =>
      repository.upsertCompany(company, await getAccessToken()),
    onError: (_error, _company, context?: { previousCompanies?: Company[] }) => {
      if (context?.previousCompanies) {
        queryClient.setQueryData(queryKey, context.previousCompanies);
      }
    },
    onMutate: async (company) => {
      await queryClient.cancelQueries({ queryKey });
      const previousCompanies = queryClient.getQueryData<Company[]>(queryKey);

      queryClient.setQueryData<Company[]>(queryKey, (currentCompanies) =>
        upsertCompanyInList(currentCompanies, company)
      );

      return { previousCompanies };
    },
    onSuccess: (savedCompany) => {
      queryClient.setQueryData<Company[]>(queryKey, (currentCompanies) =>
        upsertCompanyInList(currentCompanies, savedCompany)
      );
    }
  });
};

export const useDeleteCompanyMutation = ({
  getAccessToken,
  repository = httpCompanyRepository,
  userId
}: CompanyMutationParams) => {
  const queryClient = useQueryClient();
  const queryKey = companyQueryKeys.list(userId);

  return useMutation({
    mutationFn: async (companyId: string) => {
      await repository.deleteCompany(companyId, await getAccessToken());
      return companyId;
    },
    onError: (_error, _companyId, context?: { previousCompanies?: Company[] }) => {
      if (context?.previousCompanies) {
        queryClient.setQueryData(queryKey, context.previousCompanies);
      }
    },
    onMutate: async (companyId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousCompanies = queryClient.getQueryData<Company[]>(queryKey);

      queryClient.setQueryData<Company[]>(queryKey, (currentCompanies) =>
        deleteCompanyFromList(currentCompanies, companyId)
      );

      return { previousCompanies };
    }
  });
};
