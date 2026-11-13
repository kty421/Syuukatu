import { describe, expect, it } from 'vitest';

import { QuestionMemo } from '../types';
import { filterQuestionMemos, flattenQuestionMemos } from './questionMemoUtils';

const createMemo = (
  id: string,
  question: string,
  labelIds: string[]
): QuestionMemo => ({
  id,
  question,
  answer: '',
  companyId: null,
  labelIds,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z'
});

const entries = flattenQuestionMemos(
  [],
  [
    createMemo('a', 'ES 志望動機', ['label-a']),
    createMemo('b', '面接 自己PR', ['label-b']),
    createMemo('both', '面接 志望動機', ['label-a', 'label-b']),
    createMemo('other', '面接 ガクチカ', ['label-c']),
    createMemo('unlabeled', '面接 志望動機', [])
  ],
  []
);

const filteredIds = (query: string, labelIds: string[]) =>
  filterQuestionMemos(entries, query, labelIds).map(
    (entry) => entry.questionMemo.id
  );

describe('filterQuestionMemos', () => {
  it('includes all questions, including unlabeled questions, with no labels selected', () => {
    expect(filteredIds('', [])).toEqual([
      'a', 'b', 'both', 'other', 'unlabeled'
    ]);
  });

  it('filters by a single selected label', () => {
    expect(filteredIds('', ['label-a'])).toEqual(['a', 'both']);
  });

  it('matches any selected label without duplicating questions or changing their order', () => {
    expect(filteredIds('', ['label-b', 'label-a'])).toEqual([
      'a', 'b', 'both'
    ]);
  });

  it('returns no questions when none have a selected label', () => {
    expect(filteredIds('', ['missing-label'])).toEqual([]);
  });

  it('requires both the search query and any selected label to match', () => {
    expect(filteredIds('面接', ['label-a', 'label-b'])).toEqual([
      'b', 'both'
    ]);
  });

  it('keeps the search query effective when label filters are cleared', () => {
    expect(filteredIds('志望動機', ['label-a', 'label-b'])).toEqual([
      'a', 'both'
    ]);
    expect(filteredIds('志望動機', [])).toEqual(['a', 'both', 'unlabeled']);
  });

  it('trims and normalizes the search query with multiple labels selected', () => {
    expect(filteredIds(' es ', ['label-a', 'label-b'])).toEqual(['a']);
    expect(filteredIds('   ', ['label-a', 'label-b'])).toEqual([
      'a', 'b', 'both'
    ]);
  });
});
