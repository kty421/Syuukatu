import { describe, expect, it } from 'vitest';

import { createApiFailure, createApiSuccess } from './errors';
import { HttpError } from './http';
import { parseValidatedBody, requireJsonContentType, z } from './validation';

describe('api validation helpers', () => {
  it('parses and validates request body with zod', () => {
    const schema = z.object({ name: z.string().min(1) });

    expect(parseValidatedBody(schema, JSON.stringify({ name: 'test' }))).toEqual({ name: 'test' });
  });

  it('throws 422 for invalid request body', () => {
    const schema = z.object({ name: z.string().min(1) });

    expect(() => parseValidatedBody(schema, { name: '' })).toThrow(HttpError);
  });

  it('rejects unsupported content type', () => {
    expect(() => requireJsonContentType('text/plain')).toThrow(HttpError);
  });

  it('creates typed api response envelopes', () => {
    expect(createApiSuccess({ ok: true })).toEqual({ data: { ok: true } });
    expect(createApiFailure('NOT_FOUND', '見つかりません')).toEqual({
      error: {
        code: 'NOT_FOUND',
        details: undefined,
        message: '見つかりません'
      }
    });
  });
});
