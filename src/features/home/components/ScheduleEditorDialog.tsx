import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTheme } from "../../../constants/theme";
import { AppButton } from "../../../ui/AppButton";
import { FullScreenModalShell } from "../../../ui/FullScreenModalShell";
import { IconButton } from "../../../ui/IconButton";
import { InputField } from "../../../ui/InputField";
import {
  Company,
  CompanySchedule,
  ScheduleCategory,
  ScheduleCategoryDraft,
} from "../types";
import { getScheduleCategoryPresentation } from "../utils/scheduleCategoryUtils";
import {
  addMonths,
  buildMonthGrid,
  compareDateStrings,
  formatJapaneseDate,
  startOfMonth,
  todayDateString,
  validateSchedule,
} from "../utils/scheduleUtils";
import { ScheduleCategoryPicker } from "./ScheduleCategoryPicker";

export type ScheduleCompanyInfo = {
  id: string;
  companyName: string;
};

type ScheduleEditorDialogProps = {
  visible: boolean;
  schedule: CompanySchedule | null;
  company: ScheduleCompanyInfo;
  allSchedules: CompanySchedule[];
  companies: Company[];
  scheduleCategories: ScheduleCategory[];
  theme: AppTheme;
  initialDate?: string | null;
  onClose: () => void;
  onSave: (schedule: CompanySchedule) => void;
  onSaveScheduleCategory: (
    category: ScheduleCategoryDraft | ScheduleCategory,
  ) => Promise<ScheduleCategory>;
  onDeleteScheduleCategory: (categoryId: string) => Promise<void>;
};

type DatePickerTarget = "start" | "end" | "single";
type TimePickerTarget = "start" | "end";
type TimeInputPhase = "startHour" | "startMinute" | "endHour" | "endMinute";

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
const timeKeyRows = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["0", "00", "30"],
] as const;

