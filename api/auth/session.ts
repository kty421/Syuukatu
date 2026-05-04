import { getAuthenticatedSupabase, toAuthUser } from '../_lib/auth';
import {
  handleApiError,
  handleCorsPreflight,
  requireMethod,
  sendJson
} from '../_lib/http';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (handleCorsPreflight(req, res)) {
      return;
    }

    requireMethod(req.method, ['GET']);
    const { user } = await getAuthenticatedSupabase(req, res);
    sendJson(res, 200, { user: toAuthUser(user) });
  } catch (error) {
    handleApiError(res, error);
  }
}
