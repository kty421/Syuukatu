import { AppTheme } from "../../../constants/theme";
import { CompanySchedule, ScheduleCategory } from "../types";

export const uncategorizedCategoryName = "未分類";

export const scheduleCategoryPalette = [
  "#111111",
  "#9AA6AF",
  "#8D6E63",
  "#B39B8E",
  "#F7B39D",
  "#FF9185",
  "#F07A8A",
  "#F0445F",
  "#EF3340",
  "#AA0017",
  "#7F0011",
  "#C45100",
  "#F97300",
  "#FF961F",
  "#F6B80A",
  "#FFD22E",
  "#DDE225",
  "#B7D600",
  "#9BA80A",
  "#277B34",
  "#4CAF50",
  "#57D18A",
  "#16B19E",
  "#079878",
  "#006B6F",
  "#0D8FA0",
  "#10A8C2",
  "#59BED3",
  "#7ED0EC",
  "#4ABBE8",
  "#2188CE",
  "#0B2F99",
  "#2C56B8",
  "#4966D0",
  "#6986E5",
  "#86A8F5",
  "#AAA0EF",
  "#8679D7",
  "#6D4DE2",
  "#5720B8",
  "#8A20D1",
  "#C456E6",
  "#D94BEA",
  "#D80CD6",
  "#BE0064",
  "#DA1782",
  "#F15AA7",
  "#F785BF",
] as const;

export const getUncategorizedCategoryColor = (theme: AppTheme) =>
  theme.isDark ? "#94A3B8" : "#6B7280";

export const findScheduleCategory = (
  schedule: CompanySchedule,
  categories: ScheduleCategory[],
) =>
  schedule.categoryId
    ? categories.find((category) => category.id === schedule.categoryId) ?? null
    : null;

export const getScheduleCategoryPresentation = (
  schedule: CompanySchedule,
  categories: ScheduleCategory[],
  theme: AppTheme,
) => {
  const category = findScheduleCategory(schedule, categories);

  return {
    category,
    name: category?.name ?? uncategorizedCategoryName,
    color: category?.colorCode ?? getUncategorizedCategoryColor(theme),
  };
};
