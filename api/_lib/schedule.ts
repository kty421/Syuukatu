import { z } from 'zod';

export const scheduleTypes = [
  '面接',
  'GD',
  '説明会',
  'ES締切',
  'Webテスト',
  'インターン',
  'OB訪問',
  '面談',
  'その他'
] as const;

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);
const colorCodeSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const scheduleCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  colorCode: colorCodeSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const upsertScheduleCategoryBodySchema = z.object({
  category: scheduleCategorySchema
});

export const companyScheduleSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  title: z.string().default(''),
  type: z.enum(scheduleTypes).default('その他'),
  categoryId: z.string().min(1).nullable().optional(),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  isAllDay: z.boolean().default(true),
  memo: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export const upsertCompanyScheduleBodySchema = z.object({
  schedule: companyScheduleSchema
});

export type CompanySchedulePayload = z.infer<typeof companyScheduleSchema>;
export type ScheduleCategoryPayload = z.infer<typeof scheduleCategorySchema>;

export type ScheduleCategoryRow = {
  id: string;
  user_id: string;
  name: string;
  color_code: string;
  created_at: string;
  updated_at: string;
};

export type CompanyScheduleRow = {
  id: string;
  user_id: string;
  company_id: string;
  title: string;
  type: string | null;
  category_id: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

const optionalToNull = (value: string | undefined) =>
  value && value.trim() ? value.trim() : null;

const normalizeTime = (value: string | null | undefined) =>
  value ? value.slice(0, 5) : undefined;

export const toScheduleCategoryRow = (
  category: ScheduleCategoryPayload,
  userId: string
): ScheduleCategoryRow => ({
  id: category.id,
  user_id: userId,
  name: category.name.trim(),
  color_code: category.colorCode,
  created_at: category.createdAt,
  updated_at: category.updatedAt
});

export const fromScheduleCategoryRow = (
  row: ScheduleCategoryRow
): ScheduleCategoryPayload => ({
  id: row.id,
  name: row.name,
  colorCode: row.color_code,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const toCompanyScheduleRow = (
  schedule: CompanySchedulePayload,
  userId: string
): CompanyScheduleRow => ({
  id: schedule.id,
  user_id: userId,
  company_id: schedule.companyId,
  title: schedule.title.trim(),
  type: schedule.type,
  category_id: schedule.categoryId ?? null,
  start_date: schedule.startDate,
  end_date: schedule.endDate ?? schedule.startDate,
  start_time: schedule.isAllDay ? null : optionalToNull(schedule.startTime),
  end_time: schedule.isAllDay ? null : optionalToNull(schedule.endTime),
  is_all_day: schedule.isAllDay,
  memo: optionalToNull(schedule.memo),
  created_at: schedule.createdAt,
  updated_at: schedule.updatedAt
});

export const fromCompanyScheduleRow = (
  row: CompanyScheduleRow
): CompanySchedulePayload => ({
  id: row.id,
  companyId: row.company_id,
  title: row.title ?? '',
  type: scheduleTypes.includes(row.type as CompanySchedulePayload['type'])
    ? (row.type as CompanySchedulePayload['type'])
    : 'その他',
  categoryId: row.category_id ?? null,
  startDate: row.start_date,
  endDate: row.end_date ?? row.start_date,
  startTime: normalizeTime(row.start_time),
  endTime: normalizeTime(row.end_time),
  isAllDay: row.is_all_day,
  memo: row.memo ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});
