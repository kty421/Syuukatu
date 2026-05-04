import { handleApiError, requireMethod, sendJson } from './_lib/http';
import type { VercelRequest, VercelResponse } from './_lib/vercel';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireMethod(req.method, ['GET']);

    sendJson(res, 200, {
      ok: true,
      service: 'syuukatu-api',
      endpoints: [
        '/api/health',
        '/api/auth/session',
        '/api/auth/sign-in',
        '/api/auth/sign-up',
        '/api/companies'
      ]
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
