import { Company } from '../../domain/entities/company';
import { toCompanyRequestDto } from '../../infrastructure/mappers/companyMapper';

export const prepareCompanyForRemoteSave = (company: Company) =>
  toCompanyRequestDto(company);
