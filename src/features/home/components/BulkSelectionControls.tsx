import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { AppTheme } from "../../../constants/theme";
import { AppButton } from "../../../ui/AppButton";

type BulkSelectionTopControlProps = {
  active: boolean;
  allVisibleSelected: boolean;
  disabled: boolean;
  theme: AppTheme;
  onStart: () => void;
  onToggleAll: () => void;
};

export const BulkSelectionTopControl = ({
  active,
  allVisibleSelected,
  disabled,
  theme,
  onStart,
  onToggleAll,
}: BulkSelectionTopControlProps) => (
  <View style={styles.topControl}>
    <AppButton
      disabled={disabled}
      icon={allVisibleSelected ? "checkmark-circle" : "checkmark-circle-outline"}
      label={
        active
          ? allVisibleSelected
            ? "選択をすべて解除"
            : "表示中をすべて選択"
          : "まとめて操作"
      }
      onPress={active ? onToggleAll : onStart}
      size="compact"
      theme={theme}
      variant="ghost"
    />
  </View>
);

type BulkSelectionBarProps = {
  selectedCount: number;
  style?: StyleProp<ViewStyle>;
  theme: AppTheme;
  onCancel: () => void;
  onDelete: () => void;
};

export const BulkSelectionBar = ({
  selectedCount,
  style,
  theme,
  onCancel,
  onDelete,
}: BulkSelectionBarProps) => (
  <View
    accessibilityRole="toolbar"
    style={[
      styles.bar,
      theme.shadows.floating,
      {
        backgroundColor: theme.colors.surfaceElevated,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.lg,
      },
      style,
    ]}>
    <AppButton
      label="キャンセル"
      onPress={onCancel}
      size="compact"
      theme={theme}
      variant="ghost"
    />
    <Text
      accessibilityLiveRegion="polite"
      numberOfLines={1}
      style={[
        theme.typography.label,
        styles.selectionCount,
        { color: theme.colors.textPrimary },
      ]}>
      {selectedCount}件選択
    </Text>
    <AppButton
      disabled={selectedCount === 0}
      icon="trash-outline"
      label="削除"
      onPress={onDelete}
      size="compact"
      theme={theme}
      variant="danger"
    />
  </View>
);

const styles = StyleSheet.create({
  topControl: {
    alignItems: "flex-end",
    minHeight: 38,
  },
  bar: {
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 6,
    minHeight: 58,
    paddingHorizontal: 8,
    position: "absolute",
    zIndex: 12,
  },
  selectionCount: {
    flex: 1,
    minWidth: 0,
    textAlign: "center",
  },
});
