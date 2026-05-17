import { clearSessionCookies, getAuthenticatedSupabase } from '../_lib/auth';
import {
  handleApiError,
  handleCorsPreflight,
  requireMethod,
  sendJson
} from '../_lib/http';
import { createSupabaseAdminClient } from '../_lib/supabase';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (handleCorsPreflight(req, res)) {
      return;
    }

    requireMethod(req.method, ['DELETE']);
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
  } catch (error) {
    handleApiError(res, error);
  }
}
