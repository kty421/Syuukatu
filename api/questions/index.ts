import { getAuthenticatedSupabase } from '../_lib/auth';
import {
  fromQuestionLabelRow,
  fromQuestionMemoRow,
  QuestionLabelRow,
  QuestionMemoRow,
  toQuestionMemoRow,
  uniqueLabelIds,
  upsertQuestionMemoBodySchema
} from '../_lib/question';
import {
  handleApiError,
  handleCorsPreflight,
  parseRequestBody,
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

    requireMethod(req.method, ['GET', 'POST', 'PUT', 'DELETE']);
    const { supabase, user } = await getAuthenticatedSupabase(req, res);

    if (req.method === 'GET') {
      const [memoResult, labelResult] = await Promise.all([
        supabase
          .from('question_memos')
          .select('*, question_memo_labels(label_id)')
          .order('updated_at', { ascending: false }),
        supabase
          .from('question_labels')
          .select('*')
          .order('created_at', { ascending: true })
      ]);

      if (memoResult.error || labelResult.error) {
        sendJson(res, 400, {
          error: '質問メモの読み込みに失敗しました。'
        });
        return;
      }

      sendJson(res, 200, {
        questionMemos: ((memoResult.data ?? []) as QuestionMemoRow[]).map(
          fromQuestionMemoRow
        ),
        questionLabels: ((labelResult.data ?? []) as QuestionLabelRow[]).map(
          fromQuestionLabelRow
        )
      });
      return;
    }

    if (req.method === 'DELETE') {
      const id = getQuestionMemoId(req.query.id);

      if (!id) {
        sendJson(res, 400, { error: '質問メモIDが指定されていません。' });
        return;
      }

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
      return;
    }

    const body = upsertQuestionMemoBodySchema.parse(
      parseRequestBody(req.body)
    );
    const questionMemo = {
      ...body.questionMemo,
      question: body.questionMemo.question.trim(),
      answer: body.questionMemo.answer.trim(),
      labelIds: uniqueLabelIds(body.questionMemo.labelIds)
    };

    if (!questionMemo.question) {
      sendJson(res, 400, { error: '質問タイトルを入力してください。' });
      return;
    }

    if (questionMemo.companyId) {
      const { data: ownedCompany, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('id', questionMemo.companyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (companyError || !ownedCompany) {
        sendJson(res, 400, {
          error: '企業情報を確認してください。'
        });
        return;
      }
    }

    if (questionMemo.labelIds.length > 0) {
      const { data: ownedLabels, error: labelError } = await supabase
        .from('question_labels')
        .select('id')
        .in('id', questionMemo.labelIds)
        .eq('user_id', user.id);

      if (
        labelError ||
        (ownedLabels ?? []).length !== questionMemo.labelIds.length
      ) {
        sendJson(res, 400, {
          error: 'ラベル情報を確認してください。'
        });
        return;
      }
    }

    const { data, error } = await supabase
      .from('question_memos')
      .upsert(toQuestionMemoRow(questionMemo, user.id), { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      sendJson(res, 400, {
        error: '質問メモの保存に失敗しました。'
      });
      return;
    }

    const { error: deleteLabelsError } = await supabase
      .from('question_memo_labels')
      .delete()
      .eq('question_memo_id', questionMemo.id);

    if (deleteLabelsError) {
      sendJson(res, 400, {
        error: '質問メモのラベル更新に失敗しました。'
      });
      return;
    }

    if (questionMemo.labelIds.length > 0) {
      const { error: insertLabelsError } = await supabase
        .from('question_memo_labels')
        .insert(
          questionMemo.labelIds.map((labelId) => ({
            question_memo_id: questionMemo.id,
            label_id: labelId
          }))
        );

      if (insertLabelsError) {
        sendJson(res, 400, {
          error: '質問メモのラベル更新に失敗しました。'
        });
        return;
      }
    }

    sendJson(res, 200, {
      questionMemo: fromQuestionMemoRow({
        ...(data as QuestionMemoRow),
        question_memo_labels: questionMemo.labelIds.map((labelId) => ({
          label_id: labelId
        }))
      })
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
