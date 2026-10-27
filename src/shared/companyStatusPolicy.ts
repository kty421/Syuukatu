export const COMPLETED_STATUS_ERROR = '「完了」はインターンでのみ選択できます。';

export const isCompanyStatusAllowed = (company: {
  type: 'internship' | 'fullTime';
  status: string;
}) => company.status !== '完了' || company.type === 'internship';
