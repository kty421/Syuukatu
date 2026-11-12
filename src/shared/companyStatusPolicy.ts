export const COMPLETED_STATUS_ERROR = '「完了」はインターンでのみ選択できます。';
export const OFFER_STATUS_ERROR = '「内定」は本選考でのみ選択できます。';

type CompanyStatus = {
  type: 'internship' | 'fullTime';
  status: string;
};

export const getCompanyStatusError = (company: CompanyStatus): string | null => {
  if (company.status === '完了' && company.type !== 'internship') {
    return COMPLETED_STATUS_ERROR;
  }
  if (company.status === '内定' && company.type !== 'fullTime') {
    return OFFER_STATUS_ERROR;
  }
  return null;
};

export const isCompanyStatusAllowed = (company: CompanyStatus) =>
  getCompanyStatusError(company) === null;
