import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTheme } from "../../../constants/theme";
import { MainTab } from "./BottomNavigation";

type HomeMenuModalProps = {
  visible: boolean;
  activeView: MainTab;
  userEmail: string | null;
  showPasswordControls: boolean;
  passwordDefaultVisible: boolean;
  theme: AppTheme;
  onOpen: () => void;
  onViewChange: (view: MainTab) => void;
  onCreateCompany: () => void;
  onCreateQuestion: () => void;
  onOpenQuestionLabelSettings: () => void;
  onPasswordDefaultVisibleChange: (visible: boolean) => void;
  onSignOut: () => void;
  onClose: () => void;
};

const EDGE_SWIPE_WIDTH = 30;
const EDGE_SWIPE_TOP_OFFSET = 64;
const GESTURE_ACTIVATION_DISTANCE = 12;
const VELOCITY_THRESHOLD = 720;

const webCursor =
  Platform.OS === "web" ? ({ cursor: "pointer" } as unknown as object) : null;

const clamp = (value: number, min: number, max: number) => {
  "worklet";

  return Math.min(Math.max(value, min), max);
};

const drawerSpring = (velocity = 0) => {
  "worklet";

  return {
    damping: 28,
    mass: 0.9,
    overshootClamping: true,
    stiffness: 260,
    velocity,
  };
};

