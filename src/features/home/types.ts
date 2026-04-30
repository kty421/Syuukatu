export type ApplicationType = 'internship' | 'fullTime';

export type AspirationLevel = 'high' | 'middle' | 'low' | 'unset';

export type CompanyQuestionAnswer = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyQuestionAnswerDraft = Omit<
  CompanyQuestionAnswer,
  'id' | 'createdAt' | 'updatedAt'
> & {
  id?: string;
};

export const applicationTypeLabels: Record<ApplicationType, string> = {
  internship: 'インターン',
  fullTime: '本選考'
};

export const selectionStatuses = [
  '未エントリー',
  'エントリー済み',
  'ES提出済み',
  '適性検査',
  '1次面接',
  '2次面接',
  '最終面接',
  '内々定',
  'お見送り',
  '辞退'
] as const;

export type SelectionStatus = (typeof selectionStatuses)[number];

export type Company = {
  id: string;
  type: ApplicationType;
  companyName: string;
  aspiration: AspirationLevel;
  status: SelectionStatus;
  loginId: string;
  password: string;
  myPageUrl?: string;
  industry?: string;
  role?: string;
  tags: string[];
  questionAnswers?: CompanyQuestionAnswer[];
  memo?: string;
  favorite: boolean;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CompanyDraft = Omit<Company, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};
