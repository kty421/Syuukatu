import { z } from 'zod';

import { setSessionCookies, toAuthUser } from '../_lib/auth';
import {
  getAuthErrorStatus,
  isSupabaseConfigError,
  normalizeAuthErrorMessage
} from '../_lib/authErrors';
import { handleApiError, parseRequestBody, requireMethod, sendJson } from '../_lib/http';
import { createSupabaseServerClient } from '../_lib/supabase';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    requireMethod(req.method, ['POST']);
    const body = bodySchema.parse(parseRequestBody(req.body));
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
}
