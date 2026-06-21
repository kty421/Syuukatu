import { describe, expect, it } from 'vitest';

import { QuestionMemo } from '../../domain/entities/question';
import {
  filterQuestionMemos,
  sortQuestionLabels,
  sortQuestionMemos,
  uniqueLabelIds
} from './filterAndSortQuestions';

const memo = (
  id: string,
  updatedAt: string,
  labelIds: string[] = []
): QuestionMemo => ({
  answer: `${id} answer`,
  companyId: null,
  createdAt: updatedAt,
  id,
  labelIds,
  question: `${id} question`,
  updatedAt
});

describe('question usecases', () => {
  it('deduplicates and trims label ids', () => {
    expect(uniqueLabelIds([' a ', 'a', '', 'b'])).toEqual(['a', 'b']);
  });

  it('filters memos by label and query', () => {
    const memos = [memo('summer', '2026-06-01', ['label-1']), memo('winter', '2026-06-02')];

    expect(filterQuestionMemos(memos, 'summer', 'label-1').map((item) => item.id)).toEqual(['summer']);
  });

  it('sorts memos by update order', () => {
    const memos = [memo('old', '2026-06-01'), memo('new', '2026-06-02')];

    expect(sortQuestionMemos(memos, 'newest').map((item) => item.id)).toEqual(['new', 'old']);
    expect(sortQuestionMemos(memos, 'oldest').map((item) => item.id)).toEqual(['old', 'new']);
  });

  it('sorts labels by sortOrder then createdAt', () => {
    const labels = [
      { id: 'b', name: 'B', sortOrder: 1, createdAt: '2026-06-02', updatedAt: '2026-06-02' },
      { id: 'a', name: 'A', sortOrder: 0, createdAt: '2026-06-01', updatedAt: '2026-06-01' }
    ];

    expect(sortQuestionLabels(labels).map((label) => label.id)).toEqual(['a', 'b']);
  });
});
