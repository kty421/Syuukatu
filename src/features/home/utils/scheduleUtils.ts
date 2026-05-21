import { CompanySchedule } from "../types";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;

export const todayDateString = () => toDateString(new Date());

export const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseDateString = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
};

export const addDays = (value: string, amount: number) => {
  const date = parseDateString(value);
  date.setDate(date.getDate() + amount);

  return toDateString(date);
};

export const addMonths = (value: string, amount: number) => {
  const date = parseDateString(value);
  date.setMonth(date.getMonth() + amount, 1);

  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(
    2,
    "0",
  )}-01`;
};

export const startOfMonth = (value: string) => `${value.slice(0, 7)}-01`;

export const buildMonthGrid = (monthDate: string) => {
  const firstDate = parseDateString(startOfMonth(monthDate));
  const startOffset = firstDate.getDay();
  const firstGridDate = addDays(toDateString(firstDate), -startOffset);

  return Array.from({ length: 42 }, (_, index) => addDays(firstGridDate, index));
};

export const compareDateStrings = (first: string, second: string) =>
  first.localeCompare(second);

export const compareTimeStrings = (first?: string, second?: string) =>
  (first ?? "00:00").localeCompare(second ?? "00:00");

export const isValidDateString = (value: string) => datePattern.test(value);

export const isValidTimeString = (value: string) => {
  if (!timePattern.test(value)) {
    return false;
  }

  const [hour, minute] = value.split(":").map(Number);

  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

export const getScheduleEndDate = (schedule: CompanySchedule) =>
  schedule.endDate || schedule.startDate;

export const isMultiDaySchedule = (schedule: CompanySchedule) =>
  schedule.isAllDay && getScheduleEndDate(schedule) !== schedule.startDate;

export const scheduleIncludesDate = (
  schedule: CompanySchedule,
  date: string,
) =>
  compareDateStrings(schedule.startDate, date) <= 0 &&
  compareDateStrings(getScheduleEndDate(schedule), date) >= 0;

export const getDatesInSchedule = (schedule: CompanySchedule) => {
  const dates: string[] = [];
  let current = schedule.startDate;
  const end = getScheduleEndDate(schedule);

  while (compareDateStrings(current, end) <= 0) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
};

export const sortSchedules = (schedules: CompanySchedule[]) =>
  [...schedules].sort((first, second) => {
    const dateOrder = compareDateStrings(first.startDate, second.startDate);

    if (dateOrder !== 0) {
      return dateOrder;
    }

    if (first.isAllDay !== second.isAllDay) {
      return first.isAllDay ? -1 : 1;
    }

    const timeOrder = compareTimeStrings(first.startTime, second.startTime);

    if (timeOrder !== 0) {
      return timeOrder;
    }

    return first.title.localeCompare(second.title, "ja");
  });

export const getSchedulesForDate = (
  schedules: CompanySchedule[],
  date: string,
) => sortSchedules(schedules.filter((schedule) => scheduleIncludesDate(schedule, date)));

const rangesOverlap = (
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
) =>
  compareDateStrings(firstStart, secondEnd) <= 0 &&
  compareDateStrings(secondStart, firstEnd) <= 0;

const timedSchedulesOverlap = (
  first: CompanySchedule,
  second: CompanySchedule,
) => {
  if (first.startDate !== second.startDate) {
    return false;
  }

  if (!first.startTime || !first.endTime || !second.startTime || !second.endTime) {
    return false;
  }

  return first.startTime < second.endTime && second.startTime < first.endTime;
};

export const findOverlappingSchedules = (
  targetSchedule: CompanySchedule,
  existingSchedules: CompanySchedule[],
) =>
  existingSchedules.filter((schedule) => {
    if (schedule.id === targetSchedule.id) {
      return false;
    }

    if (targetSchedule.isAllDay || schedule.isAllDay) {
      return rangesOverlap(
        targetSchedule.startDate,
        getScheduleEndDate(targetSchedule),
        schedule.startDate,
        getScheduleEndDate(schedule),
      );
    }

    return timedSchedulesOverlap(targetSchedule, schedule);
  });

export const validateSchedule = (schedule: CompanySchedule) => {
  if (!isValidDateString(schedule.startDate)) {
    return "開始日をYYYY-MM-DD形式で入力してください";
  }

  const endDate = getScheduleEndDate(schedule);

  if (!isValidDateString(endDate)) {
    return "終了日をYYYY-MM-DD形式で入力してください";
  }

  if (compareDateStrings(endDate, schedule.startDate) < 0) {
    return "終了日は開始日以降にしてください";
  }

  if (schedule.isAllDay) {
    return null;
  }

  if (endDate !== schedule.startDate) {
    return "時間指定予定は同じ日付内で入力してください";
  }

  if (
    !schedule.startTime ||
    !schedule.endTime ||
    !isValidTimeString(schedule.startTime) ||
    !isValidTimeString(schedule.endTime)
  ) {
    return "開始時刻と終了時刻をHH:mm形式で入力してください";
  }

  if (schedule.endTime <= schedule.startTime) {
    return "終了時刻は開始時刻より後にしてください";
  }

  return null;
};

export const formatJapaneseDate = (date: string, withWeekday = true) => {
  const parsed = parseDateString(date);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][parsed.getDay()];
  const text = `${parsed.getMonth() + 1}月${parsed.getDate()}日`;

  return withWeekday ? `${text}（${weekday}）` : text;
};

export const formatScheduleTime = (schedule: CompanySchedule) => {
  if (schedule.isAllDay) {
    return isMultiDaySchedule(schedule)
      ? `${formatJapaneseDate(schedule.startDate, false)}〜${formatJapaneseDate(
          getScheduleEndDate(schedule),
          false,
        )} 終日`
      : "終日";
  }

  return `${schedule.startTime ?? ""} - ${schedule.endTime ?? ""}`;
};
