import {
  fromScheduleCategoryRow,
  ScheduleCategoryRow,
  toScheduleCategoryRow,
  upsertScheduleCategoryBodySchema
} from '../_lib/schedule';
import { getAuthenticatedSupabase } from '../_lib/auth';
import {
  handleApiError,
  handleCorsPreflight,
  parseRequestBody,
  requireMethod,
  sendJson
} from '../_lib/http';
import type { VercelRequest, VercelResponse } from '../_lib/vercel';

const getSingleQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (handleCorsPreflight(req, res)) {
      return;
    }

    requireMethod(req.method, ['PUT', 'DELETE']);
    const { supabase, user } = await getAuthenticatedSupabase(req, res);

    if (req.method === 'DELETE') {
      const id = getSingleQueryValue(req.query.id);

      if (!id) {
        sendJson(res, 400, { error: '色カテゴリIDが指定されていません。' });
        return;
      }

      const { error: scheduleError } = await supabase
        .from('company_schedules')
        .update({ category_id: null })
        .eq('category_id', id)
        .eq('user_id', user.id);

      if (scheduleError) {
        sendJson(res, 400, {
          error: '予定の色カテゴリ更新に失敗しました。'
        });
        return;
      }

      const { error } = await supabase
        .from('schedule_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        sendJson(res, 400, {
          error: '色カテゴリの削除に失敗しました。'
        });
        return;
      }

      sendJson(res, 200, { ok: true });
      return;
    }

    const body = upsertScheduleCategoryBodySchema.parse(
      parseRequestBody(req.body)
    );
    const category = {
      ...body.category,
      name: body.category.name.trim()
    };

    if (!category.name) {
      sendJson(res, 400, { error: 'カテゴリ名を入力してください。' });
      return;
    }

    const { data, error } = await supabase
      .from('schedule_categories')
      .upsert(toScheduleCategoryRow(category, user.id), { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      sendJson(res, 400, {
        error: '色カテゴリの保存に失敗しました。'
      });
      return;
    }

    sendJson(res, 200, {
      category: fromScheduleCategoryRow(data as ScheduleCategoryRow)
    });
  } catch (error) {
    handleApiError(res, error);
  }
}
