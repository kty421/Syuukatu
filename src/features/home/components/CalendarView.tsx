import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
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
import { Company, CompanySchedule, ScheduleCategory } from "../types";
import { getScheduleCategoryPresentation } from "../utils/scheduleCategoryUtils";
import {
  addMonths,
  buildMonthGrid,
  compareDateStrings,
  formatJapaneseDate,
  formatScheduleTime,
  getScheduleEndDate,
  getSchedulesForDate,
  sortSchedules,
  startOfMonth,
  todayDateString,
} from "../utils/scheduleUtils";

type CalendarViewProps = {
  companies: Company[];
  schedules: CompanySchedule[];
  scheduleCategories: ScheduleCategory[];
  isLoading: boolean;
  theme: AppTheme;
  contentPadding: number;
  bottomPadding: number;
  containerStyle: StyleProp<ViewStyle>;
  onOpenSchedule: (schedule: CompanySchedule) => void;
  onDeleteSchedule: (schedule: CompanySchedule) => void;
  onCreateSchedule: (date: string) => void;
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
const weekDayCount = 7;
const weekCount = 6;
const dayCellVerticalPadding = 4;
const dayHeaderHeight = 15;
const cellScheduleHeight = 13;
const cellScheduleGap = 0;
const multiDayBannerHeight = 13;
const multiDayBannerGap = 2;
const multiDayBannerTop = 22;
const timedScheduleAfterAllDayGap = Platform.OS === "web" ? 2 : 4;
const calendarScheduleFontSize = Platform.OS === "web" ? 9 : 10;
const calendarScheduleFontWeight =
  Platform.OS === "web" ? ("700" as const) : ("800" as const);
const calendarScheduleLineHeight = Platform.OS === "web" ? 11 : 12;

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

const getAllDayBannerSpaceHeight = (laneCount: number) =>
  laneCount * (multiDayBannerHeight + multiDayBannerGap);

const getVisibleAllDayLaneLimit = (dayCellHeight: number) =>
  Math.max(
    0,
    Math.floor(
      (dayCellHeight - multiDayBannerTop + multiDayBannerGap) /
        (multiDayBannerHeight + multiDayBannerGap),
    ),
  );

const getVisibleTimedScheduleCount = (
  dayCellHeight: number,
  visibleAllDayLaneCount: number,
) => {
  const allDayOffset =
    visibleAllDayLaneCount > 0
      ? getAllDayBannerSpaceHeight(visibleAllDayLaneCount) +
        timedScheduleAfterAllDayGap
      : 0;
  const availableHeight =
    dayCellHeight - dayCellVerticalPadding * 2 - dayHeaderHeight - allDayOffset;

  if (availableHeight <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (availableHeight + cellScheduleGap) /
        (cellScheduleHeight + cellScheduleGap),
    ),
  );
};

