import { CompanySchedule, ScheduleCategory } from '../entities/schedule';

export type ScheduleRepository = {
  deleteCategory: (id: string, accessToken: string | null) => Promise<void>;
  deleteSchedule: (id: string, accessToken: string | null) => Promise<void>;
  listCategories: (accessToken: string | null) => Promise<ScheduleCategory[]>;
  listSchedules: (accessToken: string | null) => Promise<CompanySchedule[]>;
  upsertCategory: (
    category: ScheduleCategory,
    accessToken: string | null
  ) => Promise<ScheduleCategory>;
  upsertSchedule: (
    schedule: CompanySchedule,
    accessToken: string | null
  ) => Promise<CompanySchedule>;
};
