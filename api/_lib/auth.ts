import type { User } from '@supabase/supabase-js';
import { parse, serialize } from 'cookie';

import { HttpError } from './http';
import {
  isSupabaseConfigError,
  normalizeAuthErrorMessage
} from './authErrors';
import { createSupabaseServerClient } from './supabase';
import type { VercelRequest, VercelResponse } from './vercel';

const ACCESS_COOKIE = 'syuukatu_sb_access';
const REFRESH_COOKIE = 'syuukatu_sb_refresh';
const PKCE_COOKIE = 'syuukatu_sb_pkce';
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;
const PKCE_MAX_AGE = 60 * 10;

const isSecureCookie =
  process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

const appendSetCookie = (res: VercelResponse, value: string) => {
  const current = res.getHeader('Set-Cookie');

  if (!current) {
    res.setHeader('Set-Cookie', value);
    return;
  }

  res.setHeader(
    'Set-Cookie',
    Array.isArray(current) ? [...current, value] : [String(current), value]
  );
};

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  maxAge,
  path: '/',
  sameSite: 'lax' as const,
  secure: isSecureCookie
});

export const setSessionCookies = (
  res: VercelResponse,
  session: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
  }
) => {
  appendSetCookie(
    res,
    serialize(
      ACCESS_COOKIE,
      session.access_token,
      cookieOptions(session.expires_in ?? 3600)
    )
  );
  appendSetCookie(
    res,
    serialize(
      REFRESH_COOKIE,
      session.refresh_token,
      cookieOptions(REFRESH_MAX_AGE)
    )
  );
};

export const clearSessionCookies = (res: VercelResponse) => {
  appendSetCookie(res, serialize(ACCESS_COOKIE, '', cookieOptions(0)));
  appendSetCookie(res, serialize(REFRESH_COOKIE, '', cookieOptions(0)));
};

export const setAuthPkceCookie = (
  res: VercelResponse,
  codeVerifier: string
) => {
  appendSetCookie(
    res,
    serialize(PKCE_COOKIE, codeVerifier, cookieOptions(PKCE_MAX_AGE))
  );
};

export const clearAuthPkceCookie = (res: VercelResponse) => {
  appendSetCookie(res, serialize(PKCE_COOKIE, '', cookieOptions(0)));
};

export const getAuthPkceVerifier = (req: VercelRequest) => {
  const cookies = parse(req.headers.cookie ?? '');

  return cookies[PKCE_COOKIE] ?? null;
};

const getCookieTokens = (req: VercelRequest) => {
  const cookies = parse(req.headers.cookie ?? '');

  return {
    accessToken: cookies[ACCESS_COOKIE],
    refreshToken: cookies[REFRESH_COOKIE]
  };
};

const getBearerToken = (req: VercelRequest) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim();
};

export const getRequestTokens = (req: VercelRequest) => {
  const bearerToken = getBearerToken(req);

  if (bearerToken) {
    return {
      accessToken: bearerToken,
      refreshToken: null,
      usesCookie: false
    };
  }

  const cookieTokens = getCookieTokens(req);

  return {
    ...cookieTokens,
    usesCookie: true
  };
};

export const getAuthenticatedSupabase = async (
  req: VercelRequest,
  res: VercelResponse
) => {
  const { accessToken, refreshToken, usesCookie } = getRequestTokens(req);

  if (accessToken) {
    const supabase = createSupabaseServerClient(accessToken);
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error && isSupabaseConfigError(error.message)) {
      throw new HttpError(500, normalizeAuthErrorMessage(error.message));
    }

    if (!error && data.user) {
      return { supabase, user: data.user, accessToken };
    }
  }

  if (usesCookie && refreshToken) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error && isSupabaseConfigError(error.message)) {
      throw new HttpError(500, normalizeAuthErrorMessage(error.message));
    }

    if (!error && data.session && data.user) {
      setSessionCookies(res, data.session);
      return {
        supabase: createSupabaseServerClient(data.session.access_token),
        user: data.user,
        accessToken: data.session.access_token
      };
    }
  }

  throw new HttpError(401, 'ログインが必要です。');
};

export const toAuthUser = (user: User) => ({
  id: user.id,
  email: user.email ?? null
});
