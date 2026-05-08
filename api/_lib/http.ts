import { ZodError } from 'zod';

import type { VercelRequest, VercelResponse } from './vercel';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getConfiguredCorsOrigins = () =>
  [
    process.env.CORS_ALLOWED_ORIGINS,
    process.env.WEB_ALLOWED_ORIGINS,
    process.env.WEB_BASE_URL,
    process.env.EXPO_PUBLIC_WEB_BASE_URL,
    process.env.CONFIRM_EMAIL_REDIRECT_URL,
    process.env.EXPO_PUBLIC_CONFIRM_EMAIL_REDIRECT_URL,
    process.env.RESET_PASSWORD_REDIRECT_URL,
    process.env.EXPO_PUBLIC_RESET_PASSWORD_REDIRECT_URL,
    process.env.EXPO_PUBLIC_WEB_ORIGIN,
    process.env.WEB_AUTH_CALLBACK_URL,
    process.env.EXPO_PUBLIC_WEB_AUTH_CALLBACK_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => {
      try {
        return new URL(value.trim()).origin;
      } catch {
        return value.trim().replace(/\/+$/, '');
      }
    })
    .filter(Boolean);

const isLocalDevOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

const isAllowedCorsOrigin = (origin: string) =>
  isLocalDevOrigin(origin) || getConfiguredCorsOrigins().includes(origin);

export const applyCorsHeaders = (
  req: VercelRequest,
  res: VercelResponse
) => {
  const origin = firstHeader(req.headers.origin);

  if (!origin || !isAllowedCorsOrigin(origin)) {
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,DELETE,OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    firstHeader(req.headers['access-control-request-headers']) ??
      'Accept, Authorization, Content-Type'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
};

export const handleCorsPreflight = (
  req: VercelRequest,
  res: VercelResponse
) => {
  applyCorsHeaders(req, res);

  if (req.method !== 'OPTIONS') {
    return false;
  }

  res.status(204);
  if (res.end) {
    res.end();
    return true;
  }

  res.json(null);
  return true;
};

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
