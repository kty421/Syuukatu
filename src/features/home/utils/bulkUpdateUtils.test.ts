import { describe, expect, it } from 'vitest';
import { applyLabelOperation } from '../../../shared/types/bulkUpdate';
import { getBulkLabelAvailability, getBulkSelectionState, replaceSelectedRecords, toggleAllBulkSelection } from './bulkUpdateUtils';

describe('select all bulk targets', () => {
  it('selects every filtered target, including targets outside the viewport, and clears them on the next press', () => {
    const targets = Array.from({ length: 100 }, (_, index) => `company-${index}`);
    const selected = new Set(['company-1']);
    expect(getBulkSelectionState(selected, targets)).toBe('partial');
    const all = toggleAllBulkSelection(selected, targets);
    expect(all.size).toBe(100);
    expect(all.has('company-99')).toBe(true);
    expect(getBulkSelectionState(all, targets)).toBe('all');
    expect(toggleAllBulkSelection(all, targets).size).toBe(0);
    expect(selected.size).toBe(1);
  });

  it('limits selection changes to the current filtered targets and handles zero targets', () => {
    const selected = new Set(['outside-filter']);
    expect(getBulkSelectionState(selected, ['match'])).toBe('none');
    const all = toggleAllBulkSelection(selected, ['match']);
    expect([...all]).toEqual(['outside-filter', 'match']);
    expect([...toggleAllBulkSelection(all, ['match'])]).toEqual(['outside-filter']);
    expect(getBulkSelectionState(selected, [])).toBe('none');
    expect([...toggleAllBulkSelection(selected, [])]).toEqual(['outside-filter']);
  });
});

describe('bulk label row availability', () => {
  const memos = [{ labelIds: ['all', 'mixed'] }, { labelIds: ['all'] }];

  it.each([
    ['all', 'add', true, 2, '全件に付与済み'],
    ['all', 'remove', false, 2, null],
    ['mixed', 'add', false, 1, null],
    ['mixed', 'remove', false, 1, null],
    ['absent', 'add', false, 0, null],
    ['absent', 'remove', true, 0, '付与されていません'],
  ] as const)('%s in %s mode has the correct disabled state and reason', (id, operation, disabled, count, reason) => {
    expect(getBulkLabelAvailability(memos, id, operation)).toEqual({ count, disabled, reason });
  });

  it.each(['add', 'remove'] as const)('disables every row without target questions in %s mode', (operation) => {
    expect(getBulkLabelAvailability([], 'all', operation)).toEqual({ count: 0, disabled: true, reason: '対象の質問がありません' });
  });
});

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
