import { describe, expect, it } from 'vitest';

import { ApplicationType, Company, SelectionStatus } from '../types';
import { buildCompanySearchIndex, filterAndSortCompanies, getStatusList, groupCompaniesByStatus, normalizeSelectionStatus } from './companyUtils';

const company = (id: string, status: SelectionStatus, type: ApplicationType = 'internship'): Company => ({
  id, status, type, companyName: id, favorite: false,
  loginId: '', password: '', tags: [], createdAt: '2026-10-01', updatedAt: '2026-10-01',
});

describe('completed internship status', () => {
  it('places completed last in internships and omits it in full-time selections', () => {
    const statuses = getStatusList('internship');
    expect(statuses[statuses.length - 1]).toBe('完了');
    expect(getStatusList('fullTime')).not.toContain('完了');
    expect(statuses.filter((status) => status !== '完了'))
      .toEqual(getStatusList('fullTime').filter((status) => status !== '内定'));
    expect(normalizeSelectionStatus('完了', 'internship')).toBe('完了');
  });

  it('keeps completed companies visible in the final group', () => {
    const completed = company('completed', '完了');
    const groups = groupCompaniesByStatus([completed, company('entry', '未エントリー'), company('withdrawn', '辞退')], 'internship');
    expect(groups.map((group) => group.status)).toEqual(['未エントリー', '辞退', '完了']);
    expect(groups[2].companies).toEqual([completed]);
  });
});

describe('full-time offers', () => {
  it('places offers immediately after confirmed participation only in full-time selections', () => {
    const statuses = getStatusList('fullTime');
    expect(statuses.slice(statuses.indexOf('参加確定'))).toEqual(['参加確定', '内定', '落選', '辞退']);
    expect(getStatusList('internship')).not.toContain('内定');
  });

  it('preserves full-time offers while keeping legacy internship offers visible as confirmed participation', () => {
    expect(normalizeSelectionStatus('内定', 'fullTime')).toBe('内定');
    expect(normalizeSelectionStatus('内定', 'internship')).toBe('参加確定');
    for (const type of ['internship', 'fullTime'] as const) {
      expect(normalizeSelectionStatus('参加確定', type)).toBe('参加確定');
      expect(normalizeSelectionStatus('内々定', type)).toBe('参加確定');
      expect(normalizeSelectionStatus('参加済み', type)).toBe('参加確定');
      expect(normalizeSelectionStatus('お見送り', type)).toBe('落選');
      expect(normalizeSelectionStatus('unknown', type)).toBe('未エントリー');
    }
  });

  it('groups offers separately in status order and preserves company records', () => {
    const offered = company('offered', '内定', 'fullTime');
    const confirmed = company('confirmed', '参加確定', 'fullTime');
    const rejected = company('rejected', '落選', 'fullTime');
    const groups = groupCompaniesByStatus([rejected, offered, confirmed], 'fullTime');
    expect(groups.map((group) => group.status)).toEqual(['参加確定', '内定', '落選']);
    expect(groups[1].companies).toEqual([offered]);
    expect(groups[1].companies[0]).toBe(offered);
  });

  it('keeps legacy internship offers searchable by both their stored and displayed status', () => {
    const legacy = company('legacy', '内定');
    const companies = [legacy];
    const searchIndex = buildCompanySearchIndex(companies);
    expect(groupCompaniesByStatus(companies, 'internship'))
      .toEqual([{ status: '参加確定', companies: [legacy] }]);
    for (const query of ['内定', '参加確定']) {
      expect(filterAndSortCompanies(companies, 'internship', query, searchIndex)).toEqual([legacy]);
    }
    expect(legacy.status).toBe('内定');
  });
});
