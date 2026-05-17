import {
  clearSessionCookies,
  getAuthenticatedSupabase,
  getRequestTokens
} from '../_lib/auth';
import {
  handleApiError,
  handleCorsPreflight,
  requireMethod,
  sendJson
} from '../_lib/http';
import {
  createSupabaseAdminClient,
  createSupabaseServerClient
} from '../_lib/supabase';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (handleCorsPreflight(req, res)) {
      return;
    }

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
}
