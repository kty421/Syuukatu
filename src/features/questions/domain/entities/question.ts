export type QuestionMemo = {
  answer: string;
  companyId: string | null;
  createdAt: string;
  id: string;
  labelIds: string[];
  question: string;
  updatedAt: string;
};

export type QuestionLabel = {
  createdAt: string;
  id: string;
  name: string;
  sortOrder: number;
  updatedAt: string;
};
