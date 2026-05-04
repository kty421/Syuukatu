import { clearSessionCookies, getRequestTokens } from '../_lib/auth';
import { handleApiError, requireMethod, sendJson } from '../_lib/http';
import { createSupabaseServerClient } from '../_lib/supabase';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    requireMethod(req.method, ['POST']);
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
