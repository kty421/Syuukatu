import { describe, expect, it } from 'vitest';

import { Company } from '../../domain/entities/company';
import {
  deleteCompanyFromList,
  upsertCompanyInList
} from './companyOptimisticUpdates';

const createCompany = (id: string, updatedAt: string): Company => ({
  archived: false,
  companyName: `企業${id}`,
  createdAt: updatedAt,
  favorite: false,
  id,
  loginId: '',
  password: '',
  questionAnswers: [],
  status: 'PRE_ENTRY',
  tags: [],
  type: 'internship',
  updatedAt
});

describe('companyOptimisticUpdates', () => {
  it('upserts and sorts by newest update first', () => {
    const companies = [
      createCompany('old', '2026-06-01T00:00:00.000Z'),
      createCompany('new', '2026-06-03T00:00:00.000Z')
    ];
    const nextCompany = {
      ...createCompany('old', '2026-06-04T00:00:00.000Z'),
      companyName: '更新済み'
    };

    const result = upsertCompanyInList(companies, nextCompany);

    expect(result.map((company) => company.id)).toEqual(['old', 'new']);
    expect(result[0]?.companyName).toBe('更新済み');
  });

  it('removes a deleted company from the optimistic list', () => {
    const companies = [
      createCompany('a', '2026-06-01T00:00:00.000Z'),
      createCompany('b', '2026-06-02T00:00:00.000Z')
    ];

    const result = deleteCompanyFromList(companies, 'a');

    expect(result.map((company) => company.id)).toEqual(['b']);
  });
});
