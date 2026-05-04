import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { AppTheme } from '../constants/theme';

const webCursor =
  Platform.OS === 'web'
    ? ({ cursor: 'pointer', outlineStyle: 'none' } as unknown as ViewStyle)
    : null;

type FloatingActionButtonProps = {
  theme: AppTheme;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const FloatingActionButton = ({
  theme,
  label,
  onPress,
  style
}: FloatingActionButtonProps) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      android_ripple={
        Platform.OS === 'android'
          ? { color: theme.colors.surfacePressed, borderless: true }
          : undefined
      }
      style={({ pressed }) => [
        styles.button,
        theme.shadows.floating,
        webCursor,
        {
          backgroundColor:
            hovered && !pressed ? theme.colors.primaryHover : theme.colors.primary,
          borderColor: focused ? theme.colors.focusRing : theme.colors.primaryBorder
        },
        pressed && { backgroundColor: theme.colors.primaryPressed },
        pressed && styles.pressedScale,
        style
      ]}
    >
      <Ionicons name="add" size={30} color={theme.colors.textOnPrimary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 58,
    justifyContent: 'center',
    position: 'absolute',
    width: 58
  },
  pressedScale: {
    transform: [{ scale: 0.96 }]
  }
});
