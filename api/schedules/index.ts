import { getAuthenticatedSupabase } from '../_lib/auth';
import {
  fromCompanyScheduleRow,
  toCompanyScheduleRow,
  upsertCompanyScheduleBodySchema
} from '../_lib/schedule';
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

    requireMethod(req.method, ['GET', 'PUT', 'DELETE']);
    const { supabase, user } = await getAuthenticatedSupabase(req, res);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('company_schedules')
        .select('*')
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        sendJson(res, 400, { error: '日程の読み込みに失敗しました。' });
        return;
      }

      sendJson(res, 200, {
        schedules: (data ?? []).map(fromCompanyScheduleRow)
      });
      return;
    }

    if (req.method === 'DELETE') {
      const id = getSingleQueryValue(req.query.id);

      if (!id) {
        sendJson(res, 400, { error: '日程IDが指定されていません。' });
        return;
      }

      const { error } = await supabase
        .from('company_schedules')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        sendJson(res, 400, { error: '日程の削除に失敗しました。' });
        return;
      }

      sendJson(res, 200, { ok: true });
      return;
    }

    const body = upsertCompanyScheduleBodySchema.parse(
      parseRequestBody(req.body)
    );
    const schedule = {
      ...body.schedule,
      categoryId: body.schedule.categoryId ?? null,
      title: body.schedule.title.trim() || body.schedule.type
    };
    const { data: ownedCompany, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', schedule.companyId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (companyError || !ownedCompany) {
      sendJson(res, 400, { error: '企業情報を確認してください。' });
      return;
    }

    if (schedule.categoryId) {
      const { data: ownedCategory, error: categoryError } = await supabase
        .from('schedule_categories')
        .select('id')
        .eq('id', schedule.categoryId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (categoryError || !ownedCategory) {
        sendJson(res, 400, { error: '色カテゴリを確認してください。' });
        return;
      }
    }

    const { data, error } = await supabase
      .from('company_schedules')
      .upsert(toCompanyScheduleRow(schedule, user.id), { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      sendJson(res, 400, { error: '日程の保存に失敗しました。' });
      return;
    }

    sendJson(res, 200, { schedule: fromCompanyScheduleRow(data) });
  } catch (error) {
    handleApiError(res, error);
  }
}
