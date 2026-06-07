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
      accessibilityState={{ disabled: inactive, busy: loading }}
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
          borderColor: focused ? theme.colors.focusRing : palette.border,
          borderRadius: theme.radii.md,
          minHeight: compact
            ? theme.component.controlHeightCompact
            : theme.component.controlHeight,
          opacity: disabled ? theme.state.disabledOpacity : 1,
          paddingHorizontal: compact ? theme.spacing.md : theme.spacing.lg
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
        inactive && {
          backgroundColor: theme.colors.disabledBackground,
          borderColor: theme.colors.disabledBackground
        }
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={compact ? 16 : 18} color={foreground} />
          ) : null}
          <Text
            numberOfLines={1}
            style={[
              compact ? theme.typography.footnote : theme.typography.label,
              styles.label,
              { color: foreground }
            ]}
          >
            {label}
          </Text>
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
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden'
  },
  default: {
  },
  compact: {
  },
  label: {
    flexShrink: 1,
    textAlign: 'center'
  }
});
