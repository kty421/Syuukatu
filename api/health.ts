import { handleApiError, requireMethod, sendJson } from './_lib/http';
import { getSupabaseServerConfigStatus } from './_lib/supabase';
import type { VercelRequest, VercelResponse } from './_lib/vercel';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireMethod(req.method, ['GET']);

    const supabaseConfig = getSupabaseServerConfigStatus();

    sendJson(res, 200, {
      ok: true,
      service: 'syuukatu-api',
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      ...supabaseConfig
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
