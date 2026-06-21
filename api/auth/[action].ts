import { z } from 'zod';

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE
} from '../../src/shared/authPolicy';
import {
  clearAuthPkceCookie,
  clearSessionCookies,
  getAuthPkceVerifier,
  getAuthenticatedSupabase,
  getRequestTokens,
  setSessionCookies,
  toAuthUser
} from '../_lib/auth';
import {
  getAuthErrorStatus,
  isSupabaseConfigError,
  normalizeAuthErrorMessage
} from '../_lib/authErrors';
import {
  handleApiError,
  handleCorsPreflight,
  parseRequestBody,
  requireMethod,
  sendJson
} from '../_lib/http';
import { createPkceStorage } from '../_lib/pkce';
import {
  createSupabaseAdminClient,
  createSupabaseServerClient
} from '../_lib/supabase';
import {
  getConfirmEmailRedirectUrl,
  getResetPasswordRedirectUrl
} from '../_lib/url';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

const EMAIL_EXISTS_MESSAGE =
  'このメールアドレスはすでに登録されています。ログイン画面からお試しください。';
const USER_LOOKUP_PAGE_SIZE = 1000;
const USER_LOOKUP_MAX_PAGES = 50;

const signInBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const signUpBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT_MESSAGE)
});

const emailBodySchema = z.object({
  email: z.string().email()
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const redirectHome = (res: VercelResponse, status: 'confirmed' | 'error') => {
  res.redirect(302, `/?auth=${status}`);
};

const hasExistingAuthUser = async (email: string) => {
  const supabase = createSupabaseAdminClient();
  const targetEmail = normalizeEmail(email);

  for (let page = 1; page <= USER_LOOKUP_MAX_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: USER_LOOKUP_PAGE_SIZE
    });

    if (error) {
      throw error;
    }

    const users = data.users ?? [];

    if (
      users.some((user) => normalizeEmail(user.email ?? '') === targetEmail)
    ) {
      return true;
    }

    if (users.length < USER_LOOKUP_PAGE_SIZE) {
      return false;
    }
  }

  throw new Error('ユーザー情報の確認に失敗しました。');
};

const hasObfuscatedDuplicateUser = (data: {
  user?: { identities?: unknown[] | null } | null;
}) =>
  Boolean(
    data.user &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
  );

const isUserLookupError = (message: string) => {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('user not found') ||
    normalized.includes('email not found') ||
    normalized.includes('not found')
  );
};

const handleAuthCallback = async (
  req: VercelRequest,
  res: VercelResponse
) => {
  const code = getQueryValue(req.query.code);

  try {
    if (!code) {
      clearAuthPkceCookie(res);
      redirectHome(res, 'error');
      return;
    }

    const pkce = createPkceStorage(getAuthPkceVerifier(req));
    const supabase = createSupabaseServerClient(undefined, {
      flowType: 'pkce',
      storage: pkce.storage
    });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    clearAuthPkceCookie(res);

    if (error || !data.session) {
      redirectHome(res, 'error');
      return;
    }

    setSessionCookies(res, data.session);
    redirectHome(res, 'confirmed');
  } catch {
    clearAuthPkceCookie(res);
    redirectHome(res, 'error');
  }
};

const handleResendConfirmation = async (
  req: VercelRequest,
  res: VercelResponse
) => {
  try {
    requireMethod(req.method, ['POST']);
    const body = emailBodySchema.parse(parseRequestBody(req.body));
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: body.email,
      options: {
        emailRedirectTo: getConfirmEmailRedirectUrl()
      }
    });

    if (error) {
      sendJson(res, getAuthErrorStatus(error.message), {
        error: normalizeAuthErrorMessage(error.message)
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      message: '確認メールを再送しました。'
    });
  } catch (error) {
    handleApiError(res, error);
  }
};

const handleResetPassword = async (
  req: VercelRequest,
  res: VercelResponse
) => {
  try {
    requireMethod(req.method, ['POST']);
    const body = emailBodySchema.parse(parseRequestBody(req.body));
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: getResetPasswordRedirectUrl()
    });

    if (error) {
      if (isUserLookupError(error.message)) {
        sendJson(res, 200, { ok: true });
        return;
      }

      sendJson(res, getAuthErrorStatus(error.message), {
        error: normalizeAuthErrorMessage(error.message)
      });
      return;
    }

    sendJson(res, 200, { ok: true });
  } catch (error) {
    handleApiError(res, error);
  }
};

