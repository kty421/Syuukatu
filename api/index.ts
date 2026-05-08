import {
  handleApiError,
  handleCorsPreflight,
  requireMethod,
  sendJson
} from './_lib/http';
import type { VercelRequest, VercelResponse } from './_lib/vercel';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (handleCorsPreflight(req, res)) {
      return;
    }

    requireMethod(req.method, ['GET']);

    sendJson(res, 200, {
      ok: true,
      service: 'syuukatu-api',
      endpoints: [
        '/api/health',
        '/api/auth/session',
        '/api/auth/sign-in',
        '/api/auth/sign-up',
        '/api/auth/reset-password',
        '/api/auth/resend-confirmation',
        '/api/companies',
        '/api/questions',
        '/api/question-labels'
      ]
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
