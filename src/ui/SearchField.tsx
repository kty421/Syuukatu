import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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

const webButtonCursor =
  Platform.OS === 'web'
    ? ({ cursor: 'pointer' } as unknown as ViewStyle)
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
}: SearchFieldProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: focused ? theme.colors.focusRing : theme.colors.border,
          borderRadius: theme.radii.md,
          minHeight: theme.component.controlHeight,
          paddingHorizontal: theme.spacing.md
        }
      ]}
    >
      <Ionicons name="search" size={18} color={theme.colors.textMuted} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
        style={[
          styles.input,
          webInputOutlineReset,
          theme.typography.body,
          {
            color: theme.colors.textPrimary,
            minHeight: theme.component.controlHeight
          }
        ]}
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
            webButtonCursor,
            { borderRadius: theme.radii.sm },
            pressed && { backgroundColor: theme.colors.surfaceSubtle }
          ]}
        >
          <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    overflow: 'hidden'
  },
  input: {
    flex: 1,
    paddingHorizontal: 10
  },
  clearButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28
  }
});
