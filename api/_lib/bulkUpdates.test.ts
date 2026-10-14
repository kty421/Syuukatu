import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import {
  bulkCompanyStatusBodySchema,
  bulkQuestionLabelsBodySchema,
  updateCompanyStatuses,
  updateQuestionLabels
} from './bulkUpdates';
import { applyCorsHeaders } from './http';
import type { VercelResponse } from './vercel';

type Row = Record<string, unknown>;
type QueryResult = { data: Row | Row[] | null; error: { message: string } | null };
type Write = { table: string; operation: string; filters: Map<string, unknown[]>; payload: Row | Row[] };

// A small database fake exercises the actual relation writes and ownership filters.
class Database {
  tables: Record<string, Row[]>;
  writes: Write[] = [];
  failWrites = new Set<string>();

  constructor() {
    const metadata = { created_at: '2026-06-01T00:00:00.000Z', updated_at: '2026-06-01T00:00:00.000Z' };
    this.tables = {
      companies: ['c1', 'c2', 'foreign'].map((id) => ({
        ...metadata, id, user_id: id === 'foreign' ? 'other' : 'owner',
        type: 'internship', company_name: id, status: id === 'c2' ? 'ES通過' : '未エントリー',
        login_id: 'preserve-id', tags: ['keep'], memo: 'preserve memo', favorite: true
      })),
      question_memos: ['q1', 'q2', 'q3', 'q4', 'foreign'].map((id) => ({
        ...metadata, id, user_id: id === 'foreign' ? 'other' : 'owner', company_id: null,
        question: `  ${id} question  `, answer: '\nkeep formatting\n'
      })),
      question_labels: ['a', 'b', 'keep', 'foreign'].map((id) => ({
        id, user_id: id === 'foreign' ? 'other' : 'owner'
      })),
      question_memo_labels: [
        ['q1', 'a'], ['q1', 'keep'], ['q2', 'b'], ['q2', 'keep'],
        ['q3', 'a'], ['q3', 'b'], ['q3', 'keep'], ['foreign', 'foreign']
      ].map(([question_memo_id, label_id]) => ({ question_memo_id, label_id }))
    };
  }

  from(table: string) { return new Query(this, table); }
  get client() { return this as unknown as SupabaseClient; }
  labels(id: string) {
    return this.tables.question_memo_labels.filter((row) => row.question_memo_id === id)
      .map((row) => row.label_id).sort();
  }
}

class Query implements PromiseLike<QueryResult> {
  private operation = 'select';
  private filters = new Map<string, unknown[]>();
  private payload: Row | Row[] = {};
  private projection = '*';
  private ignoreDuplicates = false;
  private singleRow = false;

  constructor(private db: Database, private table: string) {}
  select(projection = '*') { this.projection = projection; return this; }
  eq(key: string, value: unknown) { this.filters.set(key, [value]); return this; }
  in(key: string, values: unknown[]) { this.filters.set(key, values); return this; }
  update(payload: Row) { this.operation = 'update'; this.payload = payload; return this; }
  delete() { this.operation = 'delete'; return this; }
  upsert(payload: Row[], options: { ignoreDuplicates?: boolean }) {
    this.operation = 'upsert'; this.payload = payload;
    this.ignoreDuplicates = options.ignoreDuplicates ?? false;
    return this;
  }
  single() { this.singleRow = true; return this; }

