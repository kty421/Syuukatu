import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { AppTheme } from '../constants/theme';

type FloatingActionButtonProps = {
  theme: AppTheme;
  accentColor: string;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const FloatingActionButton = ({
  theme,
  accentColor,
  label,
  onPress,
  style
}: FloatingActionButtonProps) => (
  <Pressable
    accessibilityLabel={label}
    accessibilityRole="button"
    onPress={onPress}
    android_ripple={
      Platform.OS === 'android'
        ? { color: theme.colors.surfacePressed, borderless: true }
        : undefined
    }
    style={({ pressed }) => [
      styles.button,
      theme.shadows.floating,
      {
        backgroundColor: accentColor,
        borderColor: theme.isDark ? theme.colors.outlineStrong : 'rgba(255,255,255,0.62)'
      },
      pressed && styles.pressed,
      style
    ]}
  >
    <Ionicons name="add" size={30} color={theme.colors.onPrimary} />
  </Pressable>
);

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
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }]
  }
});
