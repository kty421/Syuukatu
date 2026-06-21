import { useQuery } from '@tanstack/react-query';

import { CompanyRepository } from '../../domain/repositories/CompanyRepository';
import { httpCompanyRepository } from '../../infrastructure/repositories/HttpCompanyRepository';
import { companyQueryKeys } from './companyQueryKeys';

type UseCompaniesQueryParams = {
  getAccessToken: () => Promise<string | null>;
  repository?: CompanyRepository;
  userId: string;
};

export const useCompaniesQuery = ({
  getAccessToken,
  repository = httpCompanyRepository,
  userId
}: UseCompaniesQueryParams) =>
  useQuery({
    queryFn: async () => repository.listCompanies(await getAccessToken()),
    queryKey: companyQueryKeys.list(userId)
  });