const handleSession = async (req: VercelRequest, res: VercelResponse) => {
  try {
    requireMethod(req.method, ['GET']);
    const { user } = await getAuthenticatedSupabase(req, res);
    sendJson(res, 200, { user: toAuthUser(user) });
  } catch (error) {
    handleApiError(res, error);
  }
};

const handleSignIn = async (req: VercelRequest, res: VercelResponse) => {
  try {
    requireMethod(req.method, ['POST']);
    const body = signInBodySchema.parse(parseRequestBody(req.body));
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(body);

    if (error && isSupabaseConfigError(error.message)) {
      sendJson(res, getAuthErrorStatus(error.message, 500), {
        error: normalizeAuthErrorMessage(error.message)
      });
      return;
    }

    if (error || !data.user || !data.session) {
      sendJson(res, 401, {
        error: 'メールアドレスまたはパスワードを確認してください。'
      });
      return;
    }

    setSessionCookies(res, data.session);
    sendJson(res, 200, { user: toAuthUser(data.user) });
  } catch (error) {
    handleApiError(res, error);
  }
};

const handleSignOut = async (req: VercelRequest, res: VercelResponse) => {
  try {
    requireMethod(req.method, ['POST', 'DELETE']);

    if (req.method === 'DELETE') {
      const { user } = await getAuthenticatedSupabase(req, res);
      const supabaseAdmin = createSupabaseAdminClient();
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

      if (error) {
        sendJson(res, 400, {
          error: 'アカウントの削除に失敗しました。'
        });
        return;
      }

      clearSessionCookies(res);
      sendJson(res, 200, { ok: true });
      return;
    }

    const { accessToken, refreshToken } = getRequestTokens(req);

    if (accessToken && refreshToken) {
      try {
        const supabase = createSupabaseServerClient();
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        await supabase.auth.signOut();
      } catch {
        // Cookie clearing below is still the local source of truth for logout UX.
      }
    }

    clearSessionCookies(res);
    sendJson(res, 200, { ok: true });
  } catch (error) {
    clearSessionCookies(res);
    handleApiError(res, error);
  }
};

const handleSignUp = async (req: VercelRequest, res: VercelResponse) => {
  try {
    requireMethod(req.method, ['POST']);
    const body = signUpBodySchema.parse(parseRequestBody(req.body));

    if (await hasExistingAuthUser(body.email)) {
      sendJson(res, 409, { error: EMAIL_EXISTS_MESSAGE });
      return;
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      ...body,
      options: {
        emailRedirectTo: getConfirmEmailRedirectUrl()
      }
    });

    if (error) {
      const message = normalizeAuthErrorMessage(error.message);
      sendJson(res, getAuthErrorStatus(error.message), { error: message });
      return;
    }

    if (hasObfuscatedDuplicateUser(data)) {
      sendJson(res, 409, { error: EMAIL_EXISTS_MESSAGE });
      return;
    }

    sendJson(res, 200, {
      user: null,
      message:
        '確認メールを送信しました。メール内のリンクから認証を完了してください。'
    });
  } catch (error) {
    handleApiError(res, error);
  }
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (handleCorsPreflight(req, res)) {
    return;
  }

  const action = getQueryValue(req.query.action);

  switch (action) {
    case 'callback':
      await handleAuthCallback(req, res);
      return;
    case 'resend-confirmation':
      await handleResendConfirmation(req, res);
      return;
    case 'reset-password':
      await handleResetPassword(req, res);
      return;
    case 'session':
      await handleSession(req, res);
      return;
    case 'sign-in':
      await handleSignIn(req, res);
      return;
    case 'sign-out':
      await handleSignOut(req, res);
      return;
    case 'sign-up':
      await handleSignUp(req, res);
      return;
    default:
      sendJson(res, 404, { error: 'Not Found' });
  }
}
