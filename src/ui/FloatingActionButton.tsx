import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { AppTheme } from '../constants/theme';

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
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primaryBorder
      },
      pressed && { backgroundColor: theme.colors.primaryPressed },
      pressed && styles.pressedScale,
      style
    ]}
  >
    <Ionicons name="add" size={30} color={theme.colors.textOnPrimary} />
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
  pressedScale: {
    transform: [{ scale: 0.96 }]
  }
});
