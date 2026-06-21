export type ApplicationType = 'internship' | 'fullTime';

export type CompanyQuestionAnswer = {
  answer: string;
  companyId?: string | null;
  createdAt: string;
  id: string;
  labelIds?: string[];
  question: string;
  updatedAt: string;
};

export type Company = {
  archived?: boolean;
  companyName: string;
  createdAt: string;
  favorite: boolean;
  id: string;
  industry?: string;
  loginId: string;
  memo?: string;
  myPageUrl?: string;
  password: string;
  questionAnswers?: CompanyQuestionAnswer[];
  role?: string;
  status: string;
  tags: string[];
  type: ApplicationType;
  updatedAt: string;
};

export type CompanyDraft = Omit<Company, 'createdAt' | 'id' | 'updatedAt'> & {
  createdAt?: string;
  id?: string;
  updatedAt?: string;
};
