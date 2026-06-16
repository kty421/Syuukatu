import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { AppTheme } from "../../../constants/theme";

type CompanyAddSpeedDialProps = {
  theme: AppTheme;
  label: string;
  canInherit: boolean;
  style?: StyleProp<ViewStyle>;
  onCreateNew: () => void;
  onInherit: () => void;
};

type SpeedDialItemConfig = {
  key: "inherit" | "new";
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  onPress: () => void;
};

const webCursor =
  Platform.OS === "web"
    ? ({ cursor: "pointer", outlineStyle: "none" } as unknown as ViewStyle)
    : null;

const overlayColor = "rgba(0, 0, 0, 0.42)";
const buttonSize = 58;
const itemGap = 16;
const itemStep = buttonSize + itemGap;

export const CompanyAddSpeedDial = ({
  theme,
  label,
  canInherit,
  style,
  onCreateNew,
  onInherit,
}: CompanyAddSpeedDialProps) => {
  const [expanded, setExpanded] = useState(false);
  const [renderOverlay, setRenderOverlay] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const itemProgress = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const close = () => {
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.stagger(
        28,
        [...itemProgress].reverse().map((value) =>
          Animated.timing(value, {
            toValue: 0,
            duration: 150,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start(({ finished }) => {
      if (finished) {
        setRenderOverlay(false);
        setExpanded(false);
      }
    });
  };

  const open = () => {
    setRenderOverlay(true);
    setExpanded(true);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 1,
          duration: 190,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.stagger(
          48,
          itemProgress.map((value) =>
            Animated.spring(value, {
              toValue: 1,
              damping: 12,
              stiffness: 220,
              mass: 0.72,
              useNativeDriver: true,
            }),
          ),
        ),
      ]).start();
    });
  };

  useEffect(
    () => () => {
      progress.stopAnimation();
      itemProgress.forEach((value) => value.stopAnimation());
    },
    [itemProgress, progress],
  );

  const items = useMemo<SpeedDialItemConfig[]>(
    () => [
      {
        key: "new",
        label: "新しく追加",
        icon: "add",
        onPress: onCreateNew,
      },
      {
        key: "inherit",
        label: "引き継いで追加",
        icon: "copy-outline",
        disabled: !canInherit,
        onPress: onInherit,
      },
    ],
    [canInherit, onCreateNew, onInherit],
  );

  const toggle = () => {
    if (expanded) {
      close();
      return;
    }

    open();
  };

  const runAction = (item: SpeedDialItemConfig) => {
    if (item.disabled) {
      return;
    }

    close();
    setTimeout(item.onPress, 150);
  };

  const iconRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "135deg"],
  });
  const fabBackgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.primary, theme.colors.surface],
  });
  const fabBorderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.primaryBorder, theme.colors.border],
  });

  return (
    <>
      {renderOverlay ? (
        <Animated.View
          pointerEvents={expanded ? "auto" : "none"}
          style={[
            styles.overlayLayer,
            {
              backgroundColor: overlayColor,
              opacity: progress,
            },
          ]}>
          <Pressable
            accessibilityLabel="企業追加メニューを閉じる"
            accessibilityRole="button"
            onPress={close}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}

      <View pointerEvents="box-none" style={[styles.root, style]}>
        {renderOverlay ? (
          <View pointerEvents="box-none" style={styles.items}>
            {items.map((item, index) => (
              <SpeedDialItem
                key={item.key}
                item={item}
                progress={itemProgress[index]}
                index={index}
                theme={theme}
                onPress={() => runAction(item)}
              />
            ))}
          </View>
        ) : null}

        <Animated.View
          style={[
            styles.mainButtonWrap,
            theme.shadows.floating,
            {
              backgroundColor: fabBackgroundColor,
              borderColor: fabBorderColor,
            },
          ]}>
          <Pressable
            accessibilityLabel={expanded ? "企業追加メニューを閉じる" : label}
            accessibilityRole="button"
            onPress={toggle}
            android_ripple={
              Platform.OS === "android"
                ? { color: theme.colors.surfacePressed, borderless: true }
                : undefined
            }
            style={({ pressed }) => [
              styles.mainButton,
              webCursor,
              pressed && styles.pressedScale,
            ]}>
            <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
              <Ionicons
                name="add"
                size={30}
                color={
                  expanded ? theme.colors.primary : theme.colors.textOnPrimary
                }
              />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </>
  );
};

const SpeedDialItem = ({
  item,
  progress,
  index,
  theme,
  onPress,
}: {
  item: SpeedDialItemConfig;
  progress: Animated.Value;
  index: number;
  theme: AppTheme;
  onPress: () => void;
}) => {
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });

  return (
    <Animated.View
      style={[
        styles.itemRow,
        {
          bottom: itemStep + index * itemStep,
          opacity: progress,
          transform: [{ translateY }, { scale }],
        },
      ]}>
      <View
        style={[
          styles.itemLabel,
          theme.shadows.surface,
          {
            backgroundColor: theme.colors.surface,
            opacity: item.disabled ? theme.state.disabledOpacity : 1,
          },
        ]}>
        <Text
          numberOfLines={1}
          style={[styles.itemLabelText, { color: theme.colors.textPrimary }]}>
          {item.label}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(item.disabled) }}
        disabled={item.disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.itemButton,
          theme.shadows.floating,
          webCursor,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: item.disabled ? theme.state.disabledOpacity : 1,
          },
          pressed && !item.disabled && styles.pressedScale,
        ]}>
        <Ionicons
          name={item.icon}
          size={26}
          color={theme.colors.primary}
        />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 11,
  },
  root: {
    position: "absolute",
    zIndex: 12,
  },
  items: {
    bottom: 0,
    position: "absolute",
    right: 0,
  },
  itemRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    justifyContent: "flex-end",
    minWidth: 240,
    position: "absolute",
    right: 0,
  },
  itemLabel: {
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  itemLabelText: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 21,
  },
  itemButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: buttonSize,
    justifyContent: "center",
    width: buttonSize,
  },
  mainButtonWrap: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: buttonSize,
    overflow: "hidden",
    width: buttonSize,
  },
  mainButton: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  pressedScale: {
    transform: [{ scale: 0.96 }],
  },
});
