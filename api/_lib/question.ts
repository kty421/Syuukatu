import { z } from 'zod';

export const questionMemoSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1).nullable(),
  question: z.string(),
  answer: z.string().default(''),
  labelIds: z.array(z.string().min(1)).default([]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const upsertQuestionMemoBodySchema = z.object({
  questionMemo: questionMemoSchema
});

export const questionLabelSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  sortOrder: z.number().int().optional().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const upsertQuestionLabelBodySchema = z.object({
  label: questionLabelSchema
});

export const reorderQuestionLabelsBodySchema = z.object({
  labels: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int()
    })
  )
});

export type QuestionMemoPayload = z.infer<typeof questionMemoSchema>;
export type QuestionLabelPayload = z.infer<typeof questionLabelSchema> & {
  createdAt: string;
  updatedAt: string;
};

export type QuestionMemoRow = {
  id: string;
  user_id: string;
  company_id: string | null;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
  question_memo_labels?: { label_id: string }[] | null;
};

export type QuestionLabelRow = {
  id: string;
  user_id: string;
  name: string;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

export const toQuestionMemoRow = (
  questionMemo: QuestionMemoPayload,
  userId: string
) => ({
  id: questionMemo.id,
  user_id: userId,
  company_id: questionMemo.companyId,
  question: questionMemo.question.trim(),
  answer: questionMemo.answer.trim(),
  created_at: questionMemo.createdAt,
  updated_at: questionMemo.updatedAt
});

export const fromQuestionMemoRow = (
  row: QuestionMemoRow
): QuestionMemoPayload => ({
  id: row.id,
  companyId: row.company_id,
  question: row.question ?? '',
  answer: row.answer ?? '',
  labelIds: unique(
    (row.question_memo_labels ?? []).map((label) => label.label_id)
  ),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const toQuestionLabelRow = (
  label: QuestionLabelPayload,
  userId: string
) => ({
  id: label.id,
  user_id: userId,
  name: label.name.trim(),
  sort_order: label.sortOrder,
  created_at: label.createdAt,
  updated_at: label.updatedAt
});

export const fromQuestionLabelRow = (
  row: QuestionLabelRow
): QuestionLabelPayload => ({
  id: row.id,
  name: row.name,
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const uniqueLabelIds = (labelIds: string[]) => unique(labelIds);
