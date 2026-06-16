import { Ionicons } from "@expo/vector-icons";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppTheme } from "../../../constants/theme";
import { AppButton } from "../../../ui/AppButton";
import { DismissKeyboardView } from "../../../ui/DismissKeyboardView";
import { IconButton } from "../../../ui/IconButton";
import { InputField } from "../../../ui/InputField";
import { ModalCloseButton } from "../../../ui/ModalCloseButton";
import { useKeyboardInset } from "../../../ui/useKeyboardInset";
import {
  ApplicationType,
  Company,
  CompanyDraft,
  CompanyEditorDraft,
  CompanyQuestionAnswer,
  CompanySchedule,
  QuestionLabel,
  QuestionMemo,
  ScheduleCategory,
  ScheduleCategoryDraft,
  SelectionStatus,
} from "../types";
import { getStatusList, normalizeSelectionStatus } from "../utils/companyUtils";
import { getScheduleCategoryPresentation } from "../utils/scheduleCategoryUtils";
import { formatScheduleTime, sortSchedules } from "../utils/scheduleUtils";
import { QuestionMemoDialog } from "./QuestionMemoDialog";
import { ScheduleEditorDialog } from "./ScheduleEditorDialog";
import { SelectionStatusPickerSheet } from "./SelectionStatusPickerSheet";

type CompanyEditorModalProps = {
  visible: boolean;
  type: ApplicationType;
  company?: Company | null;
  copySourceCompany?: Company | null;
  questionMemos: QuestionMemo[];
  schedules: CompanySchedule[];
  allSchedules: CompanySchedule[];
  companies: Company[];
  scheduleCategories: ScheduleCategory[];
  questionLabels: QuestionLabel[];
  theme: AppTheme;
  allowPasswordStorage: boolean;
  onClose: () => void;
  onSave: (draft: CompanyEditorDraft) => Promise<void>;
  onCreateQuestionLabel: (name: string) => Promise<QuestionLabel>;
  onSaveScheduleCategory: (
    category: ScheduleCategoryDraft | ScheduleCategory,
  ) => Promise<ScheduleCategory>;
  onDeleteScheduleCategory: (categoryId: string) => Promise<void>;
};

type FormState = CompanyDraft;

const createDraftId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyForm = (type: ApplicationType): FormState => ({
  id: createDraftId("company"),
  type,
  companyName: "",
  status: getStatusList(type)[0],
  loginId: "",
  password: "",
  myPageUrl: "",
  industry: "",
  role: "",
  tags: [],
  questionAnswers: [],
  memo: "",
  favorite: false,
  archived: false,
});

const createCopiedForm = (
  source: Company,
  type: ApplicationType,
  allowPasswordStorage: boolean,
): FormState => ({
  id: createDraftId("company"),
  type,
  companyName: source.companyName,
  status: getStatusList(type)[0],
  loginId: source.loginId,
  password: allowPasswordStorage ? source.password : "",
  myPageUrl: source.myPageUrl ?? "",
  industry: source.industry ?? "",
  role: source.role ?? "",
  tags: source.tags,
  questionAnswers: [],
  memo: source.memo ?? "",
  favorite: false,
  archived: false,
});

