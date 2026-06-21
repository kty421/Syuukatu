import { Company } from '../../domain/entities/company';

export type CompanyDto = Company;

export type CompanyRequestDto = Omit<Company, 'password'>;

export const toCompanyDomain = (dto: CompanyDto): Company => ({
  ...dto,
  password: dto.password ?? ''
});

export const toCompanyRequestDto = (company: Company): CompanyRequestDto => {
  const { password: _password, ...companyWithoutPassword } = company;

  return companyWithoutPassword;
};
