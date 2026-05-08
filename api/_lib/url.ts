import type { VercelRequest } from './vercel';

const DEFAULT_WEB_BASE_URL = 'https://syuukatu.vercel.app';

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const normalizeEnvValue = (value: string | undefined) =>
  value?.trim().replace(/^['"]|['"]$/g, '') ?? '';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getConfiguredWebBaseUrl = () =>
  trimTrailingSlash(
    normalizeEnvValue(process.env.WEB_BASE_URL) ||
      normalizeEnvValue(process.env.EXPO_PUBLIC_WEB_BASE_URL) ||
      DEFAULT_WEB_BASE_URL
  );

const getConfiguredRedirectUrl = (
  serverValue: string | undefined,
  publicValue: string | undefined,
  fallbackPath: string
) => {
  const configured = normalizeEnvValue(serverValue) || normalizeEnvValue(publicValue);

  return configured
    ? trimTrailingSlash(configured)
    : `${getConfiguredWebBaseUrl()}${fallbackPath}`;
};

export const getConfirmEmailRedirectUrl = () =>
  getConfiguredRedirectUrl(
    process.env.CONFIRM_EMAIL_REDIRECT_URL,
    process.env.EXPO_PUBLIC_CONFIRM_EMAIL_REDIRECT_URL,
    '/auth/confirm'
  );

export const getResetPasswordRedirectUrl = () =>
  getConfiguredRedirectUrl(
    process.env.RESET_PASSWORD_REDIRECT_URL,
    process.env.EXPO_PUBLIC_RESET_PASSWORD_REDIRECT_URL,
    '/auth/reset-password'
  );

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
