import { handleApiError, requireMethod, sendJson } from './_lib/http';
import type { VercelRequest, VercelResponse } from './_lib/vercel';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireMethod(req.method, ['GET']);

    sendJson(res, 200, {
      ok: true,
      service: 'syuukatu-api',
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      hasSupabaseUrl: Boolean(
        process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
      ),
      hasSupabaseAnonKey: Boolean(
        process.env.SUPABASE_ANON_KEY ||
          process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      )
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
