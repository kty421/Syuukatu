import { z } from 'zod';

import {
  getAuthErrorStatus,
  normalizeAuthErrorMessage
} from '../_lib/authErrors';
import { handleApiError, parseRequestBody, requireMethod, sendJson } from '../_lib/http';
import { createSupabaseServerClient } from '../_lib/supabase';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

const bodySchema = z.object({
  email: z.string().email()
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    requireMethod(req.method, ['POST']);
    const body = bodySchema.parse(parseRequestBody(req.body));
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(body.email);

    if (error) {
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