const createScheduleId = () =>
  `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const toTimeString = (totalMinutes: number) => {
  const boundedMinutes = Math.min(Math.max(totalMinutes, 0), 23 * 60 + 30);
  const hour = Math.floor(boundedMinutes / 60);
  const minute = boundedMinutes % 60;

  return `${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}`;
};

const getDefaultTimeRange = () => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const roundedMinutes = Math.ceil(currentMinutes / 30) * 30;
  const startMinutes = Math.min(roundedMinutes, 22 * 60 + 30);

  return {
    startTime: toTimeString(startMinutes),
    endTime: toTimeString(startMinutes + 60),
  };
};

const parseTimeValue = (time: string) => {
  const [hour = "0", minute = "0"] = time.split(":");

  return {
    hour: Math.min(Math.max(Number(hour.replace(/\D/g, "")) || 0, 0), 23),
    minute: Math.min(Math.max(Number(minute.replace(/\D/g, "")) || 0, 0), 59),
  };
};

const formatTimeValue = (time: { hour: number; minute: number }) =>
  `${`${time.hour}`.padStart(2, "0")}:${`${time.minute}`.padStart(2, "0")}`;

const compareTimeValues = (
  a: { hour: number; minute: number },
  b: { hour: number; minute: number },
) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute);

const sanitizeTimeText = (value: string) =>
  value.replace(/[^\d:]/g, "").slice(0, 5);

const normalizeTimeText = (value: string, fallback: string) => {
  const fallbackTime = parseTimeValue(fallback);
  const trimmedValue = value.trim();
  const digits = trimmedValue.replace(/\D/g, "");

  if (!trimmedValue || !digits) {
    return formatTimeValue(fallbackTime);
  }

  if (trimmedValue.includes(":")) {
    const [hourText = "", minuteText = ""] = trimmedValue.split(":");
    const hour = Math.min(Math.max(Number(hourText) || 0, 0), 23);
    const minute = Math.min(Math.max(Number(minuteText) || 0, 0), 59);

    return formatTimeValue({ hour, minute });
  }

  const hourText = digits.length <= 2 ? digits : digits.slice(0, -2);
  const minuteText = digits.length <= 2 ? "00" : digits.slice(-2);
  const hour = Math.min(Math.max(Number(hourText) || 0, 0), 23);
  const minute = Math.min(Math.max(Number(minuteText) || 0, 0), 59);

  return formatTimeValue({ hour, minute });
};

const toMinutes = (time: { hour: number; minute: number }) =>
  time.hour * 60 + time.minute;

const fromMinutes = (minutes: number) => {
  const boundedMinutes = Math.min(Math.max(minutes, 0), 23 * 60 + 59);

  return {
    hour: Math.floor(boundedMinutes / 60),
    minute: boundedMinutes % 60,
  };
};

const getFieldValue = (
  phase: TimeInputPhase,
  buffer: string,
  field: TimeInputPhase,
  value: number,
) => {
  if (phase === field && buffer.length === 1) {
    return `0${buffer}`;
  }

  return `${value}`.padStart(2, "0");
};

const createEmptySchedule = (
  companyId: string,
  initialDate?: string | null,
  defaultTitle = "",
): CompanySchedule => {
  const now = new Date().toISOString();
  const date = initialDate || todayDateString();

  return {
    id: createScheduleId(),
    companyId,
    title: defaultTitle,
    type: "その他",
    categoryId: null,
    startDate: date,
    endDate: date,
    startTime: undefined,
    endTime: undefined,
    isAllDay: true,
    memo: "",
    createdAt: now,
    updatedAt: now,
  };
};

export const ScheduleEditorDialog = ({
  visible,
  schedule,
  company,
  scheduleCategories,
  theme,
  initialDate,
  onClose,
  onSave,
  onSaveScheduleCategory,
  onDeleteScheduleCategory,
}: ScheduleEditorDialogProps) => {
  const [draft, setDraft] = useState<CompanySchedule>(() =>
    createEmptySchedule(company.id, initialDate, company.companyName),
  );
  const [error, setError] = useState<string | null>(null);
  const [datePickerTarget, setDatePickerTarget] =
    useState<DatePickerTarget | null>(null);
  const [timePickerTarget, setTimePickerTarget] =
    useState<TimePickerTarget | null>(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraft(
      schedule
        ? {
            ...schedule,
            type: schedule.type || "その他",
            categoryId: schedule.categoryId ?? null,
            endDate: schedule.endDate || schedule.startDate,
            startTime: schedule.startTime || getDefaultTimeRange().startTime,
            endTime: schedule.endTime || getDefaultTimeRange().endTime,
            memo: schedule.memo ?? "",
          }
        : createEmptySchedule(company.id, initialDate, company.companyName),
    );
    setError(null);
    setDatePickerTarget(null);
    setTimePickerTarget(null);
    setCategoryPickerVisible(false);
  }, [company.companyName, company.id, initialDate, schedule, visible]);

  const normalizedDraft = useMemo<CompanySchedule>(
    () => ({
      ...draft,
      companyId: company.id,
      title: draft.title.trim() || company.companyName.trim() || "予定",
      type: "その他",
      categoryId: draft.categoryId ?? null,
      memo: draft.memo?.trim(),
      endDate: draft.isAllDay ? draft.endDate || draft.startDate : draft.startDate,
      startTime: draft.isAllDay ? undefined : draft.startTime,
      endTime: draft.isAllDay ? undefined : draft.endTime,
    }),
    [company.companyName, company.id, draft],
  );
  const selectedCategory = getScheduleCategoryPresentation(
    draft,
    scheduleCategories,
    theme,
  );

  const update = <K extends keyof CompanySchedule>(
    key: K,
    value: CompanySchedule[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const openDatePicker = (target: DatePickerTarget) => {
    Keyboard.dismiss();
    setTimePickerTarget(null);
    requestAnimationFrame(() => {
      setDatePickerTarget(target);
    });
  };

  const openTimePicker = (target: TimePickerTarget) => {
    Keyboard.dismiss();
    setDatePickerTarget(null);
    requestAnimationFrame(() => {
      setTimePickerTarget(target);
    });
  };

  const updateStartDate = (date: string) => {
    setDraft((current) => {
      const endDate =
        current.isAllDay &&
        compareDateStrings(current.endDate || current.startDate, date) >= 0
          ? current.endDate || current.startDate
          : date;

      return {
        ...current,
        startDate: date,
        endDate: current.isAllDay ? endDate : date,
      };
    });
  };

  const updateEndDate = (date: string) => {
    setDraft((current) => ({
      ...current,
      endDate:
        compareDateStrings(date, current.startDate) < 0
          ? current.startDate
          : date,
    }));
  };

  const updateSingleDate = (date: string) => {
    setDraft((current) => ({
      ...current,
      startDate: date,
      endDate: date,
    }));
  };

  const toggleAllDay = (value: boolean) => {
    setDraft((current) => {
      if (value) {
        return {
          ...current,
          isAllDay: true,
          endDate: current.startDate,
          startTime: undefined,
          endTime: undefined,
        };
      }

      const defaultRange = getDefaultTimeRange();

      return {
        ...current,
        isAllDay: false,
        endDate: current.startDate,
        startTime: current.startTime || defaultRange.startTime,
        endTime: current.endTime || defaultRange.endTime,
      };
    });
  };

  const confirmDate = (date: string) => {
    if (datePickerTarget === "start") {
      updateStartDate(date);
      if (draft.isAllDay) {
        setDatePickerTarget("end");
        return;
      }
    } else if (datePickerTarget === "end") {
      updateEndDate(date);
    } else {
      updateSingleDate(date);
    }

    setDatePickerTarget(null);
  };

  const confirmTimeRange = (startTime: string, endTime: string) => {
    setDraft((current) => ({
      ...current,
      startTime,
      endTime,
    }));
    setTimePickerTarget(null);
  };

  const handleSave = () => {
    Keyboard.dismiss();
    const validationError = validateSchedule(normalizedDraft);

    if (validationError) {
      setError(validationError);
      return;
    }

    onSave({
      ...normalizedDraft,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <FullScreenModalShell
        visible={visible}
        title="詳細"
        theme={theme}
        closeIcon="close"
        onClose={onClose}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="予定を保存"
            onPress={handleSave}
            style={({ pressed }) => [
              styles.headerSaveButton,
              pressed && styles.pressed,
            ]}>
            <Text
              style={[
                theme.typography.label,
                styles.headerSaveText,
                { color: theme.colors.primary },
              ]}>
              保存
            </Text>
          </Pressable>
        }>
        <View style={styles.dialogRoot}>
          <KeyboardAwareScrollView
            bottomOffset={32}
            contentContainerStyle={styles.body}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <InputField
                label="予定名"
                hideLabel
                theme={theme}
                value={draft.title}
                placeholder="一次面接、ES締切など"
                onChangeText={(value) => update("title", value)}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="予定の色を選択"
                onPress={() => setCategoryPickerVisible(true)}
                style={({ pressed }) => [
                  styles.categorySelectRow,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radii.md,
                    minHeight: theme.component.controlHeight,
                  },
                  pressed && styles.pressed,
                ]}>
                <View
                  style={[
                    styles.categorySelectDot,
                    { backgroundColor: selectedCategory.color },
                  ]}
                />
                <View style={styles.categorySelectBody}>
                  <Text
                    numberOfLines={1}
                    style={[
                      theme.typography.label,
                      styles.categorySelectName,
                      { color: theme.colors.textPrimary },
                    ]}>
                    {selectedCategory.name}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.textMuted}
                />
              </Pressable>

              <View
                style={[
                  styles.schedulePanel,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radii.md,
                    padding: theme.spacing.sm,
                  },
                ]}>
                <View style={styles.schedulePanelHeader}>
                  <Text
                    style={[
                      theme.typography.label,
                      styles.schedulePanelTitle,
                      { color: theme.colors.textPrimary },
                    ]}>
                    日程
                  </Text>
                  <View style={styles.allDayInline}>
                    <Text
                      style={[
                        theme.typography.footnote,
                        styles.allDayTitle,
                        { color: theme.colors.textPrimary },
                      ]}>
                      終日
                    </Text>
                    <AllDayToggle
                      value={draft.isAllDay}
                      theme={theme}
                      onValueChange={toggleAllDay}
                    />
                  </View>
                </View>

                {draft.isAllDay ? (
                  <View style={styles.dateCardRow}>
                    <DateValueCard
                      label=""
                      value={formatJapaneseDate(draft.startDate)}
                      theme={theme}
                      onPress={() => openDatePicker("start")}
                    />
                    <View style={styles.dateArrow}>
                      <Ionicons
                        color={theme.colors.textMuted}
                        name="arrow-forward"
                        size={18}
                      />
                    </View>
                    <DateValueCard
                      label=""
                      value={formatJapaneseDate(draft.endDate || draft.startDate)}
                      theme={theme}
                      onPress={() => openDatePicker("end")}
                    />
                  </View>
                ) : (
                  <View style={styles.dateCardRow}>
                    <TimedValueCard
                      label=""
                      date={formatJapaneseDate(draft.startDate)}
                      time={draft.startTime ?? ""}
                      theme={theme}
                      onPressDate={() => openDatePicker("single")}
                      onPressTime={() => openTimePicker("start")}
                    />
                    <View style={styles.dateArrow}>
                      <Ionicons
                        color={theme.colors.textMuted}
                        name="arrow-forward"
                        size={18}
                      />
                    </View>
                    <TimedValueCard
                      label=""
                      date={formatJapaneseDate(draft.startDate)}
                      time={draft.endTime ?? ""}
                      theme={theme}
                      onPressDate={() => openDatePicker("single")}
                      onPressTime={() => openTimePicker("end")}
                    />
                  </View>
                )}
              </View>

              <InputField
                label="メモ"
                theme={theme}
                value={draft.memo ?? ""}
                placeholder="持ち物、URL、補足など"
                multiline
                style={styles.memoInput}
                onChangeText={(value) => update("memo", value)}
              />

              {error ? (
                <Text
                  style={[
                    theme.typography.footnote,
                    styles.errorText,
                    { color: theme.colors.danger },
                  ]}>
                  {error}
                </Text>
              ) : null}
            </View>
          </KeyboardAwareScrollView>

          <DatePickerSheet
            visible={Boolean(datePickerTarget)}
            value={
              datePickerTarget === "end"
                ? draft.endDate || draft.startDate
                : draft.startDate
            }
            target={datePickerTarget}
            startDate={draft.startDate}
            endDate={draft.endDate || draft.startDate}
            isAllDay={draft.isAllDay}
            theme={theme}
            onClose={() => setDatePickerTarget(null)}
            onSelect={confirmDate}
          />

          <TimePickerSheet
            visible={Boolean(timePickerTarget)}
            startTime={draft.startTime || getDefaultTimeRange().startTime}
            endTime={draft.endTime || getDefaultTimeRange().endTime}
            theme={theme}
            onClose={() => setTimePickerTarget(null)}
            onSelect={confirmTimeRange}
          />
          <ScheduleCategoryPicker
            visible={categoryPickerVisible}
            categories={scheduleCategories}
            selectedCategoryId={draft.categoryId ?? null}
            theme={theme}
            onClose={() => setCategoryPickerVisible(false)}
            onSelectCategoryId={(categoryId) =>
              update("categoryId", categoryId)
            }
            onSaveCategory={onSaveScheduleCategory}
            onDeleteCategory={onDeleteScheduleCategory}
          />
        </View>
      </FullScreenModalShell>

    </>
  );
};

const DateValueCard = ({
  label,
  value,
  theme,
  onPress,
}: {
  label: string;
  value: string;
  theme: AppTheme;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [
      styles.dateValueCard,
      {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.md,
      },
      pressed && styles.pressed,
    ]}>
    {label ? (
      <Text
        style={[
          theme.typography.caption,
          styles.dateValueLabel,
          { color: theme.colors.textMuted },
        ]}>
        {label}
      </Text>
    ) : null}
    <Text
      numberOfLines={1}
      style={[
        theme.typography.label,
        styles.dateValueText,
        !label && styles.dateValueTextWithoutLabel,
        { color: theme.colors.textPrimary },
      ]}>
      {value}
    </Text>
  </Pressable>
);

const TimedValueCard = ({
  label,
  date,
  time,
  theme,
  onPressDate,
  onPressTime,
}: {
  label: string;
  date: string;
  time: string;
  theme: AppTheme;
  onPressDate: () => void;
  onPressTime: () => void;
}) => (
  <View
    style={[
      styles.timedValueCard,
      {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.md,
      },
    ]}>
    {label ? (
      <Text
        style={[
          theme.typography.caption,
          styles.dateValueLabel,
          { color: theme.colors.textMuted },
        ]}>
        {label}
      </Text>
    ) : null}
    <Pressable
      accessibilityRole="button"
      onPress={onPressDate}
      style={({ pressed }) => [styles.timedPressable, pressed && styles.pressed]}>
      <Text
        numberOfLines={1}
        style={[
          theme.typography.caption,
          styles.timedDateText,
          { color: theme.colors.textPrimary },
        ]}>
        {date}
      </Text>
    </Pressable>
    <Pressable
      accessibilityRole="button"
      onPress={onPressTime}
      style={({ pressed }) => [
        styles.timeButton,
        pressed && styles.pressed,
      ]}>
      <Text
        style={[
          theme.typography.title3,
          styles.timeButtonText,
          { color: theme.colors.textPrimary },
        ]}>
        {time}
      </Text>
    </Pressable>
  </View>
);

const AllDayToggle = ({
  value,
  theme,
  onValueChange,
}: {
  value: boolean;
  theme: AppTheme;
  onValueChange: (value: boolean) => void;
}) => (
  <Pressable
    accessibilityRole="switch"
    accessibilityState={{ checked: value }}
    accessibilityLabel="終日の切り替え"
    onPress={() => onValueChange(!value)}
    style={({ pressed }) => [
      styles.allDayToggle,
      {
        backgroundColor: value
          ? theme.colors.primary
          : theme.colors.surfaceSubtle,
        borderColor: value ? theme.colors.primary : theme.colors.border,
      },
      pressed && styles.pressed,
    ]}>
    <View
      style={[
        styles.allDayToggleThumb,
        {
          backgroundColor: value
            ? theme.colors.textOnPrimary
            : theme.colors.surface,
          borderColor: value ? theme.colors.textOnPrimary : theme.colors.border,
          transform: [{ translateX: value ? 20 : 0 }],
        },
      ]}
    />
  </Pressable>
);

const DatePickerSheet = ({
  visible,
  value,
  target,
  startDate,
  endDate,
  isAllDay,
  theme,
  onClose,
  onSelect,
}: {
  visible: boolean;
  value: string;
  target: DatePickerTarget | null;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  theme: AppTheme;
  onClose: () => void;
  onSelect: (value: string) => void;
}) => {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(value);
  const [monthDate, setMonthDate] = useState(startOfMonth(value));

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedDate(value);
    setMonthDate(startOfMonth(value));
  }, [value, visible]);

  if (!visible) {
    return null;
  }

  const days = buildMonthGrid(monthDate);
  const monthTitle = `${Number(monthDate.slice(0, 4))}年${Number(
    monthDate.slice(5, 7),
  )}月`;
  const showRangeStatus = isAllDay && target !== "single";

  return (
    <View
      style={[
        styles.pickerRoot,
        Platform.OS === "web" && styles.desktopPickerRoot,
      ]}>
      <Pressable
        accessibilityLabel="日付ピッカーを閉じる"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.colors.overlay },
        ]}
        onPress={onClose}
      />
      <View
        style={[
          styles.pickerSheet,
          Platform.OS === "web" && styles.desktopDatePickerSheet,
          theme.shadows.floating,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}>
        <View style={styles.pickerHeader}>
          <IconButton
            icon="chevron-back"
            label="前の月"
            onPress={() => setMonthDate((current) => addMonths(current, -1))}
            theme={theme}
            variant="plain"
          />
          <Text
            style={[
              theme.typography.label,
              styles.pickerTitle,
              { color: theme.colors.textPrimary },
            ]}>
            {monthTitle}
          </Text>
          <IconButton
            icon="chevron-forward"
            label="次の月"
            onPress={() => setMonthDate((current) => addMonths(current, 1))}
            theme={theme}
            variant="plain"
          />
        </View>
        {showRangeStatus ? (
          <View style={styles.pickerStatusBlock}>
            <View style={styles.dateRangeStatusRow}>
              {[
                { key: "start", label: "開始", date: startDate },
                { key: "end", label: "終了", date: endDate },
              ].map((item) => {
                const active = target === item.key;

                return (
                  <View
                    key={item.key}
                    style={[
                      styles.dateRangeStatusChip,
                      {
                        backgroundColor: active
                          ? theme.colors.primarySubtle
                          : theme.colors.surfaceElevated,
                        borderColor: active
                          ? theme.colors.primaryBorder
                          : theme.colors.border,
                      },
                    ]}>
                    <Text
                      numberOfLines={1}
                      style={[
                        theme.typography.caption,
                        styles.dateRangeStatusLabel,
                        {
                          color: active
                            ? theme.colors.primary
                            : theme.colors.textMuted,
                        },
                      ]}>
                      {item.label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        theme.typography.caption,
                        styles.dateRangeStatusValue,
                        {
                          color: active
                            ? theme.colors.primary
                            : theme.colors.textSecondary,
                        },
                      ]}>
                      {formatJapaneseDate(item.date)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
        <View style={styles.pickerMonthControls}>
          <View style={styles.weekRow}>
            {weekdays.map((weekday, index) => (
              <Text
                key={weekday}
                style={[
                  theme.typography.caption,
                  styles.pickerWeekday,
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
          <View style={styles.datePickerGrid}>
            {days.map((date) => {
              const selected = date === selectedDate;
              const inMonth = date.slice(0, 7) === monthDate.slice(0, 7);
              const weekday = new Date(
                Number(date.slice(0, 4)),
                Number(date.slice(5, 7)) - 1,
                Number(date.slice(8, 10)),
              ).getDay();

              return (
                <Pressable
                  key={date}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setSelectedDate(date);
                    onSelect(date);
                  }}
                  style={({ pressed }) => [
                    styles.datePickerCell,
                    pressed && styles.pressed,
                  ]}>
                  <View
                    style={[
                      styles.datePickerCircle,
                      selected && {
                        backgroundColor: theme.colors.textPrimary,
                      },
                    ]}>
                    <Text
                      style={[
                        theme.typography.label,
                        styles.datePickerDayText,
                        {
                          color: selected
                            ? theme.colors.surface
                            : !inMonth
                              ? theme.colors.textDisabled
                              : weekday === 0
                                ? theme.colors.danger
                                : weekday === 6
                                  ? theme.colors.primary
                                  : theme.colors.textPrimary,
                        },
                      ]}>
                      {Number(date.slice(8, 10))}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const TimePreviewGroup = ({
  label,
  hour,
  minute,
  activeHour,
  activeMinute,
  theme,
  onPressHour,
  onPressMinute,
}: {
  label: string;
  hour: string;
  minute: string;
  activeHour: boolean;
  activeMinute: boolean;
  theme: AppTheme;
  onPressHour: () => void;
  onPressMinute: () => void;
}) => (
  <View style={styles.timePreviewPair}>
    <Text
      style={[
        theme.typography.caption,
        styles.timeKeypadLabel,
        { color: theme.colors.textMuted },
      ]}>
      {label}
    </Text>
    <View style={styles.timePreviewParts}>
      <TimePreviewPart
        label="時"
        value={hour}
        active={activeHour}
        theme={theme}
        onPress={onPressHour}
      />
      <Text style={[styles.timePreviewSeparator, { color: theme.colors.textMuted }]}>
        :
      </Text>
      <TimePreviewPart
        label="分"
        value={minute}
        active={activeMinute}
        theme={theme}
        onPress={onPressMinute}
      />
    </View>
  </View>
);

const TimePreviewPart = ({
  label,
  value,
  active,
  theme,
  onPress,
}: {
  label: string;
  value: string;
  active: boolean;
  theme: AppTheme;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${label}を入力`}
    accessibilityState={{ selected: active }}
    onPress={onPress}
    style={({ pressed }) => [
      styles.timePreviewPart,
      {
        backgroundColor: active ? theme.colors.surfaceElevated : "transparent",
        borderBottomColor: active
          ? theme.colors.textPrimary
          : theme.colors.divider,
      },
      pressed && styles.pressed,
    ]}>
    <Text
      style={[
        theme.typography.title2,
        styles.timePreviewTime,
        {
          color: active ? theme.colors.textPrimary : theme.colors.textMuted,
        },
      ]}>
      {value}
    </Text>
    <Text
      style={[
        theme.typography.caption,
        styles.timePreviewUnit,
        {
          color: active ? theme.colors.textSecondary : theme.colors.textMuted,
        },
      ]}>
      {label}
    </Text>
  </Pressable>
);

