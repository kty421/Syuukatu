import { CompanySchedule } from '../../domain/entities/schedule';

const timePattern = /^\d{2}:\d{2}$/;

export const normalizeScheduleForSave = (
  schedule: CompanySchedule
): CompanySchedule => ({
  ...schedule,
  categoryId: schedule.categoryId ?? null,
  endDate: schedule.endDate || schedule.startDate,
  endTime: schedule.isAllDay ? undefined : schedule.endTime,
  memo: schedule.memo?.trim(),
  startTime: schedule.isAllDay ? undefined : schedule.startTime,
  title: schedule.title.trim() || schedule.type
});

export const validateScheduleForSave = (schedule: CompanySchedule) => {
  if (!schedule.companyId) {
    return '企業情報を確認してください。';
  }

  if (schedule.endDate && schedule.endDate < schedule.startDate) {
    return '終了日は開始日以降にしてください。';
  }

  if (!schedule.isAllDay) {
    if (schedule.startTime && !timePattern.test(schedule.startTime)) {
      return '開始時刻を確認してください。';
    }

    if (schedule.endTime && !timePattern.test(schedule.endTime)) {
      return '終了時刻を確認してください。';
    }

    if (
      schedule.startDate === (schedule.endDate ?? schedule.startDate) &&
      schedule.startTime &&
      schedule.endTime &&
      schedule.endTime < schedule.startTime
    ) {
      return '終了時刻は開始時刻以降にしてください。';
    }
  }

  return null;
};

export const sortSchedulesByStart = (schedules: CompanySchedule[]) =>
  [...schedules].sort((a, b) => {
    const dateOrder = a.startDate.localeCompare(b.startDate);

    if (dateOrder !== 0) {
      return dateOrder;
    }

    return (a.startTime ?? '').localeCompare(b.startTime ?? '');
  });
