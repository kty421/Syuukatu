import {
  clearAuthPkceCookie,
  getAuthPkceVerifier,
  setSessionCookies
} from '../_lib/auth';
import { createPkceStorage } from '../_lib/pkce';
import { createSupabaseServerClient } from '../_lib/supabase';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

const getQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const redirectHome = (res: VercelResponse, status: 'confirmed' | 'error') => {
  res.redirect(302, `/?auth=${status}`);
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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
}
