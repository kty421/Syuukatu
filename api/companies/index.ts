import {
  fromCompanyRow,
  toCompanyRow,
  upsertCompanyBodySchema
} from '../_lib/company';
import { getAuthenticatedSupabase } from '../_lib/auth';
import {
  handleApiError,
  handleCorsPreflight,
  parseRequestBody,
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

    requireMethod(req.method, ['GET', 'POST', 'PUT']);
    const { supabase, user } = await getAuthenticatedSupabase(req, res);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        sendJson(res, 400, {
          error: '企業データの読み込みに失敗しました。'
        });
        return;
      }

      sendJson(res, 200, { companies: (data ?? []).map(fromCompanyRow) });
      return;
    }

    const body = upsertCompanyBodySchema.parse(parseRequestBody(req.body));
    const { data, error } = await supabase
      .from('companies')
      .upsert(toCompanyRow(body.company, user.id), { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      sendJson(res, 400, {
        error: '企業データの保存に失敗しました。'
      });
      return;
    }

    sendJson(res, 200, { company: fromCompanyRow(data) });
  } catch (error) {
    handleApiError(res, error);
  }
}
