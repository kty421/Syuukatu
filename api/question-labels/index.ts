import { getAuthenticatedSupabase } from '../_lib/auth';
import {
  fromQuestionLabelRow,
  QuestionLabelRow,
  reorderQuestionLabelsBodySchema,
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

    requireMethod(req.method, ['POST', 'PUT', 'DELETE']);
    const { supabase, user } = await getAuthenticatedSupabase(req, res);

    if (req.method === 'DELETE') {
      const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;

      if (!id) {
        sendJson(res, 400, { error: 'ラベルIDが指定されていません。' });
        return;
      }

      const { error } = await supabase
        .from('question_labels')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        sendJson(res, 400, { error: 'ラベルの削除に失敗しました。' });
        return;
      }

      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'PUT') {
      const body = reorderQuestionLabelsBodySchema.parse(
        parseRequestBody(req.body)
      );
      const now = new Date().toISOString();

      if (body.labels.length === 0) {
        sendJson(res, 200, { labels: [] });
        return;
      }

      const { data: ownedLabels, error: ownedError } = await supabase
        .from('question_labels')
        .select('id')
        .in(
          'id',
          body.labels.map((label) => label.id)
        )
        .eq('user_id', user.id);

      if (ownedError || (ownedLabels ?? []).length !== body.labels.length) {
        sendJson(res, 400, { error: 'ラベル情報を確認してください。' });
        return;
      }

      const updates = await Promise.all(
        body.labels.map((label) =>
          supabase
            .from('question_labels')
            .update({
              sort_order: label.sortOrder,
              updated_at: now
            })
            .eq('id', label.id)
            .eq('user_id', user.id)
        )
      );
      const updateError = updates.find((result) => result.error)?.error;

      if (updateError) {
        sendJson(res, 400, { error: 'ラベルの並び替えに失敗しました。' });
        return;
      }

      const { data, error } = await supabase
        .from('question_labels')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        sendJson(res, 400, { error: 'ラベルの読み込みに失敗しました。' });
        return;
      }

      sendJson(res, 200, {
        labels: ((data ?? []) as QuestionLabelRow[]).map(fromQuestionLabelRow)
      });
      return;
    }

    const body = upsertQuestionLabelBodySchema.parse(
      parseRequestBody(req.body)
    );
    const now = new Date().toISOString();
    const label = {
      ...body.label,
      name: body.label.name.trim(),
      sortOrder: body.label.sortOrder,
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
