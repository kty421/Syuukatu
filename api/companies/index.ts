import {
  fromCompanyRow,
  toCompanyRow,
  upsertCompanyBodySchema
} from '../_lib/company';
import {
  fromCompanyScheduleRow,
  fromScheduleCategoryRow,
  ScheduleCategoryRow,
  toCompanyScheduleRow,
  toScheduleCategoryRow,
  upsertScheduleCategoryBodySchema,
  upsertCompanyScheduleBodySchema
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

const getCompanyId = (value: string | string[] | undefined) =>
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

    if (req.method === 'DELETE') {
      const categoryId = getCompanyId(req.query.categoryId);

      if (categoryId) {
        const { error: scheduleError } = await supabase
          .from('company_schedules')
          .update({ category_id: null })
          .eq('category_id', categoryId)
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
          .eq('id', categoryId)
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

      const scheduleId = getCompanyId(req.query.scheduleId);

      if (scheduleId) {
        const { error } = await supabase
          .from('company_schedules')
          .delete()
          .eq('id', scheduleId)
          .eq('user_id', user.id);

        if (error) {
          sendJson(res, 400, {
            error: '日程の削除に失敗しました。'
          });
          return;
        }

        sendJson(res, 200, { ok: true });
        return;
      }

      const id = getCompanyId(req.query.id);

      if (!id) {
        sendJson(res, 400, { error: '企業IDが指定されていません。' });
        return;
      }

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        sendJson(res, 400, {
          error: '企業データの削除に失敗しました。'
        });
        return;
      }

      sendJson(res, 200, { ok: true });
      return;
    }

    const rawBody = parseRequestBody(req.body);
    const scheduleBody = upsertCompanyScheduleBodySchema.safeParse(rawBody);

    if (scheduleBody.success) {
      const schedule = {
        ...scheduleBody.data.schedule,
        categoryId: scheduleBody.data.schedule.categoryId ?? null,
        title:
          scheduleBody.data.schedule.title.trim() ||
          scheduleBody.data.schedule.type
      };
      const { data: ownedCompany, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('id', schedule.companyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (companyError || !ownedCompany) {
        sendJson(res, 400, {
          error: '企業情報を確認してください。'
        });
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
          sendJson(res, 400, {
            error: '色カテゴリを確認してください。'
          });
          return;
        }
      }

      const { data, error } = await supabase
        .from('company_schedules')
        .upsert(toCompanyScheduleRow(schedule, user.id), { onConflict: 'id' })
        .select('*')
        .single();

      if (error) {
        sendJson(res, 400, {
          error: '日程の保存に失敗しました。'
        });
        return;
      }

      sendJson(res, 200, { schedule: fromCompanyScheduleRow(data) });
      return;
    }

    const categoryBody = upsertScheduleCategoryBodySchema.safeParse(rawBody);

    if (categoryBody.success) {
      const category = {
        ...categoryBody.data.category,
        name: categoryBody.data.category.name.trim()
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
      return;
    }

    const body = upsertCompanyBodySchema.parse(rawBody);
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
