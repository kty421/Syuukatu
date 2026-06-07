import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  ViewStyle
} from 'react-native';

import { AppTheme } from '../constants/theme';

const getWebCursor = (disabled?: boolean) =>
  Platform.OS === 'web'
    ? ({
        cursor: disabled ? 'not-allowed' : 'pointer',
        outlineStyle: 'none'
      } as unknown as ViewStyle)
    : null;

type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  theme: AppTheme;
  onPress: ((event: GestureResponderEvent) => void) | (() => void);
  label: string;
  tone?: 'neutral' | 'accent' | 'danger';
  size?: 'default' | 'compact';
  variant?: 'filled' | 'plain';
  accentColor?: string;
  accentSurface?: string;
  disabled?: boolean;
  iconSize?: number;
};

export const IconButton = ({
  icon,
  theme,
  onPress,
  label,
  tone = 'neutral',
  size = 'default',
  variant = 'filled',
  accentColor,
  accentSurface,
  disabled,
  iconSize
}: IconButtonProps) => {
  const compact = size === 'compact';
  const plain = variant === 'plain';
  const palette = getPalette(theme, tone, accentColor, accentSurface);
  const foreground = disabled ? theme.colors.disabledText : palette.foreground;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={compact ? 6 : 8}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      android_ripple={
        Platform.OS === 'android'
          ? { color: theme.colors.surfacePressed, borderless: plain }
          : undefined
      }
      style={({ pressed }) => [
        styles.base,
        plain ? styles.plain : styles.filled,
        getWebCursor(disabled),
        {
          backgroundColor: plain ? 'transparent' : palette.background,
          borderColor: focused
            ? theme.colors.focusRing
            : plain
              ? 'transparent'
              : palette.border,
          borderRadius: plain ? theme.radii.sm : theme.radii.md,
          height: compact
            ? theme.component.iconButtonCompactSize
            : theme.component.iconButtonSize,
          opacity: disabled ? theme.state.disabledOpacity : 1,
          width: compact
            ? theme.component.iconButtonCompactSize
            : theme.component.iconButtonSize
        },
        hovered && !disabled && {
          backgroundColor: plain
            ? theme.colors.surfaceSubtle
            : palette.pressedBackground
        },
        pressed && !disabled && { backgroundColor: palette.pressedBackground },
        disabled &&
          !plain && {
            backgroundColor: theme.colors.disabledBackground,
            borderColor: theme.colors.disabledBackground
          }
      ]}
    >
      <Ionicons
        color={foreground}
        name={icon}
        size={iconSize ?? (compact ? 16 : 20)}
      />
    </Pressable>
  );
};

const getPalette = (
  theme: AppTheme,
  tone: NonNullable<IconButtonProps['tone']>,
  accentColor?: string,
  accentSurface?: string
) => {
  switch (tone) {
    case 'accent':
      return {
        background: accentSurface ?? theme.colors.primarySubtle,
        border: theme.colors.primaryBorder,
        foreground: accentColor ?? theme.colors.primary,
        pressedBackground: theme.colors.primarySubtle
      };
    case 'danger':
      return {
        background: theme.colors.dangerSubtle,
        border: theme.colors.dangerSubtle,
        foreground: theme.colors.danger,
        pressedBackground: theme.colors.dangerSubtle
      };
    case 'neutral':
    default:
      return {
        background: theme.colors.surfaceSubtle,
        border: theme.colors.border,
        foreground: theme.colors.textSecondary,
        pressedBackground: theme.colors.surfacePressed
      };
  }
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  filled: {
    borderWidth: StyleSheet.hairlineWidth
  },
  plain: {
    borderWidth: 0
  }
});
