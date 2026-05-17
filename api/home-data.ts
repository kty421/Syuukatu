import { getAuthenticatedSupabase } from './_lib/auth';
import { fromCompanyRow } from './_lib/company';
import {
  handleApiError,
  handleCorsPreflight,
  requireMethod,
  sendJson
} from './_lib/http';
import {
  fromQuestionLabelRow,
  fromQuestionMemoRow,
  QuestionLabelRow,
  QuestionMemoRow
} from './_lib/question';
import type { VercelRequest, VercelResponse } from './_lib/vercel';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (handleCorsPreflight(req, res)) {
      return;
    }

    requireMethod(req.method, ['GET']);
    const { supabase } = await getAuthenticatedSupabase(req, res);
    const [companyResult, memoResult, labelResult] = await Promise.all([
      supabase
        .from('companies')
        .select('*')
        .order('updated_at', { ascending: false }),
      supabase
        .from('question_memos')
        .select('*, question_memo_labels(label_id)')
        .order('updated_at', { ascending: false }),
      supabase
        .from('question_labels')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
    ]);

    if (companyResult.error || memoResult.error || labelResult.error) {
      sendJson(res, 400, {
        error: '保存データの読み込みに失敗しました。'
      });
      return;
    }

    sendJson(res, 200, {
      companies: (companyResult.data ?? []).map(fromCompanyRow),
      questionMemos: ((memoResult.data ?? []) as QuestionMemoRow[]).map(
        fromQuestionMemoRow
      ),
      questionLabels: ((labelResult.data ?? []) as QuestionLabelRow[]).map(
        fromQuestionLabelRow
      )
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
