import { describe, expect, it } from 'vitest';

import { Company } from '../../domain/entities/company';
import { CompanyRepository } from '../../domain/repositories/CompanyRepository';
import { prepareCompanyForRemoteSave } from './prepareCompanyForRemoteSave';

const company: Company = {
  archived: false,
  companyName: '未来テック',
  createdAt: '2026-06-01T00:00:00.000Z',
  favorite: false,
  id: 'company-1',
  loginId: 'student@example.com',
  password: 'do-not-send',
  questionAnswers: [],
  status: 'PRE_ENTRY',
  tags: [],
  type: 'fullTime',
  updatedAt: '2026-06-02T00:00:00.000Z'
};

describe('prepareCompanyForRemoteSave', () => {
  it('removes password before repository save payload is created', () => {
    expect('password' in prepareCompanyForRemoteSave(company)).toBe(false);
  });

  it('can be used with a repository mock without exposing password', async () => {
    let savedPayload: ReturnType<typeof prepareCompanyForRemoteSave> | null = null;
    const repository: CompanyRepository = {
      deleteCompany: async () => {},
      listCompanies: async () => [],
      upsertCompany: async (nextCompany) => {
        savedPayload = prepareCompanyForRemoteSave(nextCompany);
        return nextCompany;
      }
    };

    await repository.upsertCompany(company, null);

    expect(savedPayload).not.toBeNull();
    expect(savedPayload && 'password' in savedPayload).toBe(false);
  });
});
