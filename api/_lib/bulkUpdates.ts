import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { selectionStatuses } from '../../src/features/home/types';
import { isCompanyStatusAllowed } from '../../src/shared/companyStatusPolicy';
import { BulkUpdateResult } from '../../src/shared/types/bulkUpdate';
import { fromCompanyRow } from './company';
import { HttpError } from './http';
import { fromQuestionMemoRow, QuestionMemoRow } from './question';

const idsSchema = z.array(z.string().trim().min(1)).min(1)
  .transform((ids) => [...new Set(ids)]);

export const bulkCompanyStatusBodySchema = z.object({
  companyIds: idsSchema,
  status: z.enum(selectionStatuses)
});

export const bulkQuestionLabelsBodySchema = z.object({
  questionMemoIds: idsSchema,
  labelIds: idsSchema,
  operation: z.enum(['add', 'remove'])
});

// Bound concurrent database requests even when a large list is selected.
const updateSelectedItems = async <T extends { id: string }>(
  ids: string[],
  items: T[],
  unchanged: (item: T) => boolean,
  save: (item: T) => Promise<T>
): Promise<BulkUpdateResult<T>> => {
  const byId = new Map(items.map((item) => [item.id, item]));
  const outcomes = new Map<string, { item?: T; unchanged?: boolean }>();
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(4, ids.length) }, async () => {
    while (nextIndex < ids.length) {
      const id = ids[nextIndex++];
      const item = byId.get(id);
      if (!item) continue;
      if (unchanged(item)) {
        outcomes.set(id, { item, unchanged: true });
        continue;
      }
      try {
        outcomes.set(id, { item: await save(item) });
      } catch {
        // Other selected records can still succeed. The client reloads failures.
      }
    }
  }));
  return {
    items: ids.flatMap((id) => outcomes.get(id)?.item ?? []),
    updatedIds: ids.filter((id) => outcomes.has(id) && !outcomes.get(id)?.unchanged),
    unchangedIds: ids.filter((id) => outcomes.get(id)?.unchanged),
    failedIds: ids.filter((id) => !outcomes.has(id))
  };
};

export const updateCompanyStatuses = async (
  supabase: SupabaseClient,
  userId: string,
  body: z.infer<typeof bulkCompanyStatusBodySchema>
) => {
  const { data, error } = await supabase.from('companies').select('*')
    .eq('user_id', userId).in('id', body.companyIds);
  if (error) throw new HttpError(400, '企業情報を確認できませんでした。');
  const companies = (data ?? []).map(fromCompanyRow)
    .filter((company) => isCompanyStatusAllowed({ type: company.type, status: body.status }));
  return updateSelectedItems(body.companyIds, companies,
    (company) => company.status === body.status,
    async (company) => {
      const { data: saved, error: saveError } = await supabase.from('companies')
        .update({ status: body.status, updated_at: new Date().toISOString() })
        .eq('id', company.id).eq('user_id', userId).select('*').single();
      if (saveError || !saved) throw new Error('Company status update failed.');
      return fromCompanyRow(saved);
    });
};

export const updateQuestionLabels = async (
  supabase: SupabaseClient,
  userId: string,
  body: z.infer<typeof bulkQuestionLabelsBodySchema>
) => {
  // Validate every label before making any changes, including remove requests.
  const { data: labels, error: labelError } = await supabase.from('question_labels')
    .select('id').eq('user_id', userId).in('id', body.labelIds);
  if (labelError || labels?.length !== body.labelIds.length) {
    throw new HttpError(400, 'ラベル情報を確認してください。');
  }
  const { data, error } = await supabase.from('question_memos')
    .select('*, question_memo_labels(label_id)')
    .eq('user_id', userId).in('id', body.questionMemoIds);
  if (error) throw new HttpError(400, '質問メモを確認できませんでした。');
  const memos = ((data ?? []) as QuestionMemoRow[]).map(fromQuestionMemoRow);
  const changedLabelIds = (currentIds: string[]) => body.labelIds.filter((id) =>
    body.operation === 'add' ? !currentIds.includes(id) : currentIds.includes(id));

  return updateSelectedItems(body.questionMemoIds, memos,
    (memo) => changedLabelIds(memo.labelIds).length === 0,
    async (memo) => {
      const changes = changedLabelIds(memo.labelIds);
      const { error: relationError } = body.operation === 'add'
        ? await supabase.from('question_memo_labels').upsert(
          changes.map((labelId) => ({ question_memo_id: memo.id, label_id: labelId })),
          { onConflict: 'question_memo_id,label_id', ignoreDuplicates: true }
        )
        : await supabase.from('question_memo_labels').delete()
          .eq('question_memo_id', memo.id).in('label_id', changes);
      if (relationError) throw new Error('Question label update failed.');

      const { error: timestampError } = await supabase.from('question_memos')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', memo.id).eq('user_id', userId);
      if (timestampError) throw new Error('Question timestamp update failed.');
      const { data: saved, error: readError } = await supabase.from('question_memos')
        .select('*, question_memo_labels(label_id)')
        .eq('id', memo.id).eq('user_id', userId).single();
      if (readError || !saved) throw new Error('Question reload failed.');
      return fromQuestionMemoRow(saved as QuestionMemoRow);
    });
};
