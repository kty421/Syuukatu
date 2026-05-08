import { z } from 'zod';

import {
  getAuthErrorStatus,
  normalizeAuthErrorMessage
} from '../_lib/authErrors';
import {
  handleApiError,
  handleCorsPreflight,
  parseRequestBody,
  requireMethod,
  sendJson
} from '../_lib/http';
import { createSupabaseServerClient } from '../_lib/supabase';
import { getConfirmEmailRedirectUrl } from '../_lib/url';
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
    if (handleCorsPreflight(req, res)) {
      return;
    }

    requireMethod(req.method, ['POST']);
    const body = bodySchema.parse(parseRequestBody(req.body));
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
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

    sendJson(res, 200, {
      user: null,
      message:
        '確認メールを送信しました。メール内のリンクから認証を完了してください。'
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
