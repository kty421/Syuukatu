import { getAuthenticatedSupabase } from '../_lib/auth';
import {
  handleApiError,
  handleCorsPreflight,
  requireMethod,
  sendJson
} from '../_lib/http';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

const getQuestionMemoId = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (handleCorsPreflight(req, res)) {
      return;
    }

    requireMethod(req.method, ['DELETE']);
    const id = getQuestionMemoId(req.query.id);

    if (!id) {
      sendJson(res, 400, { error: '質問メモIDが指定されていません。' });
      return;
    }

    const { supabase, user } = await getAuthenticatedSupabase(req, res);
    const { error } = await supabase
      .from('question_memos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      sendJson(res, 400, {
        error: '質問メモの削除に失敗しました。'
      });
      return;
    }

    sendJson(res, 200, { ok: true });
  } catch (error) {
    handleApiError(res, error);
  }
}
