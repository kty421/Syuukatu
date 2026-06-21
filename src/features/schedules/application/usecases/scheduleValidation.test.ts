import { describe, expect, it } from 'vitest';

import { CompanySchedule } from '../../domain/entities/schedule';
import {
  normalizeScheduleForSave,
  sortSchedulesByStart,
  validateScheduleForSave
} from './scheduleValidation';

const schedule = (id: string, startDate: string): CompanySchedule => ({
  categoryId: null,
  companyId: 'company-1',
  createdAt: '2026-06-01T00:00:00.000Z',
  endDate: startDate,
  id,
  isAllDay: true,
  startDate,
  title: '面接',
  type: '面接',
  updatedAt: '2026-06-01T00:00:00.000Z'
});

describe('schedule usecases', () => {
  it('normalizes all-day schedule time fields before save', () => {
    const normalized = normalizeScheduleForSave({
      ...schedule('a', '2026-06-02'),
      endTime: '11:00',
      startTime: '10:00',
      title: '  '
    });

    expect(normalized.startTime).toBeUndefined();
    expect(normalized.endTime).toBeUndefined();
    expect(normalized.title).toBe('面接');
  });

  it('rejects invalid date and time order', () => {
    expect(
      validateScheduleForSave({
        ...schedule('a', '2026-06-02'),
        endDate: '2026-06-01'
      })
    ).toBe('終了日は開始日以降にしてください。');

    expect(
      validateScheduleForSave({
        ...schedule('b', '2026-06-02'),
        endTime: '09:00',
        isAllDay: false,
        startTime: '10:00'
      })
    ).toBe('終了時刻は開始時刻以降にしてください。');
  });

  it('sorts schedules by date and time', () => {
    const schedules = [
      { ...schedule('late', '2026-06-02'), startTime: '13:00', isAllDay: false },
      { ...schedule('early', '2026-06-02'), startTime: '09:00', isAllDay: false },
      schedule('first', '2026-06-01')
    ];

    expect(sortSchedulesByStart(schedules).map((item) => item.id)).toEqual([
      'first',
      'early',
      'late'
    ]);
  });
});
