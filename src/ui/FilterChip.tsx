import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { AppTheme } from '../constants/theme';

const webCursor =
  Platform.OS === 'web'
    ? ({ cursor: 'pointer', outlineStyle: 'none' } as unknown as ViewStyle)
    : null;

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
}: FilterChipProps) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      android_ripple={
        Platform.OS === 'android'
          ? { color: theme.colors.surfacePressed, borderless: false }
          : undefined
      }
      style={({ pressed }) => [
        styles.chip,
        webCursor,
        {
          backgroundColor: selected ? surface : theme.colors.surface,
          borderColor: focused
            ? theme.colors.focusRing
            : selected
              ? border
              : theme.colors.border
        },
        (hovered || pressed) && {
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
};

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
