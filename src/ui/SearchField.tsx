import { Ionicons } from '@expo/vector-icons';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';

import { AppTheme } from '../constants/theme';

const webInputOutlineReset =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none', outlineWidth: 0 } as unknown as TextStyle)
    : null;

const webButtonOutlineReset =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none', outlineWidth: 0 } as unknown as ViewStyle)
    : null;

type SearchFieldProps = {
  value: string;
  placeholder: string;
  theme: AppTheme;
  onChangeText: (value: string) => void;
  onClear: () => void;
};

export const SearchField = ({
  value,
  placeholder,
  theme,
  onChangeText,
  onClear
}: SearchFieldProps) => (
  <View
    style={[
      styles.container,
      {
        backgroundColor: theme.colors.surfaceElevated,
        borderColor: theme.colors.outline
      }
    ]}
  >
    <Ionicons name="search" size={18} color={theme.colors.textSubtle} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      style={[styles.input, webInputOutlineReset, { color: theme.colors.text }]}
    />
    {value.length > 0 ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="検索語を消す"
        hitSlop={8}
        onPress={onClear}
        android_ripple={
          Platform.OS === 'android'
            ? { color: theme.colors.surfacePressed, borderless: true }
            : undefined
        }
        style={({ pressed }) => [
          styles.clearButton,
          webButtonOutlineReset,
          pressed && styles.pressed
        ]}
      >
        <Ionicons name="close-circle" size={18} color={theme.colors.textSubtle} />
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 16
  },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 10
  },
  clearButton: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28
  },
  pressed: {
    opacity: 0.76
  }
});
