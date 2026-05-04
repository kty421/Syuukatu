import type { VercelRequest } from './vercel';

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const getRequestOrigin = (req: VercelRequest) => {
  const host = firstHeader(req.headers['x-forwarded-host']) ?? req.headers.host;

  if (!host) {
    return '';
  }

  const forwardedProto = firstHeader(req.headers['x-forwarded-proto']);
  const proto =
    forwardedProto ?? (host.startsWith('localhost') ? 'http' : 'https');

  return `${proto}://${host}`;
};

export const getWebAuthCallbackUrl = (req: VercelRequest) => {
  const configured =
    process.env.WEB_AUTH_CALLBACK_URL ??
    process.env.EXPO_PUBLIC_WEB_AUTH_CALLBACK_URL;

  if (configured) {
    return configured;
  }

  const origin = getRequestOrigin(req);

  return origin ? `${origin}/api/auth/callback` : undefined;
};
