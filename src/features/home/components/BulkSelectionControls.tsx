import { Ionicons } from "@expo/vector-icons";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { AppTheme } from "../../../constants/theme";
import { AppButton } from "../../../ui/AppButton";
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
    accessibilityRole="checkbox"
    accessibilityState={{ disabled, checked: active }}
    aria-checked={active}
    aria-disabled={disabled}
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

type BulkSelectionActionsProps = {
  selectedCount: number;
  unit?: string;
  busy: boolean;
  theme: AppTheme;
  actions: Array<{
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    destructive?: boolean;
    disabled?: boolean;
    onPress: () => void;
  }>;
};

export const BulkSelectionActions = ({
  selectedCount,
  unit = "件",
  busy,
  theme,
  actions,
}: BulkSelectionActionsProps) => (
  <View style={styles.actions}>
    <Text accessibilityLiveRegion="polite" style={[
      theme.typography.caption, { color: theme.colors.textSecondary },
    ]}>
      {selectedCount}{unit}選択中
    </Text>
    <View style={styles.actionButtons}>
      {actions.map((action) => (
        <AppButton
          key={action.label}
          label={action.label}
          icon={action.icon}
          theme={theme}
          size="compact"
          variant={action.destructive ? "danger" : "secondary"}
          disabled={busy || selectedCount === 0 || action.disabled}
          onPress={action.onPress}
        />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  topControl: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
  },
  actions: {
    gap: 8,
    paddingBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pressed: {
    opacity: 0.72,
  },
});