type TimePickerSheetProps = {
  visible: boolean;
  startTime: string;
  endTime: string;
  theme: AppTheme;
  onClose: () => void;
  onSelect: (startTime: string, endTime: string) => void;
};

const TimePickerSheet = (props: TimePickerSheetProps) =>
  Platform.OS === "web" ? (
    <DesktopTimePickerDialog {...props} />
  ) : (
    <MobileTimePickerSheet {...props} />
  );

const DesktopTimePickerDialog = ({
  visible,
  startTime,
  endTime,
  theme,
  onClose,
  onSelect,
}: TimePickerSheetProps) => {
  const startInputRef = useRef<TextInput>(null);
  const endInputRef = useRef<TextInput>(null);
  const [startText, setStartText] = useState(startTime);
  const [endText, setEndText] = useState(endTime);
  const [focusedField, setFocusedField] = useState<"start" | "end" | null>(
    null,
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    setStartText(startTime);
    setEndText(endTime);
    requestAnimationFrame(() => {
      startInputRef.current?.focus();
    });
  }, [endTime, startTime, visible]);

  if (!visible) {
    return null;
  }

  const getNormalizedRange = (
    nextStartText = startText,
    nextEndText = endText,
  ) => {
    const normalizedStart = normalizeTimeText(nextStartText, startTime);
    const normalizedEnd = normalizeTimeText(nextEndText, endTime);
    const startValue = parseTimeValue(normalizedStart);
    const endValue = parseTimeValue(normalizedEnd);
    const correctedEnd =
      compareTimeValues(endValue, startValue) < 0
        ? normalizedStart
        : normalizedEnd;

    return {
      start: normalizedStart,
      end: correctedEnd,
    };
  };

  const applyNormalizedText = () => {
    const normalized = getNormalizedRange();
    setStartText(normalized.start);
    setEndText(normalized.end);

    return normalized;
  };

  const submit = () => {
    const normalized = applyNormalizedText();
    onSelect(normalized.start, normalized.end);
  };

  const setDuration = (durationMinutes: number) => {
    const normalizedStart = normalizeTimeText(startText, startTime);
    const startValue = parseTimeValue(normalizedStart);
    const nextEnd = formatTimeValue(
      fromMinutes(toMinutes(startValue) + durationMinutes),
    );

    setStartText(normalizedStart);
    setEndText(nextEnd);
  };

  const shiftRange = (minutes: number) => {
    const normalized = getNormalizedRange();
    const startValue = parseTimeValue(normalized.start);
    const endValue = parseTimeValue(normalized.end);

    setStartText(formatTimeValue(fromMinutes(toMinutes(startValue) + minutes)));
    setEndText(formatTimeValue(fromMinutes(toMinutes(endValue) + minutes)));
  };

  const handleKey = (key: string) => {
    if (key === "Enter") {
      submit();
    } else if (key === "Escape") {
      onClose();
    }
  };

  return (
    <View style={[styles.pickerRoot, styles.desktopPickerRoot]}>
      <Pressable
        accessibilityLabel="時刻ピッカーを閉じる"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.colors.overlay },
        ]}
        onPress={onClose}
      />
      <View
        style={[
          styles.desktopTimeDialog,
          theme.shadows.floating,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <View
          style={[
            styles.desktopTimeHeader,
            { borderBottomColor: theme.colors.divider },
          ]}>
          <Text
            style={[
              theme.typography.label,
              styles.desktopTimeTitle,
              { color: theme.colors.textPrimary },
            ]}>
            時刻を編集
          </Text>
          <IconButton
            icon="close"
            label="時刻ピッカーを閉じる"
            onPress={onClose}
            theme={theme}
            size="compact"
            variant="plain"
          />
        </View>

        <View style={styles.desktopTimeBody}>
          <View style={styles.desktopTimeFields}>
            <View style={styles.desktopTimeField}>
              <Text
                style={[
                  theme.typography.caption,
                  styles.desktopTimeLabel,
                  { color: theme.colors.textMuted },
                ]}>
                開始
              </Text>
              <TextInput
                ref={startInputRef}
                accessibilityLabel="開始時刻"
                inputMode="numeric"
                placeholder="09:00"
                placeholderTextColor={theme.colors.placeholder}
                selectTextOnFocus
                value={startText}
                onBlur={() => {
                  setFocusedField(null);
                  setStartText((current) => normalizeTimeText(current, startTime));
                }}
                onChangeText={(value) => setStartText(sanitizeTimeText(value))}
                onFocus={() => setFocusedField("start")}
                onKeyPress={(event) => handleKey(event.nativeEvent.key)}
                onSubmitEditing={() => endInputRef.current?.focus()}
                style={[
                  styles.desktopTimeInput,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor:
                      focusedField === "start"
                        ? theme.colors.focusRing
                        : theme.colors.border,
                    borderRadius: theme.radii.sm,
                    color: theme.colors.textPrimary,
                  },
                ]}
              />
            </View>

            <Ionicons
              color={theme.colors.textMuted}
              name="arrow-forward"
              size={18}
            />

            <View style={styles.desktopTimeField}>
              <Text
                style={[
                  theme.typography.caption,
                  styles.desktopTimeLabel,
                  { color: theme.colors.textMuted },
                ]}>
                終了
              </Text>
              <TextInput
                ref={endInputRef}
                accessibilityLabel="終了時刻"
                inputMode="numeric"
                placeholder="10:00"
                placeholderTextColor={theme.colors.placeholder}
                selectTextOnFocus
                value={endText}
                onBlur={() => {
                  setFocusedField(null);
                  setEndText((current) => normalizeTimeText(current, endTime));
                }}
                onChangeText={(value) => setEndText(sanitizeTimeText(value))}
                onFocus={() => setFocusedField("end")}
                onKeyPress={(event) => handleKey(event.nativeEvent.key)}
                onSubmitEditing={submit}
                style={[
                  styles.desktopTimeInput,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor:
                      focusedField === "end"
                        ? theme.colors.focusRing
                        : theme.colors.border,
                    borderRadius: theme.radii.sm,
                    color: theme.colors.textPrimary,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.desktopTimeQuickRows}>
            <View style={styles.desktopQuickRow}>
              {[30, 60, 90, 120].map((minutes) => (
                <Pressable
                  key={minutes}
                  accessibilityRole="button"
                  onPress={() => setDuration(minutes)}
                  style={({ pressed }) => [
                    styles.desktopQuickChip,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      theme.typography.caption,
                      styles.desktopQuickChipText,
                      { color: theme.colors.textSecondary },
                    ]}>
                    {minutes === 60
                      ? "1時間"
                      : minutes === 120
                        ? "2時間"
                        : `${minutes}分`}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.desktopQuickRow}>
              {[-15, 15].map((minutes) => (
                <Pressable
                  key={minutes}
                  accessibilityRole="button"
                  onPress={() => shiftRange(minutes)}
                  style={({ pressed }) => [
                    styles.desktopShiftButton,
                    {
                      borderColor: theme.colors.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons
                    color={theme.colors.textSecondary}
                    name={minutes < 0 ? "remove" : "add"}
                    size={16}
                  />
                  <Text
                    style={[
                      theme.typography.caption,
                      styles.desktopShiftText,
                      { color: theme.colors.textSecondary },
                    ]}>
                    15分
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View
          style={[
            styles.desktopTimeActions,
            { borderTopColor: theme.colors.divider },
          ]}>
          <AppButton
            label="キャンセル"
            onPress={onClose}
            theme={theme}
            variant="ghost"
          />
          <AppButton label="適用" onPress={submit} theme={theme} />
        </View>
      </View>
    </View>
  );
};

const MobileTimePickerSheet = ({
  visible,
  startTime,
  endTime,
  theme,
  onClose,
  onSelect,
}: {
  visible: boolean;
  startTime: string;
  endTime: string;
  theme: AppTheme;
  onClose: () => void;
  onSelect: (startTime: string, endTime: string) => void;
}) => {
  const insets = useSafeAreaInsets();
  const [startValue, setStartValue] = useState(() =>
    parseTimeValue(startTime),
  );
  const [endValue, setEndValue] = useState(() => parseTimeValue(endTime));
  // Four independent fields share one keypad; phase identifies which field
  // receives the next digit, and buffer keeps the first digit of a two-digit edit.
  const [phase, setPhase] = useState<TimeInputPhase>("startHour");
  const [buffer, setBuffer] = useState("");
  useEffect(() => {
    if (!visible) {
      return;
    }

    const nextStart = parseTimeValue(startTime);
    const nextEnd = parseTimeValue(endTime);
    setStartValue(nextStart);
    setEndValue(nextEnd);
    setPhase("startHour");
    setBuffer("");
  }, [endTime, startTime, visible]);

  if (!visible) {
    return null;
  }

  const closeWithValues = (
    nextStart = startValue,
    nextEnd = endValue,
  ) => {
    const correctedEnd =
      compareTimeValues(nextEnd, nextStart) < 0 ? nextStart : nextEnd;
    onSelect(formatTimeValue(nextStart), formatTimeValue(correctedEnd));
  };

  const focusField = (nextPhase: TimeInputPhase) => {
    setPhase(nextPhase);
    setBuffer("");
  };

  const pressKey = (key: string) => {
    let nextStart = { ...startValue };
    let nextEnd = { ...endValue };
    let nextPhase = phase;
    let nextBuffer = buffer;
    let shouldClose = false;

    const clampEnd = () => {
      if (compareTimeValues(nextEnd, nextStart) < 0) {
        nextEnd = { ...nextStart };
      }
    };

    const completeHour = (hour: number) => {
      const nextHour = Math.min(Math.max(hour, 0), 23);

      if (nextPhase === "startHour") {
        nextStart = { ...nextStart, hour: nextHour };
        nextPhase = "startMinute";
      } else if (nextPhase === "endHour") {
        nextEnd = { ...nextEnd, hour: nextHour };
        clampEnd();
        nextPhase = "endMinute";
      }

      nextBuffer = "";
    };

    const completeMinute = (minute: number) => {
      const nextMinute = Math.min(Math.max(minute, 0), 59);

      if (nextPhase === "startMinute") {
        nextStart = { ...nextStart, minute: nextMinute };
        nextPhase = "endHour";
      } else if (nextPhase === "endMinute") {
        nextEnd = { ...nextEnd, minute: nextMinute };
        clampEnd();
        shouldClose = true;
      }

      nextBuffer = "";
    };

    const previewHour = (digit: string) => {
      const nextHour = Number(digit);

      if (nextPhase === "startHour") {
        nextStart = { ...nextStart, hour: nextHour };
      } else if (nextPhase === "endHour") {
        nextEnd = { ...nextEnd, hour: nextHour };
        clampEnd();
      }
    };

    const previewMinute = (digit: string) => {
      const nextMinute = Number(digit);

      if (nextPhase === "startMinute") {
        nextStart = { ...nextStart, minute: nextMinute };
      } else if (nextPhase === "endMinute") {
        nextEnd = { ...nextEnd, minute: nextMinute };
        clampEnd();
      }
    };

    const inputMinuteDigit = (digit: string) => {
      const value = Number(digit);

      if (!nextBuffer && value >= 6) {
        completeMinute(value);
        return;
      }

      if (!nextBuffer) {
        nextBuffer = digit;
        previewMinute(digit);
        return;
      }

      completeMinute(Number(`${nextBuffer}${digit}`));
    };

    if (nextPhase === "startHour" || nextPhase === "endHour") {
      if (key === "00" || key === "30") {
        return;
      }

      if (!nextBuffer) {
        const value = Number(key);

        if (value >= 3) {
          completeHour(value);
        } else {
          nextBuffer = key;
          previewHour(key);
        }
      } else if (nextBuffer === "2" && Number(key) >= 4) {
        completeHour(2);
        inputMinuteDigit(key);
      } else {
        completeHour(Number(`${nextBuffer}${key}`));
      }
    } else {
      if (key === "00" || key === "30") {
        completeMinute(Number(key));
      } else {
        inputMinuteDigit(key);
      }
    }

    setStartValue(nextStart);
    setEndValue(nextEnd);
    setPhase(nextPhase);
    setBuffer(nextBuffer);

    if (shouldClose) {
      requestAnimationFrame(() => {
        closeWithValues(nextStart, nextEnd);
      });
    }
  };

  const startHourValue = getFieldValue(
    phase,
    buffer,
    "startHour",
    startValue.hour,
  );
  const startMinuteValue = getFieldValue(
    phase,
    buffer,
    "startMinute",
    startValue.minute,
  );
  const endHourDisplay =
    phase === "endHour" &&
    buffer.length === 1 &&
    endValue.hour === Number(buffer)
      ? `0${buffer}`
      : `${endValue.hour}`.padStart(2, "0");
  const endMinuteDisplay =
    phase === "endMinute" &&
    buffer.length === 1 &&
    endValue.minute === Number(buffer)
      ? `0${buffer}`
      : `${endValue.minute}`.padStart(2, "0");

  return (
    <View style={styles.pickerRoot}>
      <Pressable
        accessibilityLabel="時刻ピッカーを閉じる"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.colors.overlay },
        ]}
        onPress={onClose}
      />
      <View
        style={[
          styles.timeKeypadSheet,
          theme.shadows.floating,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}>
        <View
          style={[
            styles.timeKeypadHeader,
            { borderBottomColor: theme.colors.divider },
          ]}>
          <View style={styles.timePreviewGroup}>
            <TimePreviewGroup
              label="開始"
              hour={startHourValue}
              minute={startMinuteValue}
              activeHour={phase === "startHour"}
              activeMinute={phase === "startMinute"}
              theme={theme}
              onPressHour={() => focusField("startHour")}
              onPressMinute={() => focusField("startMinute")}
            />
            <Ionicons
              color={theme.colors.textMuted}
              name="chevron-forward"
              size={22}
            />
            <TimePreviewGroup
              label="終了"
              hour={endHourDisplay}
              minute={endMinuteDisplay}
              activeHour={phase === "endHour"}
              activeMinute={phase === "endMinute"}
              theme={theme}
              onPressHour={() => focusField("endHour")}
              onPressMinute={() => focusField("endMinute")}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => closeWithValues()}
            style={({ pressed }) => [
              styles.doneButton,
              pressed && styles.pressed,
            ]}>
            <Text
              style={[
                theme.typography.label,
                styles.doneText,
                { color: theme.colors.primary },
              ]}>
              完了
            </Text>
          </Pressable>
        </View>
        <View style={styles.timeKeypadGrid}>
          {timeKeyRows.map((row, rowIndex) => (
            <View key={row.join("-")} style={styles.timeKeypadRow}>
              {row.map((key, keyIndex) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={`${key}を入力`}
                  onPress={() => pressKey(key)}
                  style={({ pressed }) => [
                    styles.timeKey,
                    {
                      borderColor: theme.colors.divider,
                      borderLeftWidth:
                        keyIndex === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopWidth:
                        rowIndex === 0 ? 0 : StyleSheet.hairlineWidth,
                    },
                    pressed && {
                      backgroundColor: theme.colors.surfacePressed,
                    },
                  ]}>
                  <Text
                    style={[styles.timeKeyText, { color: theme.colors.textPrimary }]}>
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dialogRoot: {
    flex: 1,
  },
  body: {
    alignSelf: "center",
    maxWidth: 760,
    paddingBottom: 22,
    paddingHorizontal: 16,
    paddingTop: 14,
    width: "100%",
  },
  form: {
    gap: 14,
  },
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: "92%",
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    borderRadius: 999,
    height: 5,
    marginTop: 10,
    width: 44,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 56,
    paddingHorizontal: 14,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
  },
  headerSaveButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    minWidth: 44,
  },
  headerSaveText: {
    fontWeight: "800",
  },
  content: {
    gap: 16,
    padding: 16,
  },
  categorySelectRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 14,
  },
  categorySelectDot: {
    borderRadius: 999,
    height: 18,
    width: 18,
  },
  categorySelectBody: {
    flex: 1,
    minWidth: 0,
  },
  categorySelectLabel: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
  },
  categorySelectName: {
    fontWeight: "800",
    marginTop: 2,
  },
  schedulePanel: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    padding: 12,
  },
  schedulePanelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  schedulePanelTitle: {
    fontWeight: "800",
  },
  allDayInline: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  allDayTitle: {
    fontWeight: "800",
  },
  allDayToggle: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 26,
    justifyContent: "center",
    padding: 2,
    width: 46,
  },
  allDayToggleThumb: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 20,
    width: 20,
  },
  dateCardRow: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 8,
  },
  dateArrow: {
    alignItems: "center",
    justifyContent: "center",
    width: 22,
  },
  dateValueCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 50,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  timedValueCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 4,
    minHeight: 62,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateValueLabel: {
    fontWeight: "800",
  },
  dateValueText: {
    fontWeight: "800",
    marginTop: 6,
  },
  dateValueTextWithoutLabel: {
    marginTop: 0,
  },
  timedPressable: {
    minHeight: 22,
    justifyContent: "center",
  },
  timedDateText: {
    fontWeight: "800",
  },
  timeButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 26,
  },
  timeButtonText: {
    fontWeight: "700",
  },
  memoInput: {
    minHeight: 96,
  },
  errorText: {
    fontWeight: "700",
  },
  pickerRoot: {
    ...StyleSheet.absoluteFillObject,
    elevation: 20,
    justifyContent: "flex-end",
    zIndex: 20,
  },
  desktopPickerRoot: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  pickerSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: "82%",
    paddingHorizontal: 16,
    paddingTop: 10,
    width: "100%",
  },
  desktopDatePickerSheet: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxWidth: 420,
  },
  timeKeypadSheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: "72%",
    paddingTop: 0,
    width: "100%",
  },
  desktopTimeDialog: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 440,
    overflow: "hidden",
    width: "100%",
  },
  desktopTimeHeader: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 58,
    paddingHorizontal: 16,
  },
  desktopTimeTitle: {
    fontWeight: "800",
  },
  desktopTimeBody: {
    gap: 16,
    padding: 16,
  },
  desktopTimeFields: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 12,
  },
  desktopTimeField: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  desktopTimeLabel: {
    fontWeight: "800",
  },
  desktopTimeInput: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 24,
    fontWeight: "700",
    height: 54,
    paddingHorizontal: 14,
    textAlign: "center",
  },
  desktopTimeQuickRows: {
    gap: 10,
  },
  desktopQuickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  desktopQuickChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 34,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  desktopQuickChipText: {
    fontWeight: "800",
  },
  desktopShiftButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 4,
    minHeight: 34,
    paddingHorizontal: 12,
  },
  desktopShiftText: {
    fontWeight: "800",
  },
  desktopTimeActions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    padding: 16,
  },
  pickerHeader: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 44,
  },
  pickerTitle: {
    flex: 1,
    fontWeight: "800",
    textAlign: "center",
  },
  pickerHeaderSpacer: {
    width: 44,
  },
  pickerStatusBlock: {
    paddingTop: 2,
  },
  dateRangeStatusRow: {
    flexDirection: "row",
    gap: 6,
  },
  dateRangeStatusChip: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  dateRangeStatusLabel: {
    fontWeight: "800",
  },
  dateRangeStatusValue: {
    fontWeight: "800",
  },
  doneButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    minWidth: 44,
    paddingHorizontal: 4,
  },
  doneText: {
    fontWeight: "800",
  },
  pickerMonthControls: {
    paddingTop: 4,
  },
  weekRow: {
    flexDirection: "row",
    paddingBottom: 4,
  },
  pickerWeekday: {
    flex: 1,
    fontWeight: "800",
    textAlign: "center",
  },
  datePickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 6,
  },
  datePickerCell: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: `${100 / 7}%`,
  },
  datePickerCircle: {
    alignItems: "center",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  datePickerDayText: {
    fontWeight: "800",
  },
  timeKeypadHeader: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  timeKeypadLabel: {
    fontWeight: "700",
  },
  timePreviewGroup: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minWidth: 0,
  },
  timePreviewPair: {
    flex: 1,
    minWidth: 0,
  },
  timePreviewParts: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    marginTop: 3,
  },
  timePreviewPart: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    flex: 1,
    minHeight: 40,
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  timePreviewTime: {
    fontWeight: "600",
    textAlign: "center",
  },
  timePreviewSeparator: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 24,
  },
  timePreviewUnit: {
    fontWeight: "700",
    marginTop: 1,
  },
  timeKeypadGrid: {
    width: "100%",
  },
  timeKeypadRow: {
    flexDirection: "row",
  },
  timeKey: {
    alignItems: "center",
    flex: 1,
    height: 68,
    justifyContent: "center",
  },
  timeKeyText: {
    fontSize: 25,
    fontWeight: "400",
    lineHeight: 31,
  },
  warningRoot: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  warningCard: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 16,
    maxWidth: 460,
    padding: 20,
    width: "100%",
  },
  warningTitle: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23,
  },
  warningList: {
    gap: 8,
  },
  warningItem: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  warningActions: {
    flexDirection: "row",
    gap: 10,
  },
  pressed: {
    opacity: 0.72,
  },
});
