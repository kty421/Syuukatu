import {
  ApplicationType,
  Company,
  selectionStatuses,
  SelectionStatus
} from '../types';

const aspirationRank: Record<Company['aspiration'], number> = {
  high: 0,
  middle: 1,
  low: 2,
  unset: 3
};

const legacyStatusMap: Record<string, SelectionStatus> = {
  検討中: '未エントリー',
  応募予定: '未エントリー',
  エントリー準備: '未エントリー',
  応募済み: 'エントリー済み',
  書類提出済み: 'ES提出済み',
  Webテスト: '適性検査',
  面接: '1次面接',
  参加確定: '内々定',
  参加済み: '内々定',
  不参加: '辞退'
};

export const getStatusList = (_type?: ApplicationType): SelectionStatus[] => [
  ...selectionStatuses
];

export const normalizeSelectionStatus = (status: string): SelectionStatus => {
  if ((selectionStatuses as readonly string[]).includes(status)) {
    return status as SelectionStatus;
  }

  return legacyStatusMap[status] ?? '未エントリー';
};

export const formatUpdatedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getMonth() + 1}/${date.getDate()}更新`;
};

export const filterAndSortCompanies = (
  companies: Company[],
  type: ApplicationType,
  query: string
) => {
  const normalizedQuery = query.trim().toLowerCase();

  return companies
    .filter((company) => !company.archived && company.type === type)
    .filter((company) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
        company.companyName,
        company.loginId,
        company.industry,
        company.role,
        company.status,
        ...company.tags
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (a.favorite !== b.favorite) {
        return a.favorite ? -1 : 1;
      }

      const aspirationDiff = aspirationRank[a.aspiration] - aspirationRank[b.aspiration];
      if (aspirationDiff !== 0) {
        return aspirationDiff;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
};

export const groupCompaniesByStatus = (
  companies: Company[],
  type: ApplicationType
) => {
  const statuses = getStatusList(type);

  return statuses
    .map((status) => ({
      status,
      companies: companies.filter((company) => company.status === status)
    }))
    .filter((group) => group.companies.length > 0);
};
