import { z } from 'zod';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export const trimString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value;

export const trimmedString = (message = '入力してください。') =>
  z.preprocess(trimString, z.string().min(1, message));

export const optionalTrimmedString = () =>
  z.preprocess((value) => {
    const trimmed = trimString(value);
    return trimmed === '' ? undefined : trimmed;
  }, z.string().optional());

export const maxLengthString = (maxLength: number, message?: string) =>
  z
    .preprocess(trimString, z.string())
    .refine((value) => value.length <= maxLength, {
      message: message ?? `${maxLength}文字以内で入力してください。`
    });

export const optionalUrlString = () =>
  optionalTrimmedString().refine(
    (value) => {
      if (!value) {
        return true;
      }

      try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
      } catch {
        return false;
      }
    },
    { message: 'URLを正しく入力してください。' }
  );

export const isoDateString = () =>
  z.string().regex(isoDatePattern, '日付をYYYY-MM-DD形式で入力してください。');

export const dateOrderSchema = z
  .object({
    endDate: z.string().optional(),
    startDate: isoDateString()
  })
  .refine(
    ({ endDate, startDate }) => !endDate || endDate >= startDate,
    { message: '終了日は開始日以降にしてください。' }
  );
