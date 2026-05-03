import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { AppTheme } from '../constants/theme';

type FilterChipProps = {
  label: string;
  theme: AppTheme;
  selected?: boolean;
  tint: string;
  surface: string;
  border: string;
  onPress: () => void;
};

export const FilterChip = ({
  label,
  theme,
  selected,
  tint,
  surface,
  border,
  onPress
}: FilterChipProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected }}
    onPress={onPress}
    android_ripple={
      Platform.OS === 'android'
        ? { color: theme.colors.surfacePressed, borderless: false }
        : undefined
    }
    style={({ pressed }) => [
      styles.chip,
      {
        backgroundColor: selected ? surface : theme.colors.surface,
        borderColor: selected ? border : theme.colors.border
      },
      pressed && {
        backgroundColor: selected ? surface : theme.colors.surfaceSubtle
      }
    ]}
  >
    <Text
      style={[
        styles.label,
        { color: selected ? tint : theme.colors.textSecondary }
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 34,
    overflow: 'hidden',
    paddingHorizontal: 14
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17
  }
});
