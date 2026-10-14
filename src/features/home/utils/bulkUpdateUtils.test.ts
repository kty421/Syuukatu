import { describe, expect, it } from 'vitest';
import { applyLabelOperation } from '../../../shared/types/bulkUpdate';
import { replaceSelectedRecords } from './bulkUpdateUtils';

describe('bulk label selection and reconciliation', () => {
  it('preserves different existing labels while adding and removing multiple labels', () => {
    const memos = [['a', 'keep'], ['b', 'keep'], ['a', 'b'], []];
    expect(memos.map((ids) => applyLabelOperation(ids, ['a', 'b', 'a'], 'add')))
      .toEqual([['a', 'keep', 'b'], ['b', 'keep', 'a'], ['a', 'b'], ['a', 'b']]);
    expect(memos.map((ids) => applyLabelOperation(ids, ['a', 'b'], 'remove')))
      .toEqual([['keep'], ['keep'], [], []]);
    expect(memos).toEqual([['a', 'keep'], ['b', 'keep'], ['a', 'b'], []]);
  });

  it('reconciles persisted selections and remote deletions without overwriting unrelated local edits', () => {
    const unselected = { id: 'other', value: 'new unsaved edit' };
    const current = [{ id: 'changed', value: 'old' }, { id: 'deleted', value: 'old' }, unselected];
    const remote = [{ id: 'changed', value: 'persisted' }, { id: 'other', value: 'stale remote' }];
    const result = replaceSelectedRecords(current, remote, ['changed', 'deleted']);
    expect(result).toEqual([unselected, remote[0]]);
    expect(result[0]).toBe(unselected);
  });
});
