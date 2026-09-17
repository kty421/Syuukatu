import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { AppTheme } from "../../../constants/theme";

type BulkSelectableRowProps = {
  active: boolean;
  children: ReactNode;
  label: string;
  progress: Animated.Value;
  selected: boolean;
  style?: StyleProp<ViewStyle>;
  theme: AppTheme;
  onToggle: () => void;
};

export const BulkSelectableRow = ({
  active,
  children,
  label,
  progress,
  selected,
  style,
  theme,
  onToggle,
}: BulkSelectableRowProps) => {
  const selectorOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
  });
  const selectorScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });
  const contentPaddingLeft = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 44],
  });

  return (
    <View style={[styles.root, style]}>
      <Animated.View
        pointerEvents={active ? "auto" : "none"}
        style={[
          styles.selectorSlot,
          {
            opacity: selectorOpacity,
            transform: [{ scale: selectorScale }],
          },
        ]}>
        <Pressable
          accessibilityLabel={label}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected }}
          hitSlop={2}
          onPress={onToggle}
          style={({ pressed }) => [
            styles.selectorButton,
            pressed && styles.pressed,
          ]}>
          <View
            style={[
              styles.circle,
              {
                backgroundColor: selected
                  ? theme.colors.primary
                  : theme.colors.surface,
                borderColor: selected
                  ? theme.colors.primary
                  : theme.colors.outlineStrong,
              },
            ]}>
            {selected ? (
              <Ionicons
                color={theme.colors.textOnPrimary}
                name="checkmark"
                size={16}
              />
            ) : null}
          </View>
        </Pressable>
      </Animated.View>

      <Animated.View style={{ paddingLeft: contentPaddingLeft }}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: "relative",
    width: "100%",
  },
  selectorSlot: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    top: 0,
    width: 44,
    zIndex: 2,
  },
  selectorButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  circle: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  pressed: {
    opacity: 0.72,
  },
});