  private run(): QueryResult {
    const rows = this.db.tables[this.table];
    const matches = (row: Row) => [...this.filters].every(([key, values]) => values.includes(row[key]));
    let selected = rows.filter(matches);
    if (this.operation !== 'select') {
      this.db.writes.push({ table: this.table, operation: this.operation, filters: this.filters, payload: this.payload });
      const id = this.operation === 'upsert' ? (this.payload as Row[])[0]?.question_memo_id
        : this.table === 'question_memo_labels' ? selected[0]?.question_memo_id : selected[0]?.id;
      if (this.db.failWrites.has(`${this.table}:${id}`)) {
        return { data: null, error: { message: 'simulated failure' } };
      }
      if (this.operation === 'update') {
        selected.forEach((row) => Object.assign(row, this.payload));
      } else if (this.operation === 'delete') {
        this.db.tables[this.table] = rows.filter((row) => !matches(row));
      } else if (this.operation === 'upsert') {
        selected = this.payload as Row[];
        for (const row of selected) {
          const duplicate = rows.some((existing) => existing.question_memo_id === row.question_memo_id && existing.label_id === row.label_id);
          if (duplicate && !this.ignoreDuplicates) return { data: null, error: { message: 'duplicate' } };
          if (!duplicate) rows.push({ ...row });
        }
      }
    }
    const data = selected.map((row) => ({
      ...row,
      ...(this.projection.includes('question_memo_labels') ? {
        question_memo_labels: this.db.labels(String(row.id)).map((label_id) => ({ label_id }))
      } : {})
    }));
    return { data: this.singleRow ? data[0] ?? null : data, error: null };
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve().then(() => this.run()).then(onfulfilled, onrejected);
  }
}