export const HomeMenuModal = ({
  visible,
  activeView,
  userEmail,
  showPasswordControls,
  passwordDefaultVisible,
  theme,
  onOpen,
  onViewChange,
  onCreateCompany,
  onCreateQuestion,
  onOpenQuestionLabelSettings,
  onPasswordDefaultVisibleChange,
  onSignOut,
  onClose,
}: HomeMenuModalProps) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(width * 0.78, 320);
  const closeThreshold = drawerWidth / 3;
  const translateX = useSharedValue(drawerWidth);
  const dragStartX = useSharedValue(drawerWidth);

  const finishClose = useCallback(() => {
    onClose();
  }, [onClose]);
  const finishOpen = useCallback(() => {
    onOpen();
  }, [onOpen]);

  const requestClose = useCallback(
    (velocityX = 0) => {
      cancelAnimation(translateX);
      translateX.value = withSpring(
        drawerWidth,
        drawerSpring(Math.max(velocityX, 0)),
        (finished) => {
          if (finished) {
            runOnJS(finishClose)();
          }
        },
      );
    },
    [drawerWidth, finishClose, translateX],
  );

  const runMenuAction = useCallback(
    (action: () => void) => {
      requestClose();
      action();
    },
    [requestClose],
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [drawerWidth, 0],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const edgeOpenGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!visible)
        .maxPointers(1)
        .activeOffsetX([-GESTURE_ACTIVATION_DISTANCE, 100000])
        .failOffsetY([-18, 18])
        .enableTrackpadTwoFingerGesture(true)
        .onStart(() => {
          cancelAnimation(translateX);
          dragStartX.value = translateX.value;
        })
        .onUpdate((event) => {
          translateX.value = clamp(
            dragStartX.value + event.translationX,
            0,
            drawerWidth,
          );
        })
        .onEnd((event) => {
          const openedDistance = drawerWidth - translateX.value;
          const shouldOpen =
            openedDistance >= closeThreshold ||
            event.velocityX <= -VELOCITY_THRESHOLD;

          if (shouldOpen) {
            runOnJS(finishOpen)();
            translateX.value = withSpring(
              0,
              drawerSpring(Math.min(event.velocityX, 0)),
            );
            return;
          }

          translateX.value = withSpring(
            drawerWidth,
            drawerSpring(Math.max(event.velocityX, 0)),
          );
        }),
    [closeThreshold, dragStartX, drawerWidth, finishOpen, translateX, visible],
  );

  const drawerCloseGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(visible)
        .maxPointers(1)
        .activeOffsetX([-100000, GESTURE_ACTIVATION_DISTANCE])
        .failOffsetY([-22, 22])
        .enableTrackpadTwoFingerGesture(true)
        .onStart(() => {
          cancelAnimation(translateX);
          dragStartX.value = translateX.value;
        })
        .onUpdate((event) => {
          translateX.value = clamp(
            dragStartX.value + event.translationX,
            0,
            drawerWidth,
          );
        })
        .onEnd((event) => {
          const shouldClose =
            translateX.value >= closeThreshold ||
            event.velocityX >= VELOCITY_THRESHOLD;

          if (shouldClose) {
            translateX.value = withSpring(
              drawerWidth,
              drawerSpring(Math.max(event.velocityX, 0)),
              (finished) => {
                if (finished) {
                  runOnJS(finishClose)();
                }
              },
            );
            return;
          }

          translateX.value = withSpring(
            0,
            drawerSpring(Math.min(event.velocityX, 0)),
          );
        }),
    [closeThreshold, dragStartX, drawerWidth, finishClose, translateX, visible],
  );

  useEffect(() => {
    cancelAnimation(translateX);

    if (visible) {
      translateX.value = withSpring(0, drawerSpring());
      return;
    }

    translateX.value = withSpring(drawerWidth, drawerSpring());
  }, [drawerWidth, translateX, visible]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        requestClose();
        return true;
      },
    );

    return () => subscription.remove();
  }, [requestClose, visible]);

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]}
      />

      <Pressable
        accessibilityLabel="メニューを閉じる"
        pointerEvents={visible ? "auto" : "none"}
        style={StyleSheet.absoluteFill}
        onPress={() => requestClose()}
      />

      <GestureDetector gesture={drawerCloseGesture}>
        <Animated.View
          collapsable={false}
          pointerEvents={visible ? "auto" : "none"}
          style={[
            styles.drawer,
            theme.shadows.floating,
            drawerStyle,
            {
              backgroundColor: theme.colors.surface,
              borderLeftColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, 14),
              paddingTop: Math.max(insets.top, 10) + 12,
              width: drawerWidth,
            },
          ]}>
          <View style={styles.header}>
            <View style={styles.headerTitleBlock}>
              <Text
                selectable
                numberOfLines={1}
                style={[
                  styles.headerEmail,
                  { color: theme.colors.textPrimary },
                ]}>
                {userEmail ?? "メールアドレス未設定"}
              </Text>
            </View>
            <View
              style={[
                styles.userIcon,
                { backgroundColor: theme.colors.primarySubtle },
              ]}>
              <Ionicons
                name="person-outline"
                size={18}
                color={theme.colors.primary}
              />
            </View>
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.colors.divider }]}
          />

          <View style={styles.menuSection}>
            <MenuActionRow
              icon="business-outline"
              label="企業一覧"
              selected={activeView === "companies"}
              theme={theme}
              onPress={() => runMenuAction(() => onViewChange("companies"))}
            />
            <MenuActionRow
              icon="chatbubbles-outline"
              label="質問一覧"
              selected={activeView === "questions"}
              theme={theme}
              onPress={() => runMenuAction(() => onViewChange("questions"))}
            />
          </View>

          <View style={styles.menuSection}>
            <MenuActionRow
              icon="add-outline"
              label="企業を追加"
              theme={theme}
              onPress={() => runMenuAction(onCreateCompany)}
            />
            <MenuActionRow
              icon="create-outline"
              label="質問を追加"
              theme={theme}
              onPress={() => runMenuAction(onCreateQuestion)}
            />
          </View>

          <View style={[styles.menuSection, styles.settingsSection]}>
            <View
              style={[
                styles.divider,
                styles.settingsDivider,
                { backgroundColor: theme.colors.divider },
              ]}
            />
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.textPrimary },
              ]}>
              詳細設定
            </Text>
            <SettingsLinkRow
              label="質問ラベル"
              theme={theme}
              onPress={() => runMenuAction(onOpenQuestionLabelSettings)}
            />
            <View style={styles.passwordRow}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.textPrimary },
                ]}>
                パスワードのデフォルト表示
              </Text>
              {showPasswordControls ? (
                <View
                  style={[
                    styles.segment,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <PasswordSegmentButton
                    label="非表示"
                    selected={!passwordDefaultVisible}
                    theme={theme}
                    onPress={() => onPasswordDefaultVisibleChange(false)}
                  />
                  <PasswordSegmentButton
                    label="表示"
                    selected={passwordDefaultVisible}
                    theme={theme}
                    onPress={() => onPasswordDefaultVisibleChange(true)}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.unavailableBadge,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.unavailableText,
                      { color: theme.colors.textMuted },
                    ]}>
                    スマホのみ
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.divider },
              ]}
            />
            <MenuActionRow
              icon="log-out-outline"
              label="ログアウト"
              theme={theme}
              onPress={onSignOut}
            />
          </View>
        </Animated.View>
      </GestureDetector>

      <GestureDetector gesture={edgeOpenGesture}>
        <View
          collapsable={false}
          pointerEvents={visible ? "none" : "auto"}
          style={[
            styles.edgeSwipeZone,
            {
              top: EDGE_SWIPE_TOP_OFFSET,
              width: EDGE_SWIPE_WIDTH,
            },
          ]}
        />
      </GestureDetector>
    </View>
  );
};

