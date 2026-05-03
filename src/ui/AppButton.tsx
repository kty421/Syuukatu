import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text
} from 'react-native';

import { AppTheme } from '../constants/theme';

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

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      android_ripple={
        Platform.OS === 'android'
          ? { color: theme.colors.surfacePressed, borderless: false }
          : undefined
      }
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.default,
        {
          backgroundColor: palette.background,
          borderColor: palette.border
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
        pressedBackground: theme.colors.surfaceSubtle,
        pressedBorder: theme.colors.primaryBorder
      };
    case 'ghost':
      return {
        background: 'transparent',
        foreground: theme.colors.textSecondary,
        border: 'transparent',
        pressedBackground: theme.colors.surfaceSubtle,
        pressedBorder: 'transparent'
      };
    case 'danger':
      return {
        background: theme.colors.danger,
        foreground: theme.colors.textOnDanger,
        border: theme.colors.danger,
        pressedBackground: theme.colors.dangerHover,
        pressedBorder: theme.colors.dangerHover
      };
    case 'primary':
    default:
      return {
        background: theme.colors.primary,
        foreground: theme.colors.textOnPrimary,
        border: theme.colors.primary,
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
