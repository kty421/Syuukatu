import { CompanySchedule, ScheduleCategory } from '../../domain/entities/schedule';

export type CompanyScheduleDto = CompanySchedule;
export type ScheduleCategoryDto = ScheduleCategory;

export const toCompanyScheduleDomain = (
  dto: CompanyScheduleDto
): CompanySchedule => ({
  ...dto,
  categoryId: dto.categoryId ?? null,
  endDate: dto.endDate ?? dto.startDate
});

export const toScheduleCategoryDomain = (
  dto: ScheduleCategoryDto
): ScheduleCategory => ({ ...dto });

export const toCompanyScheduleRequestDto = (schedule: CompanySchedule) => ({
  schedule: {
    ...schedule,
    categoryId: schedule.categoryId ?? null
  }
});

export const toScheduleCategoryRequestDto = (category: ScheduleCategory) => ({
  category
});