const MenuActionRow = ({
  icon,
  label,
  selected,
  theme,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  selected?: boolean;
  theme: AppTheme;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={selected ? { selected } : undefined}
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionRow,
      webCursor,
      {
        backgroundColor: selected
          ? theme.colors.primarySubtle
          : theme.colors.surface,
        borderColor: selected
          ? theme.colors.primaryBorder
          : theme.colors.border,
      },
      pressed && styles.pressed,
    ]}>
    <View
      style={[
        styles.actionIcon,
        {
          backgroundColor: selected
            ? theme.colors.surface
            : theme.colors.surfaceSubtle,
        },
      ]}>
      <Ionicons
        name={icon}
        size={16}
        color={selected ? theme.colors.primary : theme.colors.textSecondary}
      />
    </View>
    <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>
      {label}
    </Text>
  </Pressable>
);

const SettingsLinkRow = ({
  label,
  theme,
  onPress,
}: {
  label: string;
  theme: AppTheme;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [
      styles.settingsRow,
      webCursor,
      pressed && styles.pressed,
    ]}>
    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
      {label}
    </Text>
    <Ionicons
      name="chevron-forward"
      size={16}
      color={theme.colors.textMuted}
    />
  </Pressable>
);

const PasswordSegmentButton = ({
  label,
  selected,
  theme,
  onPress,
}: {
  label: string;
  selected: boolean;
  theme: AppTheme;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected }}
    onPress={onPress}
    style={({ pressed }) => [
      styles.segmentButton,
      webCursor,
      {
        backgroundColor: selected ? theme.colors.primary : "transparent",
      },
      pressed && styles.pressed,
    ]}>
    <Text
      style={[
        styles.segmentText,
        {
          color: selected
            ? theme.colors.textOnPrimary
            : theme.colors.textSecondary,
        },
      ]}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.52)",
  },
  edgeSwipeZone: {
    bottom: 0,
    position: "absolute",
    right: 0,
    zIndex: 4,
  },
  drawer: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    gap: 14,
    maxWidth: 320,
    paddingHorizontal: 14,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 3,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    minHeight: 48,
  },
  headerTitleBlock: {
    flexShrink: 1,
    minWidth: 0,
  },
  headerEmail: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "right",
  },
  userIcon: {
    alignItems: "center",
    borderRadius: 16,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  menuSection: {
    gap: 8,
  },
  settingsSection: {
    marginTop: 2,
  },
  settingsDivider: {
    marginBottom: 2,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 56,
  },
  rowHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  rowIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  rowTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
  rowDetail: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  actionRow: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 10,
  },
  actionIcon: {
    alignItems: "center",
    borderRadius: 10,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  actionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  passwordRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 42,
  },
  settingsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 42,
  },
  segment: {
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 2,
    padding: 3,
    width: 92,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    minHeight: 28,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
  },
  unavailableBadge: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  unavailableText: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  footer: {
    gap: 14,
    marginTop: "auto",
  },
  pressed: {
    opacity: 0.72,
  },
});
