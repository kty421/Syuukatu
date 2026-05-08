import { getAuthenticatedSupabase } from '../_lib/auth';
import {
  fromQuestionLabelRow,
  QuestionLabelRow,
  toQuestionLabelRow,
  upsertQuestionLabelBodySchema
} from '../_lib/question';
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

    requireMethod(req.method, ['POST']);
    const { supabase, user } = await getAuthenticatedSupabase(req, res);
    const body = upsertQuestionLabelBodySchema.parse(
      parseRequestBody(req.body)
    );
    const now = new Date().toISOString();
    const label = {
      ...body.label,
      name: body.label.name.trim(),
      createdAt: body.label.createdAt ?? now,
      updatedAt: body.label.updatedAt ?? now
    };

    if (!label.name) {
      sendJson(res, 400, { error: 'ラベル名を入力してください。' });
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from('question_labels')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', label.name)
      .maybeSingle();

    if (existingError) {
      sendJson(res, 400, {
        error: 'ラベルの確認に失敗しました。'
      });
      return;
    }

    if (existing) {
      sendJson(res, 200, {
        label: fromQuestionLabelRow(existing as QuestionLabelRow)
      });
      return;
    }

    const { data, error } = await supabase
      .from('question_labels')
      .insert(toQuestionLabelRow(label, user.id))
      .select('*')
      .single();

    if (error) {
      sendJson(res, 400, {
        error: 'ラベルの作成に失敗しました。'
      });
      return;
    }

    sendJson(res, 200, {
      label: fromQuestionLabelRow(data as QuestionLabelRow)
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
