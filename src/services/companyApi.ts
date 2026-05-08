import { Company } from '../features/home/types';
import { apiRequest } from './apiClient';

type CompaniesResponse = {
  companies: Company[];
};

type CompanyResponse = {
  company: Company;
};

const stripPassword = (company: Company): Company => ({
  ...company,
  password: ''
});

export const fetchRemoteCompanies = async (accessToken: string | null) => {
  const response = await apiRequest<CompaniesResponse>('/api/companies', {
    accessToken
  });

  return response.companies.map(stripPassword);
};

export const upsertRemoteCompany = async (
  company: Company,
  accessToken: string | null
) => {
  const response = await apiRequest<CompanyResponse>('/api/companies', {
    method: 'PUT',
    accessToken,
    body: {
      company: stripPassword(company)
    }
  });

  return stripPassword(response.company);
};

export const deleteRemoteCompany = async (
  id: string,
  accessToken: string | null
) => {
  await apiRequest(`/api/companies?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    accessToken
  });
};
