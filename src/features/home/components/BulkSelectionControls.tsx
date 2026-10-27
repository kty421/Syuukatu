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
import { IconButton } from "../../../ui/IconButton";
import { BulkSelectionState } from "../utils/bulkUpdateUtils";
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
  targetCount: number;
  selectionState: BulkSelectionState;
  onToggleAll: () => void;
  unit?: string;
  busy: boolean;
  theme: AppTheme;
  actions: Array<{
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconOnly?: boolean;
    disabled?: boolean;
    onPress: () => void;
  }>;
};

export const BulkSelectionActions = ({
  selectedCount,
  targetCount,
  selectionState,
  onToggleAll,
  unit = "件",
  busy,
  theme,
  actions,
}: BulkSelectionActionsProps) => (
  <View style={styles.actions}>
    <View style={styles.selectionSummary}>
      <Text accessibilityLiveRegion="polite" style={[
        theme.typography.caption, { color: theme.colors.textSecondary },
      ]}>
        {selectedCount}{unit}選択中
      </Text>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={selectionState === "all" ? "全て解除" : "全て選択"}
        accessibilityState={{ checked: selectionState === "partial" ? "mixed" : selectionState === "all", disabled: busy || targetCount === 0 }}
        aria-checked={selectionState === "partial" ? "mixed" : selectionState === "all"}
        aria-disabled={busy || targetCount === 0}
        disabled={busy || targetCount === 0}
        onPress={onToggleAll}
        style={({ pressed }) => [styles.selectAll, webCursor,
          (busy || targetCount === 0) && { opacity: theme.state.disabledOpacity }, pressed && styles.pressed]}>
        <SelectionCircle selected={selectionState === "all"} indeterminate={selectionState === "partial"} theme={theme} />
        <Text style={[theme.typography.footnote, { color: theme.colors.primary }]}>
          {selectionState === "all" ? "全て解除" : "全て選択"}
        </Text>
      </Pressable>
    </View>
    <View style={styles.actionButtons}>
      {actions.map((action) => (
        action.iconOnly ? <IconButton
          key={action.label}
          label={action.label}
          tooltip={action.label}
          icon={action.icon}
          theme={theme}
          tone="accent"
          disabled={busy || selectedCount === 0 || action.disabled}
          onPress={action.onPress}
        /> : <AppButton
          key={action.label}
          label={action.label}
          icon={action.icon}
          theme={theme}
          size="compact"
          variant="secondary"
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
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectionSummary: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  selectAll: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.72,
  },
});
