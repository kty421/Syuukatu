import { z } from 'zod';

import {
  maxLengthString,
  optionalTrimmedString,
  optionalUrlString,
  trimmedString
} from '../../../../shared/validation/commonSchemas';

export const applicationTypeSchema = z.enum(['internship', 'fullTime']);

export const companyQuestionAnswerSchema = z.object({
  answer: z.string(),
  companyId: z.string().nullable().optional(),
  createdAt: z.string(),
  id: z.string().min(1),
  labelIds: z.array(z.string()).optional(),
  question: z.string(),
  updatedAt: z.string()
});

export const companySchema = z.object({
  archived: z.boolean().optional().default(false),
  companyName: trimmedString('企業名を入力してください。'),
  createdAt: z.string(),
  favorite: z.boolean().default(false),
  id: z.string().min(1),
  industry: optionalTrimmedString(),
  loginId: maxLengthString(200),
  memo: optionalTrimmedString(),
  myPageUrl: optionalUrlString(),
  password: z.string(),
  questionAnswers: z.array(companyQuestionAnswerSchema).optional(),
  role: optionalTrimmedString(),
  status: z.string().min(1),
  tags: z.array(z.string()).default([]),
  type: applicationTypeSchema,
  updatedAt: z.string()
});

export const companyDraftSchema = companySchema
  .omit({
    createdAt: true,
    id: true,
    updatedAt: true
  })
  .extend({
    createdAt: z.string().optional(),
    id: z.string().optional(),
    updatedAt: z.string().optional()
  });
