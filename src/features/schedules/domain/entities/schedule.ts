export type ScheduleType =
  | '面接'
  | 'GD'
  | '説明会'
  | 'ES締切'
  | 'Webテスト'
  | 'インターン'
  | 'OB訪問'
  | '面談'
  | 'その他';

export type CompanySchedule = {
  categoryId?: string | null;
  companyId: string;
  createdAt: string;
  endDate?: string;
  endTime?: string;
  id: string;
  isAllDay: boolean;
  memo?: string;
  startDate: string;
  startTime?: string;
  title: string;
  type: ScheduleType;
  updatedAt: string;
};

export type ScheduleCategory = {
  colorCode: string;
  createdAt: string;
  id: string;
  name: string;
  updatedAt: string;
};
