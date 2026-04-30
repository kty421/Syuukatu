import { Ionicons } from '@expo/vector-icons';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet
} from 'react-native';

import { AppTheme } from '../constants/theme';

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

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      android_ripple={
        Platform.OS === 'android'
          ? { color: theme.colors.surfacePressed, borderless: plain }
          : undefined
      }
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.default,
        plain ? styles.plain : styles.filled,
        {
          backgroundColor: plain ? 'transparent' : palette.background,
          borderColor: plain ? 'transparent' : palette.border
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      <Ionicons
        color={disabled ? theme.colors.textSubtle : palette.foreground}
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
        background: accentSurface ?? theme.colors.primarySoft,
        border: 'transparent',
        foreground: accentColor ?? theme.colors.primary
      };
    case 'danger':
      return {
        background: theme.colors.dangerSoft,
        border: 'transparent',
        foreground: theme.colors.danger
      };
    case 'neutral':
    default:
      return {
        background: theme.colors.surfaceMuted,
        border: theme.colors.outline,
        foreground: theme.colors.textMuted
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
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth
  },
  plain: {
    borderRadius: 12,
    borderWidth: 0
  },
  default: {
    height: 44,
    width: 44
  },
  compact: {
    height: 36,
    width: 36
  },
  pressed: {
    opacity: 0.8
  },
  disabled: {
    opacity: 0.48
  }
});
