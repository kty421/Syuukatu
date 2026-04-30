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
  accentColor?: string;
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
  accentColor,
  disabled,
  loading
}: AppButtonProps) => {
  const palette = getPalette(theme, variant, accentColor);
  const compact = size === 'compact';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
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
        pressed && !disabled && !loading && styles.pressed,
        (disabled || loading) && styles.disabled
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.foreground} />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={compact ? 16 : 18} color={palette.foreground} />
          ) : null}
          <Text style={[styles.label, { color: palette.foreground }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

const getPalette = (
  theme: AppTheme,
  variant: NonNullable<AppButtonProps['variant']>,
  accentColor?: string
) => {
  switch (variant) {
    case 'secondary':
      return {
        background: theme.colors.surface,
        foreground: theme.colors.text,
        border: theme.colors.outline
      };
    case 'ghost':
      return {
        background: theme.colors.surfaceMuted,
        foreground: theme.colors.textMuted,
        border: 'transparent'
      };
    case 'danger':
      return {
        background: theme.colors.dangerSoft,
        foreground: theme.colors.danger,
        border: 'transparent'
      };
    case 'primary':
    default:
      return {
        background: accentColor ?? theme.colors.primary,
        foreground: theme.colors.onPrimary,
        border: accentColor ?? theme.colors.primary
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
  },
  pressed: {
    opacity: 0.82
  },
  disabled: {
    opacity: 0.46
  }
});
