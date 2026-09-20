import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
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
  size?: 'default' | 'compact' | 'inline';
  variant?: 'filled' | 'plain';
  accentColor?: string;
  accentSurface?: string;
  disabled?: boolean;
  iconSize?: number;
  tooltip?: string;
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
  iconSize,
  tooltip
}: IconButtonProps) => {
  const compact = size === 'compact';
  const inline = size === 'inline';
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
      hitSlop={inline ? 5 : compact ? 6 : 8}
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
        tooltip && Platform.OS === 'web' && styles.tooltipHost,
        getWebCursor(disabled),
        {
          backgroundColor: plain ? 'transparent' : palette.background,
          borderColor: focused
            ? theme.colors.focusRing
            : plain
              ? 'transparent'
              : palette.border,
          borderRadius: plain ? theme.radii.sm : theme.radii.md,
          height: inline
            ? 18
            : compact
              ? theme.component.iconButtonCompactSize
              : theme.component.iconButtonSize,
          opacity: disabled ? theme.state.disabledOpacity : 1,
          width: inline
            ? 18
            : compact
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
        size={iconSize ?? (inline ? 14 : compact ? 16 : 20)}
      />
      {tooltip && Platform.OS === 'web' && (hovered || focused) ? (
        <View
          pointerEvents="none"
          style={[
            styles.tooltip,
            theme.shadows.floating,
            {
              backgroundColor: theme.colors.surfaceOverlay,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.sm
            }
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              theme.typography.caption,
              styles.tooltipText,
              { color: theme.colors.textPrimary }
            ]}
          >
            {tooltip}
          </Text>
        </View>
      ) : null}
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
  },
  tooltipHost: {
    overflow: 'visible',
    zIndex: 20
  },
  tooltip: {
    borderWidth: StyleSheet.hairlineWidth,
    bottom: '100%',
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: 'absolute',
    right: 0,
    width: 160,
    zIndex: 20
  },
  tooltipText: {
    textAlign: 'center'
  }
});
