import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle
} from 'react-native';

import { AppTheme } from '../constants/theme';

const getWebCursor = (inactive?: boolean) =>
  Platform.OS === 'web'
    ? ({
        cursor: inactive ? 'not-allowed' : 'pointer',
        outlineStyle: 'none'
      } as unknown as ViewStyle)
    : null;

type AppButtonProps = {
  label: string;
  theme: AppTheme;
  onPress: ((event: GestureResponderEvent) => void) | (() => void);
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'default' | 'compact';
  disabled?: boolean;
  loading?: boolean;
};

export const AppButton = ({
  label,
  theme,
  onPress,
  icon,
  variant = 'primary',
  size = 'default',
  disabled,
  loading
}: AppButtonProps) => {
  const palette = getPalette(theme, variant);
  const compact = size === 'compact';
  const inactive = disabled || loading;
  const foreground = disabled ? theme.colors.disabledText : palette.foreground;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
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
        styles.base,
        compact ? styles.compact : styles.default,
        getWebCursor(inactive),
        {
          backgroundColor: palette.background,
          borderColor: focused ? theme.colors.focusRing : palette.border
        },
        hovered &&
          !inactive && {
            backgroundColor: palette.hoverBackground,
            borderColor: palette.hoverBorder
        },
        pressed && !inactive && {
          backgroundColor: palette.pressedBackground,
          borderColor: palette.pressedBorder
        },
        disabled && {
          backgroundColor: theme.colors.disabledBackground,
          borderColor: theme.colors.disabledBackground
        }
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={compact ? 16 : 18} color={foreground} />
          ) : null}
          <Text style={[styles.label, { color: foreground }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

const getPalette = (
  theme: AppTheme,
  variant: NonNullable<AppButtonProps['variant']>
) => {
  switch (variant) {
    case 'secondary':
      return {
        background: theme.colors.surface,
        foreground: theme.colors.textPrimary,
        border: theme.colors.border,
        hoverBackground: theme.colors.surfaceSubtle,
        hoverBorder: theme.colors.primaryBorder,
        pressedBackground: theme.colors.surfaceSubtle,
        pressedBorder: theme.colors.primaryBorder
      };
    case 'ghost':
      return {
        background: 'transparent',
        foreground: theme.colors.textSecondary,
        border: 'transparent',
        hoverBackground: theme.colors.surfaceSubtle,
        hoverBorder: 'transparent',
        pressedBackground: theme.colors.surfaceSubtle,
        pressedBorder: 'transparent'
      };
    case 'danger':
      return {
        background: theme.colors.danger,
        foreground: theme.colors.textOnDanger,
        border: theme.colors.danger,
        hoverBackground: theme.colors.dangerHover,
        hoverBorder: theme.colors.dangerHover,
        pressedBackground: theme.colors.dangerHover,
        pressedBorder: theme.colors.dangerHover
      };
    case 'primary':
    default:
      return {
        background: theme.colors.primary,
        foreground: theme.colors.textOnPrimary,
        border: theme.colors.primary,
        hoverBackground: theme.colors.primaryHover,
        hoverBorder: theme.colors.primaryHover,
        pressedBackground: theme.colors.primaryPressed,
        pressedBorder: theme.colors.primaryPressed
      };
  }
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  default: {
    minHeight: 48,
    paddingHorizontal: 18
  },
  compact: {
    minHeight: 38,
    paddingHorizontal: 14
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18
  }
});
