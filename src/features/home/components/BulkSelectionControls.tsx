import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { AppTheme } from "../../../constants/theme";
import { SelectionCircle } from "./SelectionCircle";

const webCursor =
  Platform.OS === "web"
    ? ({ cursor: "pointer", outlineStyle: "none" } as unknown as ViewStyle)
    : null;

type BulkSelectionTopControlProps = {
  active: boolean;
  disabled: boolean;
  theme: AppTheme;
  onToggle: () => void;
};

export const BulkSelectionTopControl = ({
  active,
  disabled,
  theme,
  onToggle,
}: BulkSelectionTopControlProps) => (
  <Pressable
    accessibilityLabel={active ? "まとめて操作を終了" : "まとめて操作"}
    accessibilityRole="button"
    accessibilityState={{ disabled, selected: active }}
    disabled={disabled}
    onPress={onToggle}
    style={({ pressed }) => [
      styles.topControl,
      webCursor,
      disabled && { opacity: theme.state.disabledOpacity },
      pressed && styles.pressed,
    ]}>
    <SelectionCircle selected={active} theme={theme} />
    <Text
      style={[
        theme.typography.bodyStrong,
        {
          color: disabled ? theme.colors.textDisabled : theme.colors.primary,
        },
      ]}>
      まとめて操作
    </Text>
  </Pressable>
);

type BulkDeleteFloatingButtonProps = {
  selectedCount: number;
  style?: StyleProp<ViewStyle>;
  theme: AppTheme;
  onPress: () => void;
};

export const BulkDeleteFloatingButton = ({
  selectedCount,
  style,
  theme,
  onPress,
}: BulkDeleteFloatingButtonProps) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const disabled = selectedCount === 0;

  return (
    <Pressable
      accessibilityLabel={`選択した${selectedCount}件を削除`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      android_ripple={
        Platform.OS === "android"
          ? { color: theme.colors.primarySubtle, borderless: true }
          : undefined
      }
      disabled={disabled}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.deleteButton,
        theme.shadows.floating,
        webCursor,
        {
          backgroundColor:
            hovered && !pressed
              ? theme.colors.primarySubtle
              : theme.colors.surface,
          borderColor: focused
            ? theme.colors.focusRing
            : theme.colors.primaryBorder,
        },
        pressed && { backgroundColor: theme.colors.surfacePressed },
        pressed && styles.pressedScale,
        disabled && { opacity: theme.state.disabledOpacity },
        style,
      ]}>
      <Ionicons color={theme.colors.primary} name="trash-outline" size={27} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  topControl: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 58,
    justifyContent: "center",
    position: "absolute",
    width: 58,
    zIndex: 12,
  },
  pressed: {
    opacity: 0.72,
  },
  pressedScale: {
    transform: [{ scale: 0.96 }],
  },
});
