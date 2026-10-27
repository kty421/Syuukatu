import { LabelOperation } from '../../../shared/types/bulkUpdate';

export type BulkSelectionState = 'none' | 'partial' | 'all';

export const getBulkSelectionState = (
  selectedIds: ReadonlySet<string>,
  targetIds: readonly string[]
): BulkSelectionState => {
  const count = targetIds.filter((id) => selectedIds.has(id)).length;
  return count === 0 ? 'none' : count === targetIds.length ? 'all' : 'partial';
};

export const toggleAllBulkSelection = (
  selectedIds: ReadonlySet<string>,
  targetIds: readonly string[]
): Set<string> => {
  const next = new Set(selectedIds);
  const clear = getBulkSelectionState(selectedIds, targetIds) === 'all';
  for (const id of targetIds) {
    if (clear) next.delete(id);
    else next.add(id);
  }
  return next;
};

export const getBulkLabelAvailability = (
  memos: ReadonlyArray<{ labelIds: readonly string[] }>,
  labelId: string,
  operation: LabelOperation
) => {
  const count = memos.filter((memo) => memo.labelIds.includes(labelId)).length;
  const disabled = memos.length === 0 || (operation === 'add' ? count === memos.length : count === 0);
  const reason = memos.length === 0 ? '対象の質問がありません'
    : operation === 'add' ? '全件に付与済み' : '付与されていません';
  return { count, disabled, reason: disabled ? reason : null };
};

// Only reconcile the operation's targets; unrelated edits stay in local state.
// A target missing from the server response has been removed remotely.
export const replaceSelectedRecords = <T extends { id: string }>(
  current: T[],
  incoming: T[],
  ids: Iterable<string>
): T[] => {
  const selected = new Set(ids);
  const replacements = incoming.filter((item) => selected.has(item.id));
  return [...current.filter((item) => !selected.has(item.id)), ...replacements];
};
