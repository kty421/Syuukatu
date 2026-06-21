import { describe, expect, it } from 'vitest';

import {
  dateOrderSchema,
  optionalTrimmedString,
  optionalUrlString,
  trimmedString
} from './commonSchemas';

describe('commonSchemas', () => {
  it('trims required and optional strings', () => {
    expect(trimmedString().parse('  企業  ')).toBe('企業');
    expect(optionalTrimmedString().parse('   ')).toBeUndefined();
  });

  it('accepts only http or https urls', () => {
    expect(optionalUrlString().safeParse('https://example.com').success).toBe(true);
    expect(optionalUrlString().safeParse('ftp://example.com').success).toBe(false);
  });

  it('rejects an end date before the start date', () => {
    expect(
      dateOrderSchema.safeParse({
        endDate: '2026-06-01',
        startDate: '2026-06-02'
      }).success
    ).toBe(false);
  });
});
