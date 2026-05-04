import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppTheme } from '../../../constants/theme';

export type MainTab = 'companies' | 'questions';

type BottomNavigationProps = {
  value: MainTab;
  theme: AppTheme;
  onChange: (value: MainTab) => void;
  style?: StyleProp<ViewStyle>;
};

const items: {
  value: MainTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'companies', label: '企業', icon: 'business-outline' },
  { value: 'questions', label: '質問', icon: 'chatbubbles-outline' }
];

const webCursor =
  Platform.OS === 'web'
    ? ({ cursor: 'pointer', outlineStyle: 'none' } as unknown as ViewStyle)
    : null;

export const BottomNavigation = ({
  value,
  theme,
  onChange,
  style
}: BottomNavigationProps) => {
  const palette = getNavigationPalette(theme);

  return (
    <View
      style={[
        styles.container,
        theme.shadows.floating,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        },
        style
      ]}
    >
      {items.map((item) => {
        const selected = item.value === value;

        return (
          <NavigationItem
            key={item.value}
            icon={item.icon}
            label={item.label}
            selected={selected}
            theme={theme}
            palette={palette}
            onPress={() => onChange(item.value)}
          />
        );
      })}
    </View>
  );
};

const NavigationItem = ({
  icon,
  label,
  selected,
  theme,
  palette,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  selected: boolean;
  theme: AppTheme;
  palette: ReturnType<typeof getNavigationPalette>;
  onPress: () => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}タブ`}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        webCursor,
        selected && { backgroundColor: palette.selectedBackground },
        hovered && !selected && { backgroundColor: theme.colors.surfaceSubtle },
        focused && { borderColor: theme.colors.focusRing, borderWidth: 1 },
        pressed && styles.pressed
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={selected ? palette.selected : theme.colors.textDisabled}
      />
      <Text
        style={[
          styles.label,
          { color: selected ? palette.selected : theme.colors.textMuted }
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export const getNavigationPalette = (theme: AppTheme) => ({
  selected: theme.colors.selected,
  selectedBackground: theme.colors.primarySubtle
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    height: 64,
    overflow: 'hidden',
    padding: 6,
    position: 'absolute'
  },
  item: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17
  },
  pressed: {
    opacity: 0.82
  }
});
