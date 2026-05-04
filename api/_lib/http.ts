import { ZodError } from 'zod';

import type { VercelResponse } from './vercel';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export const sendJson = (
  res: VercelResponse,
  status: number,
  body: unknown
) => {
  res.status(status).json(body);
};

export const handleApiError = (res: VercelResponse, error: unknown) => {
  if (error instanceof HttpError) {
    sendJson(res, error.status, { error: error.message });
    return;
  }

  if (error instanceof ZodError) {
    sendJson(res, 400, { error: '入力内容を確認してください。' });
    return;
  }

  sendJson(res, 500, {
    error: 'サーバーで問題が発生しました。しばらくしてからもう一度お試しください。'
  });
};

export const requireMethod = (actual: string | undefined, methods: string[]) => {
  if (!actual || !methods.includes(actual)) {
    throw new HttpError(405, 'この操作は許可されていません。');
  }
};

export const parseRequestBody = (body: unknown) => {
  if (typeof body !== 'string') {
    return body;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new HttpError(400, 'リクエスト本文を読み取れませんでした。');
  }
};