describe('bulk update APIs', () => {
  it('validates statuses and operations, rejects empty inputs and deduplicates IDs', () => {
    expect(bulkCompanyStatusBodySchema.parse({ companyIds: [' c1 ', 'c1'], status: 'ES通過' }).companyIds).toEqual(['c1']);
    expect(bulkCompanyStatusBodySchema.safeParse({ companyIds: ['c1'], status: 'unknown' }).success).toBe(false);
    expect(bulkCompanyStatusBodySchema.safeParse({ companyIds: [], status: 'ES通過' }).success).toBe(false);
    expect(bulkQuestionLabelsBodySchema.safeParse({ questionMemoIds: ['q1'], labelIds: [], operation: 'add' }).success).toBe(false);
    expect(bulkQuestionLabelsBodySchema.safeParse({ questionMemoIds: ['q1'], labelIds: ['a'], operation: 'toggle' }).success).toBe(false);
  });

  it('changes only company status and timestamp, skips unchanged records and rejects foreign IDs', async () => {
    const db = new Database();
    const before = structuredClone(db.tables.companies);
    const result = await updateCompanyStatuses(db.client, 'owner', {
      companyIds: ['c1', 'c2', 'foreign', 'missing'], status: 'ES通過'
    });
    expect(result.updatedIds).toEqual(['c1']);
    expect(result.unchangedIds).toEqual(['c2']);
    expect(result.failedIds).toEqual(['foreign', 'missing']);
    expect(result.items.map((item) => item.id)).toEqual(['c1', 'c2']);
    expect(db.tables.companies[0]).toEqual({ ...before[0], status: 'ES通過', updated_at: expect.any(String) });
    expect(db.tables.companies.slice(1)).toEqual(before.slice(1));
    expect(db.writes).toHaveLength(1);
    expect(db.writes[0].filters.get('user_id')).toEqual(['owner']);
  });

  it('preserves successful company updates when another company fails', async () => {
    const db = new Database();
    db.failWrites.add('companies:c2');
    const result = await updateCompanyStatuses(db.client, 'owner', { companyIds: ['c1', 'c2'], status: '辞退' });
    expect(result.updatedIds).toEqual(['c1']);
    expect(result.failedIds).toEqual(['c2']);
    expect(db.tables.companies[0].status).toBe('辞退');
    expect(db.tables.companies[1].status).toBe('ES通過');
  });

  it('adds multiple labels to mixed selections without duplicates or changing question content', async () => {
    const db = new Database();
    const before = structuredClone(db.tables.question_memos);
    const body = { questionMemoIds: ['q1', 'q2', 'q3', 'q4'], labelIds: ['a', 'b'], operation: 'add' as const };
    const result = await updateQuestionLabels(db.client, 'owner', body);
    expect(result.updatedIds).toEqual(['q1', 'q2', 'q4']);
    expect(result.unchangedIds).toEqual(['q3']);
    expect(db.labels('q1')).toEqual(['a', 'b', 'keep']);
    expect(db.labels('q2')).toEqual(['a', 'b', 'keep']);
    expect(db.labels('q3')).toEqual(['a', 'b', 'keep']);
    expect(db.labels('q4')).toEqual(['a', 'b']);
    expect(db.labels('foreign')).toEqual(['foreign']);
    db.tables.question_memos.forEach((memo, index) => {
      expect(memo).toEqual({ ...before[index], updated_at: expect.any(String) });
    });
    const writeCount = db.writes.length;
    const repeated = await updateQuestionLabels(db.client, 'owner', body);
    expect(repeated.updatedIds).toEqual([]);
    expect(repeated.unchangedIds).toEqual(body.questionMemoIds);
    expect(db.writes).toHaveLength(writeCount);
  });

  it('removes only requested labels, including mixed and completely unlabelled questions', async () => {
    const db = new Database();
    const result = await updateQuestionLabels(db.client, 'owner', {
      questionMemoIds: ['q1', 'q2', 'q3', 'q4'], labelIds: ['a', 'b'], operation: 'remove'
    });
    expect(result.updatedIds).toEqual(['q1', 'q2', 'q3']);
    expect(result.unchangedIds).toEqual(['q4']);
    for (const id of ['q1', 'q2', 'q3']) expect(db.labels(id)).toEqual(['keep']);
    expect(db.labels('q4')).toEqual([]);
    expect(db.tables.question_labels).toHaveLength(4);
    expect(db.writes.filter((write) => write.operation === 'delete').every((write) =>
      write.table === 'question_memo_labels' && write.filters.has('question_memo_id') && write.filters.has('label_id')
    )).toBe(true);
  });

  it.each(['add', 'remove'] as const)('rejects foreign labels before any %s writes', async (operation) => {
    const db = new Database();
    await expect(updateQuestionLabels(db.client, 'owner', {
      questionMemoIds: ['q1'], labelIds: ['a', 'foreign'], operation
    })).rejects.toThrow('ラベル情報');
    expect(db.writes).toEqual([]);
  });

  it('does not mutate foreign or missing questions', async () => {
    const db = new Database();
    const result = await updateQuestionLabels(db.client, 'owner', {
      questionMemoIds: ['foreign', 'missing'], labelIds: ['a'], operation: 'add'
    });
    expect(result.failedIds).toEqual(['foreign', 'missing']);
    expect(db.writes).toEqual([]);
    expect(db.labels('foreign')).toEqual(['foreign']);
  });

  it('keeps unrelated labels on failures and reports partial success', async () => {
    const db = new Database();
    db.failWrites.add('question_memo_labels:q2');
    const result = await updateQuestionLabels(db.client, 'owner', {
      questionMemoIds: ['q1', 'q2'], labelIds: ['a', 'b'], operation: 'add'
    });
    expect(result.updatedIds).toEqual(['q1']);
    expect(result.failedIds).toEqual(['q2']);
    expect(db.labels('q1')).toEqual(['a', 'b', 'keep']);
    expect(db.labels('q2')).toEqual(['b', 'keep']);
  });

  it('reports metadata failures so the client can reload already persisted relations', async () => {
    const db = new Database();
    db.failWrites.add('question_memos:q1');
    const result = await updateQuestionLabels(db.client, 'owner', {
      questionMemoIds: ['q1'], labelIds: ['b'], operation: 'add'
    });
    expect(result.failedIds).toEqual(['q1']);
    expect(db.labels('q1')).toEqual(['a', 'b', 'keep']);
  });

  it('allows PATCH in cross-origin preflight responses', () => {
    const setHeader = vi.fn();
    applyCorsHeaders({ headers: { origin: 'http://localhost:8081' }, query: {} }, { setHeader } as unknown as VercelResponse);
    expect(setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', expect.stringContaining('PATCH'));
  });
});
