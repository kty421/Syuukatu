import { describe, expect, it } from 'vitest';

import type { ApplicationType, Company, SelectionStatus } from '../types';
import { buildCompanyListItems } from './companyListUtils';
import { filterAndSortCompanies, groupCompaniesByStatus } from './companyUtils';

const company = (status: SelectionStatus, type: ApplicationType = 'internship'): Company => ({
  id: status, status, type, companyName: status, favorite: false,
  loginId: '', password: '', tags: [], createdAt: '2026-10-01', updatedAt: '2026-10-01',
});

const boundaryStatuses = (companies: Company[], type: ApplicationType) =>
  buildCompanyListItems(groupCompaniesByStatus(companies, type))
    .filter((item) => item.kind === 'section' && item.hasStatusBoundary)
    .map((item) => item.status);

describe('company list status boundary', () => {
  it.each<{
    statuses: SelectionStatus[];
    type: ApplicationType;
    expected: SelectionStatus[];
  }>([
    { statuses: [], type: 'internship', expected: [] },
    { statuses: ['未エントリー', '参加確定'], type: 'internship', expected: [] },
    { statuses: ['内定'], type: 'fullTime', expected: [] },
    { statuses: ['落選', '辞退', '完了'], type: 'internship', expected: [] },
    { statuses: ['未エントリー', '落選', '辞退', '完了'], type: 'internship', expected: ['落選'] },
    { statuses: ['参加確定', '辞退', '完了'], type: 'internship', expected: ['辞退'] },
    { statuses: ['参加確定', '完了'], type: 'internship', expected: ['完了'] },
    { statuses: ['参加確定', '内定', '落選', '辞退'], type: 'fullTime', expected: ['落選'] },
  ])('separates visible statuses $statuses in $type at $expected', ({ statuses, type, expected }) => {
    expect(boundaryStatuses(statuses.map((status) => company(status, type)), type)).toEqual(expected);
  });

  it('updates the boundary when search hides the preceding groups without changing the section ID or count', () => {
    const companies = [company('参加確定'), company('辞退')];
    const before = buildCompanyListItems(groupCompaniesByStatus(companies, 'internship'));
    const filtered = filterAndSortCompanies(companies, 'internship', '辞退');
    const after = buildCompanyListItems(groupCompaniesByStatus(filtered, 'internship'));
    expect(before.find((item) => item.id === 'section:辞退')).toMatchObject({
      count: 1, hasStatusBoundary: true,
    });
    expect(after.find((item) => item.id === 'section:辞退')).toMatchObject({
      count: 1, hasStatusBoundary: false,
    });
  });

  it('moves the boundary after a company changes status and removes it when only closed groups remain', () => {
    const confirmed = company('参加確定');
    const withdrawn = company('辞退');
    expect(boundaryStatuses([confirmed, withdrawn], 'internship')).toEqual(['辞退']);
    const rejected: Company = { ...confirmed, status: '落選' };
    expect(boundaryStatuses([rejected, withdrawn], 'internship')).toEqual([]);
    const offered: Company = { ...confirmed, type: 'fullTime', status: '内定' };
    expect(boundaryStatuses([offered, { ...withdrawn, type: 'fullTime' }], 'fullTime')).toEqual(['辞退']);
  });
});
