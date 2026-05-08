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
import { getResetPasswordRedirectUrl } from '../_lib/url';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

const bodySchema = z.object({
  email: z.string().email()
});

const isUserLookupError = (message: string) => {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('user not found') ||
    normalized.includes('email not found') ||
    normalized.includes('not found')
  );
};

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
}
