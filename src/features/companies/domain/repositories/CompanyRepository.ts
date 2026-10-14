import { Company } from '../entities/company';
import { BulkUpdateResult } from '../../../../shared/types/bulkUpdate';

export type CompanyRepository = {
  updateStatuses: (
    companyIds: string[],
    status: string,
    accessToken: string | null
  ) => Promise<BulkUpdateResult<Company>>;
  deleteCompany: (id: string, accessToken: string | null) => Promise<void>;
  listCompanies: (accessToken: string | null) => Promise<Company[]>;
  upsertCompany: (
    company: Company,
    accessToken: string | null
  ) => Promise<Company>;
};