const segmentCoversCell = (segment: WeekMultiDaySegment, cellIndex: number) =>
  segment.startIndex <= cellIndex &&
  cellIndex < segment.startIndex + segment.span;

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
      if (!schedule.isAllDay) {
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
  scheduleCategories,
  isLoading,
  theme,
  contentPadding,
  bottomPadding,
  containerStyle,
  onOpenSchedule,
  onDeleteSchedule,
  onCreateSchedule,
}: CalendarViewProps) => {
  const { height, width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const dayPanelTopRef = useRef(0);
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
      new Map(days.map((date) => [date, getSchedulesForDate(schedules, date)])),
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
    Math.max(Math.floor((height - bottomPadding - 144) / 6), 62),
    88,
  );
  const visibleAllDayLaneLimit = getVisibleAllDayLaneLimit(dayCellHeight);
  const compactCalendar = width < 768;
  const calendarHorizontalPadding = compactCalendar
    ? Math.max(contentPadding - 8, 12)
    : contentPadding;
  const overflowBadgeWidth =
    Platform.OS === "web" ? (compactCalendar ? 20 : 25) : compactCalendar ? 26 : 38;
  const overflowBadgeHeight =
    Platform.OS === "web" ? (compactCalendar ? 18 : 22) : compactCalendar ? 23 : 34;
  const overflowBadgeTextInset =
    Platform.OS === "web" ? 1 : compactCalendar ? 1 : 3;
  const overflowBadgeFontSize =
    Platform.OS === "web" ? (compactCalendar ? 7 : 8) : compactCalendar ? 8 : 9;

  const selectDate = (date: string) => {
    setSelectedDate(date);
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        animated: true,
        y: Math.max(dayPanelTopRef.current - 10, 0),
      });
    });
  };

  const getCompany = (schedule: CompanySchedule) =>
    companyById.get(schedule.companyId) ?? null;

  const getScheduleColor = (schedule: CompanySchedule) => {
    const company = getCompany(schedule);
    const category = getScheduleCategoryPresentation(
      schedule,
      scheduleCategories,
      theme,
    );

    return {
      company,
      color: category.color,
    };
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={{
        paddingBottom: bottomPadding,
        paddingHorizontal: calendarHorizontalPadding,
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
                style={[
                  styles.monthTitle,
                  { color: theme.colors.textPrimary },
                ]}>
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
                  style={[
                    styles.todayButtonText,
                    { color: theme.colors.primary },
                  ]}>
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
              const visibleSegments = segments.filter(
                (segment) => segment.lane < visibleAllDayLaneLimit,
              );

              return (
                <View
                  key={weekDates[0] ?? `week-${weekIndex}`}
                  style={[styles.weekGridRow, { height: dayCellHeight }]}>
                  <View style={styles.weekCellLayer}>
                    {weekDates.map((date, cellIndex) => {
                      const dateObject = new Date(
                        Number(date.slice(0, 4)),
                        Number(date.slice(5, 7)) - 1,
                        Number(date.slice(8, 10)),
                      );
                      const weekdayIndex = dateObject.getDay();
                      const inMonth =
                        date.slice(0, 7) === monthDate.slice(0, 7);
                      const isToday = date === today;
                      const selected = date === selectedDate;
                      const daySchedules = schedulesByDate.get(date) ?? [];
                      const timedSchedules = daySchedules.filter(
                        (schedule) => !schedule.isAllDay,
                      );
                      const dateLaneCount = visibleSegments.reduce(
                        (count, segment) =>
                          segmentCoversCell(segment, cellIndex)
                            ? Math.max(count, segment.lane + 1)
                            : count,
                        0,
                      );
                      const dateBannerSpaceHeight =
                        getAllDayBannerSpaceHeight(dateLaneCount);
                      const visibleScheduleCount = getVisibleTimedScheduleCount(
                        dayCellHeight,
                        dateLaneCount,
                      );
                      const visibleSchedules = timedSchedules.slice(
                        0,
                        visibleScheduleCount,
                      );
                      const hiddenAllDayCount = segments.filter(
                        (segment) =>
                          segmentCoversCell(segment, cellIndex) &&
                          segment.lane >= visibleAllDayLaneLimit,
                      ).length;
                      const hiddenCount =
                        hiddenAllDayCount +
                        timedSchedules.length -
                        visibleSchedules.length;

                      return (
                        <Pressable
                          key={date}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => selectDate(date)}
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
                                    : weekdayIndex === 0
                                      ? theme.colors.danger
                                      : weekdayIndex === 6
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
                                  dateLaneCount > 0
                                    ? dateBannerSpaceHeight +
                                      timedScheduleAfterAllDayGap
                                    : 0,
                              },
                            ]}>
                            {visibleSchedules.map((schedule) => {
                              const { color } = getScheduleColor(schedule);

                              return (
                                <View
                                  key={schedule.id}
                                  style={styles.singleDaySchedule}>
                                  <Text
                                    ellipsizeMode="clip"
                                    numberOfLines={1}
                                    style={[
                                      styles.cellScheduleText,
                                      { color },
                                    ]}>
                                    {schedule.title || schedule.type}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                          {hiddenCount > 0 ? (
                            <View
                              pointerEvents="none"
                              style={[
                                styles.overflowBadge,
                                {
                                  height: overflowBadgeHeight,
                                  width: overflowBadgeWidth,
                                },
                              ]}>
                              <View
                                style={[
                                  styles.overflowBadgeTriangle,
                                  {
                                    borderBottomColor:
                                      theme.colors.primaryBorder,
                                    borderBottomWidth: overflowBadgeHeight,
                                    borderLeftWidth: overflowBadgeWidth,
                                  },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.overflowBadgeText,
                                  {
                                    bottom: overflowBadgeTextInset,
                                    fontSize: overflowBadgeFontSize,
                                    lineHeight: overflowBadgeFontSize + 2,
                                    right: overflowBadgeTextInset,
                                  },
                                ]}>
                                +{hiddenCount}
                              </Text>
                            </View>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>

                  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    {visibleSegments.map((segment) => {
                      const { schedule } = segment;
                      const { color } = getScheduleColor(schedule);
                      const left = `${
                        (segment.startIndex / weekDayCount) * 100
                      }%` as `${number}%`;
                      const width = `${
                        (segment.span / weekDayCount) * 100
                      }%` as `${number}%`;

                      return (
                        <View
                          key={`${schedule.id}-${weekIndex}`}
                          style={[
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
                          ]}>
                          <Text
                            ellipsizeMode="clip"
                            numberOfLines={1}
                            style={styles.multiDayBannerText}>
                            {schedule.title || schedule.type}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View
          onLayout={(event) => {
            dayPanelTopRef.current = event.nativeEvent.layout.y;
          }}
          style={[
            styles.dayPanel,
            theme.shadows.surface,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleBlock}>
              <Text
                style={[
                  styles.panelTitle,
                  { color: theme.colors.textPrimary },
                ]}>
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
                const category = getScheduleCategoryPresentation(
                  schedule,
                  scheduleCategories,
                  theme,
                );
                const panelTimeText = schedule.isAllDay
                  ? "終日"
                  : formatScheduleTime(schedule);

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
                    {compactCalendar && !schedule.isAllDay ? (
                      <View style={styles.panelTimeStack}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.panelTimeStackText,
                            { color: theme.colors.textMuted },
                          ]}>
                          {schedule.startTime ?? ""}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.panelTimeStackText,
                            { color: theme.colors.textMuted },
                          ]}>
                          {schedule.endTime ?? ""}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        ellipsizeMode="clip"
                        numberOfLines={compactCalendar ? 2 : 1}
                        style={[
                          styles.panelTime,
                          compactCalendar && styles.panelTimeCompact,
                          { color: theme.colors.textMuted },
                        ]}>
                        {panelTimeText}
                      </Text>
                    )}
                    <View
                      style={[
                        styles.panelDot,
                        { backgroundColor: category.color },
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
                      icon="trash-outline"
                      label="予定を削除"
                      onPress={(event) => {
                        event.stopPropagation?.();
                        onDeleteSchedule(schedule);
                      }}
                      theme={theme}
                      tone="danger"
                      size="compact"
                      variant="plain"
                    />
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
    overflow: "hidden",
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
    overflow: "hidden",
    padding: dayCellVerticalPadding,
    position: "relative",
  },
  dayHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    minHeight: dayHeaderHeight,
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
    alignItems: "flex-start",
    gap: cellScheduleGap,
    marginTop: 0,
  },
  singleDaySchedule: {
    alignSelf: "stretch",
    justifyContent: "center",
    minHeight: cellScheduleHeight,
    paddingHorizontal: 0,
  },
  cellScheduleText: {
    fontSize: calendarScheduleFontSize,
    fontWeight: calendarScheduleFontWeight,
    lineHeight: calendarScheduleLineHeight,
    textAlign: "left",
  },
  multiDayBanner: {
    height: multiDayBannerHeight,
    justifyContent: "center",
    marginHorizontal: 1,
    paddingHorizontal: 2,
    position: "absolute",
    zIndex: 2,
  },
  multiDayBannerText: {
    color: "#FFFFFF",
    fontSize: calendarScheduleFontSize,
    fontWeight: calendarScheduleFontWeight,
    lineHeight: calendarScheduleLineHeight,
  },
  overflowBadge: {
    bottom: 0,
    position: "absolute",
    right: 0,
    zIndex: 4,
  },
  overflowBadgeTriangle: {
    borderLeftColor: "transparent",
    borderStyle: "solid",
    bottom: 0,
    height: 0,
    opacity: 0.88,
    position: "absolute",
    right: 0,
    width: 0,
  },
  overflowBadgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
    position: "absolute",
  },
  dayPanel: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    overflow: "hidden",
    padding: 14,
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
    height: 36,
    justifyContent: "center",
    minHeight: 36,
    width: 36,
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
  panelTimeCompact: {
    lineHeight: 14,
    width: 48,
  },
  panelTimeStack: {
    alignItems: "flex-start",
    gap: 2,
    justifyContent: "center",
    width: 42,
  },
  panelTimeStackText: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
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
  pressed: {
    opacity: 0.72,
  },
});