export const CompanyEditorModal = ({
  visible,
  type,
  company,
  copySourceCompany,
  questionMemos,
  schedules: companySchedules,
  allSchedules,
  companies,
  scheduleCategories,
  questionLabels,
  theme,
  allowPasswordStorage,
  onClose,
  onSave,
  onCreateQuestionLabel,
  onSaveScheduleCategory,
  onDeleteScheduleCategory,
}: CompanyEditorModalProps) => {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset();
  const { height: windowHeight } = useWindowDimensions();
  const [form, setForm] = useState<FormState>(createEmptyForm(type));
  const [schedules, setSchedules] = useState<CompanySchedule[]>([]);
  const [tagText, setTagText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);
  const [editingQuestionAnswer, setEditingQuestionAnswer] =
    useState<CompanyQuestionAnswer | null>(null);
  const [editingSchedule, setEditingSchedule] =
    useState<CompanySchedule | null>(null);
  const [scheduleEditorVisible, setScheduleEditorVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(visible);
  const companyNameInputRef = useRef<TextInput>(null);
  const isClosingRef = useRef(false);
  const wasVisibleRef = useRef(false);
  const topInset = Math.max(insets.top + 6, 14);
  const enterOffset = Math.min(Math.max(windowHeight * 0.045, 28), 48);
  const dismissDistance = Math.max(
    windowHeight - topInset + insets.bottom + 36,
    420,
  );
  const closeThreshold = Math.min(windowHeight * 0.5, dismissDistance - 96);
  const minimumDismissDrag = Math.max(52, closeThreshold * 0.22);
  const maxInertiaDistance = Math.min(
    dismissDistance * 0.32,
    windowHeight * 0.26,
  );
  const translateY = useSharedValue(enterOffset);
  const presentProgress = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const isDismissing = useSharedValue(false);

  const typeTheme = theme.applicationTypes[form.type];
  const statusOptions = useMemo(() => getStatusList(form.type), [form.type]);

  const resetMotionState = useCallback(() => {
    cancelAnimation(translateY);
    cancelAnimation(presentProgress);
    cancelAnimation(dragStartY);
    cancelAnimation(isDismissing);
    translateY.value = 0;
    presentProgress.value = 0;
    dragStartY.value = 0;
    isDismissing.value = false;
  }, [dragStartY, isDismissing, presentProgress, translateY]);

  const resetTransientState = useCallback(() => {
    resetMotionState();
    setShowPassword(false);
    setError(null);
    setIsSaving(false);
    setIsStatusPickerOpen(false);
    setEditingQuestionAnswer(null);
    setEditingSchedule(null);
    setScheduleEditorVisible(false);
  }, [resetMotionState]);

  const backdropStyle = useAnimatedStyle(() => {
    const dragFade = interpolate(
      translateY.value,
      [0, closeThreshold, dismissDistance],
      [1, 0.78, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity: presentProgress.value * dragFade,
    };
  });

  const sheetStyle = useAnimatedStyle(() => {
    const restingScale = interpolate(
      presentProgress.value,
      [0, 1],
      [0.992, 1],
      Extrapolation.CLAMP,
    );
    const dragScale = interpolate(
      translateY.value,
      [0, closeThreshold, dismissDistance],
      [1, 0.998, 0.99],
      Extrapolation.CLAMP,
    );

    return {
      opacity: interpolate(
        presentProgress.value,
        [0, 1],
        [0, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        { translateY: translateY.value },
        { scale: Math.min(restingScale, dragScale) },
      ],
    };
  });

  const handleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, closeThreshold, dismissDistance],
      [0.56, 0.86, 0.34],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scaleX: interpolate(
          translateY.value,
          [0, closeThreshold, dismissDistance],
          [1, 1.14, 0.92],
          Extrapolation.CLAMP,
        ),
      },
      {
        scaleY: interpolate(
          translateY.value,
          [0, closeThreshold, dismissDistance],
          [1, 1.05, 0.94],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const openSheet = useCallback(() => {
    isClosingRef.current = false;
    cancelAnimation(translateY);
    cancelAnimation(presentProgress);
    translateY.value = enterOffset;
    dragStartY.value = 0;
    isDismissing.value = false;
    presentProgress.value = 0;
    translateY.value = withTiming(0, {
      duration: 280,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    presentProgress.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [dragStartY, enterOffset, isDismissing, presentProgress, translateY]);

  const finishClose = useCallback(() => {
    setIsRendered(false);
    isClosingRef.current = false;
    onClose();

    setIsSaving(false);
  }, [onClose]);

  const resetClosingState = useCallback(() => {
    isClosingRef.current = false;
    isDismissing.value = false;
    setIsSaving(false);
  }, [isDismissing]);

  const startCloseAnimation = useCallback(
    (velocityY = 0) => {
      cancelAnimation(translateY);
      cancelAnimation(presentProgress);
      isDismissing.value = true;

      const distanceRatio = Math.min(
        Math.max(translateY.value / dismissDistance, 0),
        1,
      );
      const duration = Math.min(
        Math.max(
          170,
          252 -
            distanceRatio * 54 -
            Math.min(Math.max(velocityY, 0), 1800) / 40,
        ),
        252,
      );

      presentProgress.value = withTiming(0, {
        duration: Math.max(150, Math.round(duration * 0.78)),
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(
        dismissDistance,
        {
          duration: Math.round(duration),
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        },
        (finished) => {
          if (finished) {
            runOnJS(finishClose)();
            return;
          }

          runOnJS(resetClosingState)();
        },
      );
    },
    [
      dismissDistance,
      finishClose,
      isDismissing,
      presentProgress,
      resetClosingState,
      translateY,
    ],
  );

  const requestClose = useCallback(
    (velocityY = 0) => {
      if (isClosingRef.current) {
        return;
      }

      isClosingRef.current = true;
      Keyboard.dismiss();
      startCloseAnimation(velocityY);
    },
    [startCloseAnimation],
  );

  const headerPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .maxPointers(1)
        .activeOffsetY(12)
        .failOffsetX([-72, 72])
        .shouldCancelWhenOutside(false)
        .enableTrackpadTwoFingerGesture(true)
        .onStart(() => {
          cancelAnimation(translateY);
          dragStartY.value = translateY.value;
        })
        .onUpdate((event) => {
          const nextTranslate = dragStartY.value + event.translationY;

          if (nextTranslate <= 0) {
            translateY.value = 0;
            return;
          }

          if (nextTranslate >= dismissDistance) {
            translateY.value =
              dismissDistance + (nextTranslate - dismissDistance) * 0.14;
            return;
          }

          translateY.value = nextTranslate;
        })
        .onEnd((event, success) => {
          if (!success) {
            dragStartY.value = 0;
            isDismissing.value = false;
            translateY.value = withSpring(0, {
              damping: 28,
              stiffness: 280,
              mass: 0.92,
              overshootClamping: true,
            });
            return;
          }

          const releaseVelocityY = Math.max(0, event.velocityY);
          const inertiaDistance = Math.min(
            releaseVelocityY * 0.18,
            maxInertiaDistance,
          );
          const projectedTranslateY = translateY.value + inertiaDistance;
          const shouldDismiss =
            translateY.value >= closeThreshold ||
            (translateY.value >= minimumDismissDrag &&
              projectedTranslateY >= closeThreshold);

          dragStartY.value = 0;

          if (shouldDismiss) {
            isDismissing.value = true;
            runOnJS(requestClose)(releaseVelocityY);
            return;
          }

          isDismissing.value = false;
          translateY.value = withSpring(0, {
            damping: 28,
            stiffness: 280,
            mass: 0.92,
            velocity: releaseVelocityY,
            overshootClamping: true,
          });
        })
        .onFinalize(() => {
          if (!isDismissing.value && translateY.value > 0) {
            translateY.value = withSpring(0, {
              damping: 28,
              stiffness: 280,
              mass: 0.92,
              overshootClamping: true,
            });
          }

          dragStartY.value = 0;
        }),
    [
      closeThreshold,
      dismissDistance,
      dragStartY,
      isDismissing,
      maxInertiaDistance,
      minimumDismissDrag,
      requestClose,
      translateY,
    ],
  );

  useEffect(() => {
    const wasVisible = wasVisibleRef.current;
    wasVisibleRef.current = visible;

    if (visible && !wasVisible) {
      const nextForm = company
        ? {
            ...company,
            status: normalizeSelectionStatus(company.status),
            questionAnswers: questionMemos,
          }
        : copySourceCompany
          ? createCopiedForm(copySourceCompany, type, allowPasswordStorage)
        : createEmptyForm(type);

      setForm(nextForm);
      setSchedules(sortSchedules(company ? companySchedules : []));
      setTagText(nextForm.tags.join(", "));
      setShowPassword(false);
      setError(null);
      setIsStatusPickerOpen(false);
      setEditingQuestionAnswer(null);
      setEditingSchedule(null);
      setScheduleEditorVisible(false);
      setIsRendered(true);
      requestAnimationFrame(openSheet);
      return;
    }

    if (!visible && wasVisible && !isClosingRef.current) {
      setIsRendered(false);
      resetTransientState();
    }
  }, [
    allowPasswordStorage,
    company,
    companySchedules,
    copySourceCompany,
    openSheet,
    questionMemos,
    resetTransientState,
    type,
    visible,
  ]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const normalizeQuestionAnswers = () => {
    const now = new Date().toISOString();

    return (form.questionAnswers ?? [])
      .map((item) => ({
        ...item,
        id: item.id || createDraftId("qa"),
        companyId: item.companyId ?? company?.id ?? null,
        question: item.question.trim(),
        answer: item.answer.trim(),
        labelIds: item.labelIds ?? [],
        createdAt: item.createdAt || now,
        updatedAt: now,
      }))
      .filter((item) => item.question || item.answer);
  };

  const handleSave = async () => {
    const companyName = form.companyName.trim();

    if (!companyName) {
      setError("企業名を入力してください");
      requestAnimationFrame(() => {
        companyNameInputRef.current?.focus();
      });
      return;
    }

    setIsSaving(true);
    setError(null);

    const companyId = form.id || createDraftId("company");
    const payload: CompanyEditorDraft = {
      ...form,
      id: companyId,
      companyName,
      loginId: form.loginId.trim(),
      password: allowPasswordStorage ? form.password.trim() : "",
      myPageUrl: form.myPageUrl?.trim(),
      industry: form.industry?.trim(),
      role: form.role?.trim(),
      tags: tagText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      questionAnswers: normalizeQuestionAnswers(),
      memo: form.memo?.trim(),
      schedules: schedules.map((schedule) => ({
        ...schedule,
        companyId,
        title: schedule.title.trim() || schedule.type || companyName,
        memo: schedule.memo?.trim(),
      })),
    };

    try {
      await onSave(payload);
      requestClose();
    } catch {
      setError("保存に失敗しました。しばらくしてからもう一度お試しください。");
      setIsSaving(false);
    }
  };

  const openCreateQuestionAnswer = () => {
    const now = new Date().toISOString();
    setEditingQuestionAnswer({
      id: createDraftId("qa"),
      companyId: company?.id ?? null,
      question: "",
      answer: "",
      labelIds: [],
      createdAt: now,
      updatedAt: now,
    });
  };

  const saveQuestionAnswer = (item: CompanyQuestionAnswer) => {
    const nextItem: CompanyQuestionAnswer = {
      ...item,
      question: item.question.trim(),
      answer: item.answer.trim(),
      labelIds: item.labelIds ?? [],
      updatedAt: new Date().toISOString(),
    };

    if (!nextItem.question) {
      setEditingQuestionAnswer(null);
      return;
    }

    update(
      "questionAnswers",
      (form.questionAnswers ?? []).some((current) => current.id === nextItem.id)
        ? (form.questionAnswers ?? []).map((current) =>
            current.id === nextItem.id ? nextItem : current,
          )
        : [...(form.questionAnswers ?? []), nextItem],
    );
    setEditingQuestionAnswer(null);
  };

  const deleteQuestionAnswer = (id: string) => {
    update(
      "questionAnswers",
      (form.questionAnswers ?? []).filter((item) => item.id !== id),
    );
  };

  const openCreateSchedule = () => {
    Keyboard.dismiss();
    setEditingSchedule(null);
    requestAnimationFrame(() => {
      setScheduleEditorVisible(true);
    });
  };

  const openSchedule = (schedule: CompanySchedule) => {
    Keyboard.dismiss();
    setEditingSchedule(schedule);
    requestAnimationFrame(() => {
      setScheduleEditorVisible(true);
    });
  };

  const saveSchedule = (schedule: CompanySchedule) => {
    setSchedules((current) =>
      sortSchedules(
        current.some((item) => item.id === schedule.id)
          ? current.map((item) => (item.id === schedule.id ? schedule : item))
          : [...current, schedule],
      ),
    );
  };

  const deleteSchedule = (id: string) => {
    setSchedules((current) => current.filter((schedule) => schedule.id !== id));
  };

  const scheduleConflictCandidates = useMemo(
    () => [
      ...allSchedules.filter((schedule) => schedule.companyId !== form.id),
      ...schedules,
    ],
    [allSchedules, form.id, schedules],
  );

  if (!isRendered && !visible) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      onDismiss={resetTransientState}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={isRendered}
      onRequestClose={() => requestClose()}>
      <View style={styles.overlayRoot}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.overlayBackdrop,
            { backgroundColor: theme.colors.overlay },
            backdropStyle,
          ]}
        />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => requestClose()}
        />

        <Animated.View
          style={[
            styles.sheet,
            theme.shadows.floating,
            sheetStyle,
            {
              backgroundColor: typeTheme.soft,
              marginTop: topInset,
            },
          ]}>
          <SafeAreaView edges={["top", "bottom"]} style={styles.modalRoot}>
            <GestureDetector gesture={headerPanGesture}>
              <Animated.View
                collapsable={false}
                style={[
                  styles.header,
                  {
                    backgroundColor: typeTheme.soft,
                    borderBottomColor: theme.colors.divider,
                  },
                ]}>
                <View style={styles.handleTouchArea}>
                  <Animated.View
                    style={[
                      styles.handle,
                      { backgroundColor: theme.colors.border },
                      handleAnimatedStyle,
                    ]}
                  />
                </View>

                <View style={styles.headerRow}>
                  <ModalCloseButton
                    onPress={() => requestClose()}
                    theme={theme}
                  />
                  <Text
                    style={[
                      theme.typography.title3,
                      styles.headerTitle,
                      { color: theme.colors.textPrimary },
                    ]}>
                    {company ? "企業編集" : "企業追加"}
                  </Text>
                  <View style={styles.headerSpacer} />
                </View>
              </Animated.View>
            </GestureDetector>

            <KeyboardAwareScrollView
              bottomOffset={32}
              contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(28, keyboardInset + 28) },
              ]}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              onScrollBeginDrag={Keyboard.dismiss}
              overScrollMode="never"
              showsVerticalScrollIndicator={false}
              style={styles.flex}>
              <DismissKeyboardView style={styles.formShell}>
                <FormSection theme={theme} title="基本情報">
                  <InputField
                    ref={companyNameInputRef}
                    label="企業名"
                    errorMessage={error}
                    required
                    theme={theme}
                    value={form.companyName}
                    placeholder=""
                    onChangeText={(value) => update("companyName", value)}
                  />

                  <StatusSelectField
                    theme={theme}
                    value={form.status}
                    options={statusOptions}
                    visible={isStatusPickerOpen}
                    onOpen={() => setIsStatusPickerOpen(true)}
                    onClose={() => setIsStatusPickerOpen(false)}
                    onChange={(value) => update("status", value)}
                  />
                </FormSection>

                <FormSection theme={theme} title="日程">
                  {schedules.length > 0 ? (
                    <View style={styles.scheduleList}>
                      {schedules.map((schedule) => {
                        const category = getScheduleCategoryPresentation(
                          schedule,
                          scheduleCategories,
                          theme,
                        );

                        return (
                          <Pressable
                            key={schedule.id}
                            accessibilityRole="button"
                            accessibilityLabel={`${schedule.title || schedule.type}を編集`}
                            onPress={() => openSchedule(schedule)}
                            style={({ pressed }) => [
                              styles.scheduleRow,
                              {
                                backgroundColor: theme.colors.surfaceElevated,
                                borderColor: theme.colors.border,
                              },
                              pressed && styles.pressed,
                            ]}>
                            <View style={styles.scheduleRowBody}>
                              <View
                                style={[
                                  styles.scheduleDot,
                                  { backgroundColor: category.color },
                                ]}
                              />
                              <View style={styles.scheduleTextBlock}>
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.scheduleTitle,
                                    { color: theme.colors.textPrimary },
                                  ]}>
                                  {schedule.title || schedule.type}
                                </Text>
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.scheduleMeta,
                                    { color: theme.colors.textMuted },
                                  ]}>
                                  {formatScheduleTime(schedule)}
                                </Text>
                              </View>
                            </View>
                            <IconButton
                              icon="create-outline"
                              label="日程を編集"
                              onPress={(event) => {
                                event?.stopPropagation();
                                openSchedule(schedule);
                              }}
                              theme={theme}
                              tone="neutral"
                              size="compact"
                              variant="plain"
                            />
                            <IconButton
                              icon="trash-outline"
                              label="日程を削除"
                              onPress={(event) => {
                                event?.stopPropagation();
                                deleteSchedule(schedule.id);
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
                  ) : null}

                  <AppButton
                    label="日程を追加"
                    icon="calendar-outline"
                    onPress={openCreateSchedule}
                    theme={theme}
                    variant="secondary"
                  />
                </FormSection>

                <FormSection theme={theme} title="ログイン情報">
                  <InputField
                    label="ログインID"
                    theme={theme}
                    value={form.loginId}
                    placeholder="メールアドレスやID"
                    autoCapitalize="none"
                    autoComplete="username"
                    textContentType="username"
                    onChangeText={(value) => update("loginId", value)}
                  />
                  {allowPasswordStorage ? (
                    <InputField
                      label="パスワード"
                      theme={theme}
                      value={form.password}
                      placeholder="未登録"
                      autoCapitalize="none"
                      autoComplete="current-password"
                      secureTextEntry={!showPassword}
                      textContentType="password"
                      onChangeText={(value) => update("password", value)}
                      trailing={
                        <IconButton
                          icon={
                            showPassword ? "eye-off-outline" : "eye-outline"
                          }
                          label={
                            showPassword
                              ? "パスワードを隠す"
                              : "パスワードを表示"
                          }
                          onPress={() => setShowPassword((current) => !current)}
                          theme={theme}
                          tone="accent"
                          size="compact"
                          variant="plain"
                        />
                      }
                    />
                  ) : (
                    <View
                      style={[
                        styles.webPasswordNotice,
                        {
                          backgroundColor: theme.colors.primarySubtle,
                          borderColor: theme.colors.primaryBorder,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.webPasswordNoticeText,
                          { color: theme.colors.textSecondary },
                        ]}>
                        パスワードは各企業サイトでブラウザの保存機能をご利用ください。
                      </Text>
                    </View>
                  )}
                  <InputField
                    label="マイページURL"
                    theme={theme}
                    value={form.myPageUrl ?? ""}
                    placeholder="https://..."
                    autoCapitalize="none"
                    keyboardType="url"
                    onChangeText={(value) => update("myPageUrl", value)}
                  />
                </FormSection>

                <FormSection theme={theme} title="メモ">
                  {(form.questionAnswers ?? []).length > 0 ? (
                    <View style={styles.qaList}>
                      {(form.questionAnswers ?? []).map((item, index) => (
                        <Pressable
                          key={item.id}
                          accessibilityRole="button"
                          accessibilityLabel={`${item.question || `質問 ${index + 1}`}を開く`}
                          onPress={() => setEditingQuestionAnswer(item)}
                          style={[
                            styles.qaRow,
                            {
                              backgroundColor: theme.colors.surfaceElevated,
                              borderColor: theme.colors.border,
                            },
                          ]}>
                          <View style={styles.qaRowBody}>
                            <Text
                              style={[
                                styles.qaIndex,
                                { color: theme.colors.textDisabled },
                              ]}>
                              {index + 1}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.qaTitle,
                                { color: theme.colors.textPrimary },
                              ]}>
                              {item.question || "題目未入力"}
                            </Text>
                          </View>
                          <IconButton
                            icon="trash-outline"
                            label="質問メモを削除"
                            onPress={(event) => {
                              event?.stopPropagation();
                              deleteQuestionAnswer(item.id);
                            }}
                            theme={theme}
                            tone="danger"
                            size="compact"
                            variant="plain"
                          />
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  <AppButton
                    label="質問メモを追加"
                    icon="add"
                    onPress={openCreateQuestionAnswer}
                    theme={theme}
                    variant="secondary"
                  />

                  <InputField
                    label="自由メモ"
                    theme={theme}
                    value={form.memo ?? ""}
                    placeholder="面接で話すこと、気づいたこと"
                    multiline
                    style={styles.longTextInput}
                    onChangeText={(value) => update("memo", value)}
                  />
                </FormSection>

                <AppButton
                  label={company ? "変更を保存する" : "この内容で登録する"}
                  loading={isSaving}
                  onPress={handleSave}
                  theme={theme}
                  variant="primary"
                />
              </DismissKeyboardView>
            </KeyboardAwareScrollView>
          </SafeAreaView>
        </Animated.View>

        <QuestionMemoDialog
          item={editingQuestionAnswer}
          labels={questionLabels}
          theme={theme}
          onClose={() => setEditingQuestionAnswer(null)}
          onSave={saveQuestionAnswer}
          onCreateLabel={onCreateQuestionLabel}
        />

        <ScheduleEditorDialog
          visible={scheduleEditorVisible}
          schedule={editingSchedule}
          company={{
            id: form.id ?? "",
            companyName: form.companyName,
          }}
          allSchedules={scheduleConflictCandidates}
          companies={companies}
          scheduleCategories={scheduleCategories}
          theme={theme}
          onClose={() => setScheduleEditorVisible(false)}
          onSave={saveSchedule}
          onDelete={editingSchedule ? deleteSchedule : undefined}
          onSaveScheduleCategory={onSaveScheduleCategory}
          onDeleteScheduleCategory={onDeleteScheduleCategory}
        />
      </View>
    </Modal>
  );
};

const FormSection = ({
  title,
  theme,
  children,
}: {
  title: string;
  theme: AppTheme;
  children: ReactNode;
}) => (
  <View
    style={[
      styles.section,
      theme.shadows.surface,
      {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.lg,
        padding: theme.spacing.md,
      },
    ]}>
    <Text
      style={[
        theme.typography.label,
        styles.sectionTitle,
        { color: theme.colors.textPrimary }
      ]}
    >
      {title}
    </Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const FieldLabel = ({ label, theme }: { label: string; theme: AppTheme }) => (
  <Text
    style={[
      theme.typography.footnote,
      styles.fieldLabel,
      { color: theme.colors.textSecondary }
    ]}
  >
    {label}
  </Text>
);

const StatusSelectField = ({
  theme,
  value,
  options,
  visible,
  onOpen,
  onClose,
  onChange,
}: {
  theme: AppTheme;
  value: SelectionStatus;
  options: SelectionStatus[];
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
  onChange: (value: SelectionStatus) => void;
}) => {
  return (
    <>
      <FieldLabel label="選考状況" theme={theme} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="選考状況を選択"
        accessibilityHint="選考状況の一覧を開きます"
        onPress={(event) => {
          event.stopPropagation();
          Keyboard.dismiss();
          onOpen();
        }}
        style={({ pressed }) => [
          styles.selectTrigger,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: visible ? theme.colors.focusRing : theme.colors.border,
          },
          pressed && styles.selectTriggerPressed,
        ]}>
        <View style={styles.selectValuePill}>
          <Text
            numberOfLines={1}
            style={[styles.selectValueText, { color: theme.colors.textPrimary }]}>
            {value}
          </Text>
        </View>
        <Ionicons
          color={theme.colors.textMuted}
          name="chevron-down"
          size={20}
        />
      </Pressable>

      <SelectionStatusPickerSheet
        visible={visible}
        value={value}
        options={options}
        theme={theme}
        onClose={onClose}
        onSelect={onChange}
      />
    </>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlayRoot: {
    flex: 1,
  },
  overlayBackdrop: {
    opacity: 1,
  },
  sheet: {
    alignSelf: "stretch",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    overflow: "hidden",
    width: "100%",
  },
  modalRoot: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  handleTouchArea: {
    alignSelf: "stretch",
    paddingBottom: 10,
    paddingTop: 8,
  },
  handle: {
    alignSelf: "center",
    borderRadius: 999,
    height: 5,
    width: 44,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 46,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    paddingBottom: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  formShell: {
    alignSelf: "center",
    gap: 14,
    maxWidth: 760,
    width: "100%",
  },
  section: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  sectionTitle: {
    fontWeight: "800",
  },
  sectionBody: {
    gap: 14,
    marginTop: 14,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  selectTrigger: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  selectTriggerPressed: {
    opacity: 0.78,
  },
  selectValuePill: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  selectValueText: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  qaList: {
    gap: 8,
  },
  scheduleList: {
    gap: 8,
  },
  scheduleRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scheduleRowBody: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 0,
  },
  scheduleDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  scheduleTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
  scheduleMeta: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 2,
  },
  qaRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  qaRowBody: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  qaIndex: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
    minWidth: 18,
    textAlign: "center",
  },
  qaTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
    minWidth: 0,
  },
  longTextInput: {
    minHeight: 132,
  },
  webPasswordNotice: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  webPasswordNoticeText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.72,
  },
});
