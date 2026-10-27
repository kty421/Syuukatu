import { describe, expect, it } from 'vitest';
import { applyLabelOperation } from '../../../shared/types/bulkUpdate';
import { createBulkSelectionState, getBulkLabelAvailability, replaceSelectedRecords, toggleAllBulkSelection } from './bulkUpdateUtils';

describe('select all bulk targets', () => {
  it('selects every filtered target, including targets outside the viewport, and clears them on the next press', () => {
    const targets = Array.from({ length: 100 }, (_, index) => `company-${index}`);
    const selected = { ...createBulkSelectionState(), selectedIds: new Set(['company-1']) };
    const all = toggleAllBulkSelection(selected, targets);
    expect(all.selectedIds.size).toBe(100);
    expect(all.selectedIds.has('company-99')).toBe(true);
    expect(all.allChecked).toBe(true);
    const cleared = toggleAllBulkSelection(all, targets);
    expect(cleared.selectedIds.size).toBe(0);
    expect(cleared.allChecked).toBe(false);
    expect(selected.selectedIds.size).toBe(1);
    expect(selected.allChecked).toBe(false);
  });

  it('clears every target after selecting all and individually deselecting one', () => {
    const targets = ['a', 'b', 'c'];
    const all = toggleAllBulkSelection(createBulkSelectionState(), targets);
    const individualEdit = { ...all, selectedIds: new Set(['a', 'c']) };
    const cleared = toggleAllBulkSelection(individualEdit, targets);
    expect(cleared.selectedIds.size).toBe(0);
    expect(cleared.allChecked).toBe(false);
  });

  it('retains the next clear action even when all items are manually deselected', () => {
    const all = toggleAllBulkSelection(createBulkSelectionState(), ['a', 'b']);
    const individualEdit = { ...all, selectedIds: new Set<string>() };
    const cleared = toggleAllBulkSelection(individualEdit, ['a', 'b']);
    expect(cleared.selectedIds.size).toBe(0);
    expect(cleared.allChecked).toBe(false);
    expect([...toggleAllBulkSelection(cleared, ['a', 'b']).selectedIds]).toEqual(['a', 'b']);
  });

  it('keeps the next clear action when only failed items remain selected', () => {
    const all = toggleAllBulkSelection(createBulkSelectionState(), ['a', 'b']);
    const failedOnly = { ...all, selectedIds: new Set(['b']) };
    const cleared = toggleAllBulkSelection(failedOnly, ['a', 'b']);
    expect(cleared.selectedIds.size).toBe(0);
    expect(cleared.allChecked).toBe(false);
  });

  it('alternates atomically across rapid presses and resets both values together', () => {
    const initial = createBulkSelectionState();
    const final = [1, 2, 3, 4].reduce((state) => toggleAllBulkSelection(state, ['a', 'b']), initial);
    expect(final).toEqual(initial);
    const reset = createBulkSelectionState();
    expect(reset.allChecked).toBe(false);
    expect(reset.selectedIds.size).toBe(0);
    expect(reset.selectedIds).not.toBe(initial.selectedIds);
  });

  it('limits selection changes to the current filtered targets and handles zero targets', () => {
    const selected = { ...createBulkSelectionState(), selectedIds: new Set(['outside-filter']) };
    const all = toggleAllBulkSelection(selected, ['match']);
    expect([...all.selectedIds]).toEqual(['outside-filter', 'match']);
    expect([...toggleAllBulkSelection(all, ['match']).selectedIds]).toEqual(['outside-filter']);
    expect(toggleAllBulkSelection(selected, [])).toBe(selected);
    expect(toggleAllBulkSelection(all, [])).toBe(all);
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
