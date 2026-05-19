import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

import { AppTheme } from "../../../constants/theme";
import { IconButton } from "../../../ui/IconButton";
import { Company, CompanySchedule } from "../types";
import {
  addMonths,
  buildMonthGrid,
  compareDateStrings,
  formatJapaneseDate,
  formatScheduleTime,
  getScheduleEndDate,
  getSchedulesForDate,
  isMultiDaySchedule,
  sortSchedules,
  startOfMonth,
  todayDateString,
} from "../utils/scheduleUtils";

type CalendarViewProps = {
  companies: Company[];
  schedules: CompanySchedule[];
  isLoading: boolean;
  theme: AppTheme;
  contentPadding: number;
  bottomPadding: number;
  containerStyle: StyleProp<ViewStyle>;
  onOpenSchedule: (schedule: CompanySchedule) => void;
  onOpenCompany: (company: Company) => void;
  onCreateSchedule: (date: string) => void;
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
const maxCellSchedules = 2;
const weekDayCount = 7;
const weekCount = 6;
const multiDayBannerHeight = 18;
const multiDayBannerGap = 3;
const multiDayBannerTop = 24;

type WeekMultiDaySegment = {
  schedule: CompanySchedule;
  startIndex: number;
  span: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

const chunkMonthWeeks = (days: string[]) =>
  Array.from({ length: weekCount }, (_, index) =>
    days.slice(index * weekDayCount, index * weekDayCount + weekDayCount),
  );

const buildWeekMultiDaySegments = (
  weekDates: string[],
  schedules: CompanySchedule[],
) => {
  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];
  const laneEndIndexes: number[] = [];
  const segments: WeekMultiDaySegment[] = [];

  if (!weekStart || !weekEnd) {
    return segments;
  }

  const weekSchedules = sortSchedules(
    schedules.filter((schedule) => {
      if (!isMultiDaySchedule(schedule)) {
        return false;
      }

      return (
        compareDateStrings(schedule.startDate, weekEnd) <= 0 &&
        compareDateStrings(getScheduleEndDate(schedule), weekStart) >= 0
      );
    }),
  );

  for (const schedule of weekSchedules) {
    const scheduleEnd = getScheduleEndDate(schedule);
    const clippedStart =
      compareDateStrings(schedule.startDate, weekStart) < 0
        ? weekStart
        : schedule.startDate;
    const clippedEnd =
      compareDateStrings(scheduleEnd, weekEnd) > 0 ? weekEnd : scheduleEnd;
    const startIndex = weekDates.indexOf(clippedStart);
    const endIndex = weekDates.indexOf(clippedEnd);

    if (startIndex < 0 || endIndex < startIndex) {
      continue;
    }

    let lane = laneEndIndexes.findIndex(
      (laneEndIndex) => laneEndIndex < startIndex,
    );

    if (lane === -1) {
      lane = laneEndIndexes.length;
      laneEndIndexes.push(endIndex);
    } else {
      laneEndIndexes[lane] = endIndex;
    }

    segments.push({
      schedule,
      startIndex,
      span: endIndex - startIndex + 1,
      lane,
      continuesBefore: compareDateStrings(schedule.startDate, weekStart) < 0,
      continuesAfter: compareDateStrings(scheduleEnd, weekEnd) > 0,
    });
  }

  return segments;
};

export const mockCalendarCompanies: Company[] = [
  {
    id: "company-a",
    type: "internship",
    companyName: "青空商事",
    aspiration: "high",
    status: "未エントリー",
    loginId: "",
    password: "",
    myPageUrl: "",
    industry: "商社",
    role: "総合職",
    tags: ["夏インターン"],
    questionAnswers: [],
    memo: "",
    favorite: false,
    archived: false,
    createdAt: "2026-05-20T00:00:00.000Z",
    updatedAt: "2026-05-20T00:00:00.000Z",
  },
  {
    id: "company-b",
    type: "fullTime",
    companyName: "未来テック",
    aspiration: "middle",
    status: "１次面接待ち",
    loginId: "",
    password: "",
    myPageUrl: "",
    industry: "IT",
    role: "エンジニア",
    tags: ["本選考"],
    questionAnswers: [],
    memo: "",
    favorite: false,
    archived: false,
    createdAt: "2026-05-20T00:00:00.000Z",
    updatedAt: "2026-05-20T00:00:00.000Z",
  },
];

export const mockCalendarSchedules: CompanySchedule[] = [
  {
    id: "schedule-1",
    companyId: "company-a",
    title: "サマーインターン",
    type: "インターン",
    startDate: "2026-06-10",
    endDate: "2026-06-12",
    isAllDay: true,
    createdAt: "2026-05-20T00:00:00.000Z",
    updatedAt: "2026-05-20T00:00:00.000Z",
  },
  {
    id: "schedule-2",
    companyId: "company-b",
    title: "一次面接",
    type: "面接",
    startDate: "2026-06-11",
    endDate: "2026-06-11",
    startTime: "14:00",
    endTime: "15:00",
    isAllDay: false,
    createdAt: "2026-05-20T00:00:00.000Z",
    updatedAt: "2026-05-20T00:00:00.000Z",
  },
];

export const CalendarView = ({
  companies,
  schedules,
  isLoading,
  theme,
  contentPadding,
  bottomPadding,
  containerStyle,
  onOpenSchedule,
  onOpenCompany,
  onCreateSchedule,
}: CalendarViewProps) => {
  const { height } = useWindowDimensions();
  const today = todayDateString();
  const [monthDate, setMonthDate] = useState(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const companyById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );
  const days = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const weekRows = useMemo(() => chunkMonthWeeks(days), [days]);
  const schedulesByDate = useMemo(
    () =>
      new Map(
        days.map((date) => [date, getSchedulesForDate(schedules, date)]),
      ),
    [days, schedules],
  );
  const weekMultiDaySegments = useMemo(
    () =>
      weekRows.map((weekDates) =>
        buildWeekMultiDaySegments(weekDates, schedules),
      ),
    [schedules, weekRows],
  );
  const selectedSchedules = useMemo(
    () => getSchedulesForDate(schedules, selectedDate),
    [schedules, selectedDate],
  );
  const monthTitle = `${Number(monthDate.slice(0, 4))}年${Number(
    monthDate.slice(5, 7),
  )}月`;
  const dayCellHeight = Math.min(
    Math.max(Math.floor((height - bottomPadding - 176) / 6), 54),
    78,
  );

  const getCompany = (schedule: CompanySchedule) =>
    companyById.get(schedule.companyId) ?? null;

  const getScheduleColor = (schedule: CompanySchedule) => {
    const company = getCompany(schedule);
    const aspiration = theme.aspirations[company?.aspiration ?? "unset"];

    return {
      company,
      color: aspiration.foreground,
    };
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: bottomPadding,
        paddingHorizontal: contentPadding,
        paddingTop: 8,
      }}
      showsVerticalScrollIndicator={false}>
      <View style={containerStyle}>
        <View
          style={[
            styles.calendarShell,
            theme.shadows.surface,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.monthHeader}>
            <IconButton
              icon="chevron-back"
              label="前の月"
              onPress={() => setMonthDate((current) => addMonths(current, -1))}
              theme={theme}
              variant="plain"
            />
            <View style={styles.monthTitleBlock}>
              <Text
                style={[styles.monthTitle, { color: theme.colors.textPrimary }]}>
                {monthTitle}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setMonthDate(startOfMonth(today));
                  setSelectedDate(today);
                }}
                style={({ pressed }) => [
                  styles.todayButton,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                  },
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[styles.todayButtonText, { color: theme.colors.primary }]}>
                  今日
                </Text>
              </Pressable>
            </View>
            <IconButton
              icon="chevron-forward"
              label="次の月"
              onPress={() => setMonthDate((current) => addMonths(current, 1))}
              theme={theme}
              variant="plain"
            />
          </View>

          <View style={styles.weekRow}>
            {weekdays.map((weekday, index) => (
              <Text
                key={weekday}
                style={[
                  styles.weekday,
                  {
                    color:
                      index === 0
                        ? theme.colors.danger
                        : index === 6
                          ? theme.colors.primary
                          : theme.colors.textMuted,
                  },
                ]}>
                {weekday}
              </Text>
            ))}
          </View>

          <View style={[styles.grid, { borderColor: theme.colors.divider }]}>
            {weekRows.map((weekDates, weekIndex) => {
              const segments = weekMultiDaySegments[weekIndex] ?? [];
              const laneCount = segments.reduce(
                (count, segment) => Math.max(count, segment.lane + 1),
                0,
              );
              const bannerSpaceHeight =
                laneCount * (multiDayBannerHeight + multiDayBannerGap);
              const weekRowHeight = Math.max(
                dayCellHeight,
                multiDayBannerTop + bannerSpaceHeight + 42,
              );

              return (
                <View
                  key={weekDates[0] ?? `week-${weekIndex}`}
                  style={[styles.weekGridRow, { height: weekRowHeight }]}>
                  <View style={styles.weekCellLayer}>
                    {weekDates.map((date) => {
                      const dateObject = new Date(
                        Number(date.slice(0, 4)),
                        Number(date.slice(5, 7)) - 1,
                        Number(date.slice(8, 10)),
                      );
                      const dayIndex = dateObject.getDay();
                      const inMonth =
                        date.slice(0, 7) === monthDate.slice(0, 7);
                      const isToday = date === today;
                      const selected = date === selectedDate;
                      const daySchedules = schedulesByDate.get(date) ?? [];
                      const singleDaySchedules = daySchedules.filter(
                        (schedule) => !isMultiDaySchedule(schedule),
                      );
                      const visibleSchedules = singleDaySchedules.slice(
                        0,
                        maxCellSchedules,
                      );
                      const hiddenCount =
                        singleDaySchedules.length - visibleSchedules.length;

                      return (
                        <Pressable
                          key={date}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => setSelectedDate(date)}
                          style={({ pressed }) => [
                            styles.dayCell,
                            {
                              backgroundColor: selected
                                ? theme.colors.primarySubtle
                                : theme.colors.surface,
                              borderColor: selected
                                ? theme.colors.primaryBorder
                                : theme.colors.divider,
                            },
                            pressed && styles.pressed,
                          ]}>
                          <View style={styles.dayHeader}>
                            <Text
                              style={[
                                styles.dayNumber,
                                {
                                  color: !inMonth
                                    ? theme.colors.textDisabled
                                    : dayIndex === 0
                                      ? theme.colors.danger
                                      : dayIndex === 6
                                        ? theme.colors.primary
                                        : theme.colors.textPrimary,
                                },
                              ]}>
                              {Number(date.slice(8, 10))}
                            </Text>
                            {isToday ? (
                              <View
                                style={[
                                  styles.todayDot,
                                  { backgroundColor: theme.colors.primary },
                                ]}
                              />
                            ) : null}
                          </View>

                          <View
                            style={[
                              styles.cellScheduleList,
                              {
                                marginTop:
                                  laneCount > 0
                                    ? bannerSpaceHeight + 11
                                    : 4,
                              },
                            ]}>
                            {visibleSchedules.map((schedule) => {
                              const { company, color } =
                                getScheduleColor(schedule);

                              return (
                                <Pressable
                                  key={schedule.id}
                                  accessibilityRole="button"
                                  accessibilityLabel={`${company?.companyName ?? "企業"} ${schedule.title || schedule.type}を編集`}
                                  onPress={(event) => {
                                    event.stopPropagation?.();
                                    onOpenSchedule(schedule);
                                  }}
                                  style={({ pressed }) => [
                                    styles.singleDaySchedule,
                                    pressed && styles.pressed,
                                  ]}>
                                  <Text
                                    numberOfLines={1}
                                    style={[
                                      styles.cellScheduleText,
                                      { color },
                                    ]}>
                                    {schedule.title || schedule.type}
                                  </Text>
                                </Pressable>
                              );
                            })}
                            {hiddenCount > 0 ? (
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.moreText,
                                  { color: theme.colors.textMuted },
                                ]}>
                                +{hiddenCount}件
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                    {segments.map((segment) => {
                      const { schedule } = segment;
                      const { company, color } = getScheduleColor(schedule);
                      const left = `${
                        (segment.startIndex / weekDayCount) * 100
                      }%` as `${number}%`;
                      const width = `${
                        (segment.span / weekDayCount) * 100
                      }%` as `${number}%`;

                      return (
                        <Pressable
                          key={`${schedule.id}-${weekIndex}`}
                          accessibilityRole="button"
                          accessibilityLabel={`${company?.companyName ?? "企業"} ${schedule.title || schedule.type}を編集`}
                          onPress={(event) => {
                            event.stopPropagation?.();
                            onOpenSchedule(schedule);
                          }}
                          style={({ pressed }) => [
                            styles.multiDayBanner,
                            {
                              backgroundColor: color,
                              borderBottomLeftRadius: segment.continuesBefore
                                ? 0
                                : 5,
                              borderBottomRightRadius: segment.continuesAfter
                                ? 0
                                : 5,
                              borderTopLeftRadius: segment.continuesBefore
                                ? 0
                                : 5,
                              borderTopRightRadius: segment.continuesAfter
                                ? 0
                                : 5,
                              left,
                              top:
                                multiDayBannerTop +
                                segment.lane *
                                  (multiDayBannerHeight + multiDayBannerGap),
                              width,
                            },
                            pressed && styles.pressed,
                          ]}>
                          <Text
                            numberOfLines={1}
                            style={styles.multiDayBannerText}>
                            {schedule.title || schedule.type}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.dayPanel,
            theme.shadows.surface,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <View
            style={[
              styles.panelHandle,
              { backgroundColor: theme.colors.border },
            ]}
          />
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleBlock}>
              <Text
                style={[styles.panelTitle, { color: theme.colors.textPrimary }]}>
                {formatJapaneseDate(selectedDate)}
              </Text>
              <Text
                style={[styles.panelCount, { color: theme.colors.textMuted }]}>
                {selectedSchedules.length}件
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="選択日の予定を追加"
              onPress={() => onCreateSchedule(selectedDate)}
              style={({ pressed }) => [
                styles.addScheduleButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                },
                pressed && styles.pressed,
              ]}>
              <Ionicons
                name="add"
                size={16}
                color={theme.colors.textOnPrimary}
              />
              <Text
                style={[
                  styles.addScheduleText,
                  { color: theme.colors.textOnPrimary },
                ]}>
                追加
              </Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : selectedSchedules.length === 0 ? (
            <View style={styles.emptyState}>
              <Text
                style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                この日の予定はありません
              </Text>
            </View>
          ) : (
            <View style={styles.panelList}>
              {selectedSchedules.map((schedule) => {
                const company = getCompany(schedule);
                const aspiration =
                  theme.aspirations[company?.aspiration ?? "unset"];

                return (
                  <Pressable
                    key={schedule.id}
                    accessibilityRole="button"
                    onPress={() => onOpenSchedule(schedule)}
                    style={({ pressed }) => [
                      styles.panelRow,
                      {
                        borderColor: theme.colors.divider,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      numberOfLines={1}
                      style={[styles.panelTime, { color: theme.colors.textMuted }]}>
                      {formatScheduleTime(schedule)}
                    </Text>
                    <View
                      style={[
                        styles.panelDot,
                        { backgroundColor: aspiration.foreground },
                      ]}
                    />
                    <View style={styles.panelBody}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.panelCompany,
                          { color: theme.colors.textPrimary },
                        ]}>
                        {company?.companyName ?? "企業名未設定"}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.panelScheduleTitle,
                          { color: theme.colors.textSecondary },
                        ]}>
                        {schedule.title || schedule.type}
                      </Text>
                    </View>
                    <IconButton
                      icon="create-outline"
                      label="予定を編集"
                      onPress={(event) => {
                        event.stopPropagation?.();
                        onOpenSchedule(schedule);
                      }}
                      theme={theme}
                      size="compact"
                      variant="plain"
                    />
                    {company ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${company.companyName}を開く`}
                        onPress={(event) => {
                          event.stopPropagation?.();
                          onOpenCompany(company);
                        }}
                        style={({ pressed }) => [
                          styles.openCompanyButton,
                          pressed && styles.pressed,
                        ]}>
                        <Ionicons
                          name="business-outline"
                          size={17}
                          color={theme.colors.textMuted}
                        />
                      </Pressable>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  calendarShell: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  monthTitleBlock: {
    alignItems: "center",
    gap: 6,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
  },
  todayButton: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15,
  },
  weekRow: {
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  weekday: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textAlign: "center",
  },
  grid: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  weekGridRow: {
    position: "relative",
  },
  weekCellLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  dayCell: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minWidth: 0,
    padding: 5,
  },
  dayHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    minHeight: 16,
  },
  dayNumber: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
  },
  todayDot: {
    borderRadius: 999,
    height: 5,
    width: 5,
  },
  cellScheduleList: {
    gap: 3,
    marginTop: 4,
  },
  singleDaySchedule: {
    justifyContent: "center",
    minHeight: 15,
    paddingHorizontal: 2,
  },
  cellScheduleText: {
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 12,
  },
  moreText: {
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 12,
    paddingHorizontal: 4,
  },
  multiDayBanner: {
    height: multiDayBannerHeight,
    justifyContent: "center",
    marginHorizontal: 1,
    paddingHorizontal: 5,
    position: "absolute",
    zIndex: 2,
  },
  multiDayBannerText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 12,
  },
  dayPanel: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    overflow: "hidden",
    padding: 14,
  },
  panelHandle: {
    alignSelf: "center",
    borderRadius: 999,
    height: 4,
    marginBottom: 12,
    width: 42,
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  panelTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23,
  },
  panelCount: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  addScheduleButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 12,
  },
  addScheduleText: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 86,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  panelList: {
    marginTop: 10,
  },
  panelRow: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 9,
    minHeight: 58,
    paddingVertical: 10,
  },
  panelTime: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
    width: 72,
  },
  panelDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  panelBody: {
    flex: 1,
    minWidth: 0,
  },
  panelCompany: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  panelScheduleTitle: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 2,
  },
  openCompanyButton: {
    alignItems: "center",
    borderRadius: 12,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  pressed: {
    opacity: 0.72,
  },
});
