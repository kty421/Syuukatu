import { z } from 'zod';

import {
  clearAuthPkceCookie,
  setAuthPkceCookie,
  setSessionCookies,
  toAuthUser
} from '../_lib/auth';
import {
  getAuthErrorStatus,
  normalizeAuthErrorMessage
} from '../_lib/authErrors';
import { handleApiError, parseRequestBody, requireMethod, sendJson } from '../_lib/http';
import { createPkceStorage } from '../_lib/pkce';
import { createSupabaseServerClient } from '../_lib/supabase';
import { getWebAuthCallbackUrl } from '../_lib/url';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    requireMethod(req.method, ['POST']);
    const body = bodySchema.parse(parseRequestBody(req.body));
    const pkce = createPkceStorage();
    const supabase = createSupabaseServerClient(undefined, {
      flowType: 'pkce',
      storage: pkce.storage
    });
    const { data, error } = await supabase.auth.signUp({
      ...body,
      options: {
        emailRedirectTo: getWebAuthCallbackUrl(req)
      }
    });

    if (error) {
      clearAuthPkceCookie(res);
      const message = normalizeAuthErrorMessage(error.message);
      sendJson(res, getAuthErrorStatus(error.message), { error: message });
      return;
    }

    if (data.session) {
      setSessionCookies(res, data.session);
      clearAuthPkceCookie(res);
    } else {
      const codeVerifier = pkce.getCodeVerifier();

      if (codeVerifier) {
        setAuthPkceCookie(res, codeVerifier);
      }
    }

    sendJson(res, 200, {
      user: data.session && data.user ? toAuthUser(data.user) : null,
      message: data.session
        ? undefined
        : '確認メールを送信しました。メール内のリンクから登録を完了してください。'
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
