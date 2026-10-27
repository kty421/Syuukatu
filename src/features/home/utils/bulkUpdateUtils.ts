import { LabelOperation } from '../../../shared/types/bulkUpdate';

export type BulkSelectionState = {
  selectedIds: Set<string>;
  allChecked: boolean;
};

export const createBulkSelectionState = (): BulkSelectionState => ({
  selectedIds: new Set(),
  allChecked: false,
});

export const toggleAllBulkSelection = (
  state: BulkSelectionState,
  targetIds: readonly string[]
): BulkSelectionState => {
  if (targetIds.length === 0) return state;
  const next = new Set(state.selectedIds);
  // Individual edits do not change which operation the next press performs.
  for (const id of targetIds) {
    if (state.allChecked) next.delete(id);
    else next.add(id);
  }
  return { selectedIds: next, allChecked: !state.allChecked };
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
