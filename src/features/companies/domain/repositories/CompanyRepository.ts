import { Company } from '../entities/company';

export type CompanyRepository = {
  deleteCompany: (id: string, accessToken: string | null) => Promise<void>;
  listCompanies: (accessToken: string | null) => Promise<Company[]>;
  upsertCompany: (
    company: Company,
    accessToken: string | null
  ) => Promise<Company>;
};
