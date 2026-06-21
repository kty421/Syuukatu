import { z, ZodType } from 'zod';

import { HttpError, parseRequestBody } from './http';

export const requireJsonContentType = (contentType: string | undefined) => {
  if (!contentType?.toLowerCase().includes('application/json')) {
    throw new HttpError(415, 'リクエスト形式が正しくありません。');
  }
};

export const parseValidatedBody = <T>(
  schema: ZodType<T>,
  body: unknown
): T => {
  const parsedBody = parseRequestBody(body);
  const result = schema.safeParse(parsedBody);

  if (!result.success) {
    throw new HttpError(422, '入力内容を確認してください。');
  }

  return result.data;
};

export { z };
