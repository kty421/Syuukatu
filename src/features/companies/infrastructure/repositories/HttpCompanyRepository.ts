import { apiRequest } from '../../../../shared/api/apiClient';
import { CompanyRepository } from '../../domain/repositories/CompanyRepository';
import {
  CompanyDto,
  toCompanyDomain,
  toCompanyRequestDto
} from '../mappers/companyMapper';

type CompaniesResponse = {
  companies: CompanyDto[];
};

type CompanyResponse = {
  company: CompanyDto;
};

export const httpCompanyRepository: CompanyRepository = {
  deleteCompany: async (id, accessToken) => {
    await apiRequest(`/api/companies?id=${encodeURIComponent(id)}`, {
      accessToken,
      method: 'DELETE'
    });
  },
  listCompanies: async (accessToken) => {
    const response = await apiRequest<CompaniesResponse>('/api/companies', {
      accessToken
    });

    return response.companies.map(toCompanyDomain);
  },
  upsertCompany: async (company, accessToken) => {
    const response = await apiRequest<CompanyResponse>('/api/companies', {
      accessToken,
      body: {
        company: toCompanyRequestDto(company)
      },
      method: 'PUT'
    });

    return toCompanyDomain(response.company);
  }
};
