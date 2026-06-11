export type ApplicationType = "internship" | "fullTime";

export const scheduleTypes = [
  "面接",
  "GD",
  "説明会",
  "ES締切",
  "Webテスト",
  "インターン",
  "OB訪問",
  "面談",
  "その他",
] as const;

export type ScheduleType = (typeof scheduleTypes)[number];

export type ScheduleCategory = {
  id: string;
  name: string;
  colorCode: string;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleCategoryDraft = Omit<
  ScheduleCategory,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanySchedule = {
  id: string;
  companyId: string;
  title: string;
  type: ScheduleType;
  categoryId?: string | null;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  memo?: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyQuestionAnswer = {
  id: string;
  companyId?: string | null;
  question: string;
  answer: string;
  labelIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export type CompanyQuestionAnswerDraft = Omit<
  CompanyQuestionAnswer,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
};

export type QuestionMemo = {
  id: string;
  companyId: string | null;
  question: string;
  answer: string;
  labelIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type QuestionMemoDraft = Omit<
  QuestionMemo,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type QuestionLabel = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export const applicationTypeLabels: Record<ApplicationType, string> = {
  internship: "インターン",
  fullTime: "本選考",
};

export const selectionStatuses = [
  "未エントリー",
  "エントリー済み",
  "ES結果待ち",
  "ES通過",
  "Webテスト結果待ち",
  "Webテスト通過",
  "GD選考結果待ち",
  "GD選考通過",
  "１次面接待ち",
  "１次面接通過",
  "２次面接待ち",
  "２次面接通過",
  "３次面接待ち",
  "３次面接通過",
  "４次面接待ち",
  "４次面接通過",
  "参加確定",
  "落選",
  "辞退",
] as const;

export type SelectionStatus = (typeof selectionStatuses)[number];

export type Company = {
  id: string;
  type: ApplicationType;
  companyName: string;
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

export type CompanyDraft = Omit<Company, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export type CompanyEditorDraft = CompanyDraft & {
  schedules?: CompanySchedule[];
};
