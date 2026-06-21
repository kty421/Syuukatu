import { describe, expect, it } from 'vitest';

import { Company } from '../../domain/entities/company';
import { toCompanyDomain, toCompanyRequestDto } from './companyMapper';

const company: Company = {
  archived: false,
  companyName: '青空商事',
  createdAt: '2026-06-01T00:00:00.000Z',
  favorite: false,
  id: 'company-1',
  industry: '商社',
  loginId: 'student@example.com',
  memo: 'メモ',
  myPageUrl: 'https://example.com',
  password: 'secret-password',
  questionAnswers: [],
  role: '総合職',
  status: 'PRE_ENTRY',
  tags: ['夏インターン'],
  type: 'internship',
  updatedAt: '2026-06-02T00:00:00.000Z'
};

describe('companyMapper', () => {
  it('excludes company site password from remote request dto', () => {
    const requestDto = toCompanyRequestDto(company);

    expect('password' in requestDto).toBe(false);
    expect(requestDto.loginId).toBe(company.loginId);
    expect(requestDto.myPageUrl).toBe(company.myPageUrl);
  });

  it('normalizes missing dto password to an empty domain password', () => {
    const domainCompany = toCompanyDomain({
      ...company,
      password: undefined as unknown as string
    });

    expect(domainCompany.password).toBe('');
  });
});
