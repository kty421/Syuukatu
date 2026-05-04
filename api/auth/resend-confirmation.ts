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
import { getWebAuthCallbackUrl } from '../_lib/url';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

const bodySchema = z.object({
  email: z.string().email()
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
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: body.email,
      options: {
        emailRedirectTo: getWebAuthCallbackUrl(req)
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
}
