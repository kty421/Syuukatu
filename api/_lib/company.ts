import { z } from 'zod';

export const companySchema = z.object({
  id: z.string().min(1),
  type: z.enum(['internship', 'fullTime']),
  companyName: z.string().min(1),
  aspiration: z.enum(['high', 'middle', 'low', 'unset']),
  status: z.string().min(1),
  loginId: z.string().default(''),
  password: z.string().optional().default(''),
  myPageUrl: z.string().optional(),
  industry: z.string().optional(),
  role: z.string().optional(),
  tags: z.array(z.string()).default([]),
  questionAnswers: z
    .array(
      z.object({
        id: z.string().min(1),
        question: z.string(),
        answer: z.string(),
        createdAt: z.string().min(1),
        updatedAt: z.string().min(1)
      })
    )
    .default([]),
  memo: z.string().optional(),
  favorite: z.boolean().default(false),
  archived: z.boolean().optional().default(false),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const upsertCompanyBodySchema = z.object({
  company: companySchema
});

type CompanyPayload = z.infer<typeof companySchema>;

type CompanyRow = {
  id: string;
  user_id: string;
  type: string;
  company_name: string;
  aspiration: string;
  status: string;
  login_id: string;
  my_page_url: string | null;
  industry: string | null;
  role: string | null;
  tags: string[];
  question_answers: CompanyPayload['questionAnswers'];
  memo: string | null;
  favorite: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

const optionalToNull = (value: string | undefined) =>
  value && value.trim() ? value.trim() : null;

export const toCompanyRow = (
  company: CompanyPayload,
  userId: string
): CompanyRow => ({
  id: company.id,
  user_id: userId,
  type: company.type,
  company_name: company.companyName,
  aspiration: company.aspiration,
  status: company.status,
  login_id: company.loginId,
  my_page_url: optionalToNull(company.myPageUrl),
  industry: optionalToNull(company.industry),
  role: optionalToNull(company.role),
  tags: company.tags,
  question_answers: company.questionAnswers,
  memo: optionalToNull(company.memo),
  favorite: company.favorite,
  archived: company.archived ?? false,
  created_at: company.createdAt,
  updated_at: company.updatedAt
});

export const fromCompanyRow = (row: CompanyRow): CompanyPayload => ({
  id: row.id,
  type: row.type as CompanyPayload['type'],
  companyName: row.company_name,
  aspiration: row.aspiration as CompanyPayload['aspiration'],
  status: row.status,
  loginId: row.login_id ?? '',
  password: '',
  myPageUrl: row.my_page_url ?? undefined,
  industry: row.industry ?? undefined,
  role: row.role ?? undefined,
  tags: row.tags ?? [],
  questionAnswers: row.question_answers ?? [],
  memo: row.memo ?? undefined,
  favorite: row.favorite,
  archived: row.archived,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});
