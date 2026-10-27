import { describe, expect, it } from 'vitest';

import { Company, SelectionStatus } from '../types';
import { getStatusList, groupCompaniesByStatus, normalizeSelectionStatus } from './companyUtils';

const company = (id: string, status: SelectionStatus): Company => ({
  id, status, type: 'internship', companyName: id, favorite: false,
  loginId: '', password: '', tags: [], createdAt: '2026-10-01', updatedAt: '2026-10-01',
});

describe('completed internship status', () => {
  it('places completed last in internships and omits it in full-time selections', () => {
    const statuses = getStatusList('internship');
    expect(statuses[statuses.length - 1]).toBe('完了');
    expect(getStatusList('fullTime')).not.toContain('完了');
    expect(statuses.filter((status) => status !== '完了')).toEqual(getStatusList('fullTime'));
    expect(normalizeSelectionStatus('完了')).toBe('完了');
  });

  it('keeps completed companies visible in the final group', () => {
    const completed = company('completed', '完了');
    const groups = groupCompaniesByStatus([completed, company('entry', '未エントリー'), company('withdrawn', '辞退')], 'internship');
    expect(groups.map((group) => group.status)).toEqual(['未エントリー', '辞退', '完了']);
    expect(groups[2].companies).toEqual([completed]);
  });
});
