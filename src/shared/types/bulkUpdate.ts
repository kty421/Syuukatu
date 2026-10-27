export type LabelOperation = 'add' | 'remove';

export type BulkUpdateResult<T> = {
  items: T[];
  updatedIds: string[];
  unchangedIds: string[];
  failedIds: string[];
};

export const applyLabelOperation = (
  currentIds: readonly string[],
  labelIds: readonly string[],
  operation: LabelOperation
): string[] => {
  const current = new Set(currentIds);
  for (const id of labelIds) {
    if (operation === 'add') {
      current.add(id);
    } else {
      current.delete(id);
    }
  }
  return [...current];
};
