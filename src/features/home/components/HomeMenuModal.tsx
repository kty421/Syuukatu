import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTheme } from '../../../constants/theme';
import { AppButton } from '../../../ui/AppButton';
import { ModalCloseButton } from '../../../ui/ModalCloseButton';

type HomeMenuModalProps = {
  visible: boolean;
  userEmail: string | null;
  showPasswordControls: boolean;
  passwordDefaultVisible: boolean;
  theme: AppTheme;
  onOpen: () => void;
  onPasswordDefaultVisibleChange: (visible: boolean) => void;
  onSignOut: () => void;
  onClose: () => void;
};

const EDGE_SWIPE_WIDTH = 30;
const EDGE_SWIPE_TOP_OFFSET = 64;
const GESTURE_ACTIVATION_DISTANCE = 12;
const VELOCITY_THRESHOLD = 720;

const webCursor =
  Platform.OS === 'web'
    ? ({ cursor: 'pointer' } as unknown as object)
    : null;

const clamp = (value: number, min: number, max: number) => {
  'worklet';

  return Math.min(Math.max(value, min), max);
};

const drawerSpring = (velocity = 0) => {
  'worklet';

  return {
    damping: 28,
    mass: 0.9,
    overshootClamping: true,
    stiffness: 260,
    velocity
  };
};

export const HomeMenuModal = ({
  visible,
  userEmail,
  showPasswordControls,
  passwordDefaultVisible,
  theme,
  onOpen,
  onPasswordDefaultVisibleChange,
  onSignOut,
  onClose
}: HomeMenuModalProps) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(width * 0.86, 360);
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
        }
      );
    },
    [drawerWidth, finishClose, translateX]
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [drawerWidth, 0],
      [0, 1],
      Extrapolation.CLAMP
    )
  }));

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
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
            drawerWidth
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
              drawerSpring(Math.min(event.velocityX, 0))
            );
            return;
          }

          translateX.value = withSpring(
            drawerWidth,
            drawerSpring(Math.max(event.velocityX, 0))
          );
        }),
    [
      closeThreshold,
      dragStartX,
      drawerWidth,
      finishOpen,
      translateX,
      visible
    ]
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
            drawerWidth
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
              }
            );
            return;
          }

          translateX.value = withSpring(
            0,
            drawerSpring(Math.min(event.velocityX, 0))
          );
        }),
    [
      closeThreshold,
      dragStartX,
      drawerWidth,
      finishClose,
      translateX,
      visible
    ]
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
      'hardwareBackPress',
      () => {
        requestClose();
        return true;
      }
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
        pointerEvents={visible ? 'auto' : 'none'}
        style={StyleSheet.absoluteFill}
        onPress={() => requestClose()}
      />

      <GestureDetector gesture={drawerCloseGesture}>
        <Animated.View
          collapsable={false}
          pointerEvents={visible ? 'auto' : 'none'}
          style={[
            styles.drawer,
            theme.shadows.floating,
            drawerStyle,
            {
              backgroundColor: theme.colors.surface,
              borderLeftColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, 14),
              paddingTop: Math.max(insets.top, 10) + 12,
              width: drawerWidth
            }
          ]}
        >
          <View style={styles.header}>
            <ModalCloseButton
              label="メニューを閉じる"
              onPress={() => requestClose()}
              theme={theme}
            />
            <View style={styles.headerTitleBlock}>
              <Text style={[styles.kicker, { color: theme.colors.textMuted }]}>
                Syuukatu
              </Text>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                メニュー
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

          <View style={styles.menuSection}>
            <View style={styles.row}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: theme.colors.primarySubtle }
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.rowTextBlock}>
                <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>
                  マイページ
                </Text>
                <Text
                  selectable
                  numberOfLines={1}
                  style={[styles.rowDetail, { color: theme.colors.textMuted }]}
                >
                  {userEmail ?? 'メールアドレス未設定'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.menuSection}>
            <View style={styles.rowHeader}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: theme.colors.surfaceSubtle }
                ]}
              >
                <Ionicons
                  name="key-outline"
                  size={17}
                  color={theme.colors.textSecondary}
                />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                パスワード初期表示
              </Text>
            </View>
            {showPasswordControls ? (
              <View
                style={[
                  styles.segment,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border
                  }
                ]}
              >
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
              <Text style={[styles.notice, { color: theme.colors.textMuted }]}>
                Webではパスワードを保存しません。スマホでは端末内にのみ保存できます。
              </Text>
            )}
          </View>

          <View style={styles.footer}>
            <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
            <AppButton
              label="ログアウト"
              icon="log-out-outline"
              onPress={onSignOut}
              theme={theme}
              variant="danger"
            />
          </View>
        </Animated.View>
      </GestureDetector>

      <GestureDetector gesture={edgeOpenGesture}>
        <View
          collapsable={false}
          pointerEvents={visible ? 'none' : 'auto'}
          style={[
            styles.edgeSwipeZone,
            {
              top: EDGE_SWIPE_TOP_OFFSET,
              width: EDGE_SWIPE_WIDTH
            }
          ]}
        />
      </GestureDetector>
    </View>
  );
};

const PasswordSegmentButton = ({
  label,
  selected,
  theme,
  onPress
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
        backgroundColor: selected ? theme.colors.primary : 'transparent'
      },
      pressed && styles.pressed
    ]}
  >
    <Text
      style={[
        styles.segmentText,
        {
          color: selected
            ? theme.colors.textOnPrimary
            : theme.colors.textSecondary
        }
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.52)'
  },
  edgeSwipeZone: {
    bottom: 0,
    position: 'absolute',
    right: 0,
    zIndex: 4
  },
  drawer: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    gap: 18,
    maxWidth: 360,
    paddingHorizontal: 18,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 3
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 48
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
    textAlign: 'right'
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    textAlign: 'right'
  },
  menuSection: {
    gap: 12
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 56
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10
  },
  rowIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 34
  },
  rowTextBlock: {
    flex: 1,
    minWidth: 0
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19
  },
  rowDetail: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 2
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18
  },
  segment: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    padding: 4
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18
  },
  notice: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18
  },
  divider: {
    height: StyleSheet.hairlineWidth
  },
  footer: {
    gap: 18,
    marginTop: 'auto'
  },
  pressed: {
    opacity: 0.72
  }
});
