import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

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
          borderColor: theme.colors.outline
        },
        style
      ]}
    >
      {items.map((item) => {
        const selected = item.value === value;

        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${item.label}タブ`}
            onPress={() => onChange(item.value)}
            style={({ pressed }) => [
              styles.item,
              selected && { backgroundColor: palette.selectedBackground },
              pressed && styles.pressed
            ]}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={selected ? palette.selected : theme.colors.textSubtle}
            />
            <Text
              style={[
                styles.label,
                { color: selected ? palette.selected : theme.colors.textMuted }
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const getNavigationPalette = (theme: AppTheme) => ({
  selected: theme.isDark ? '#F0A6C8' : '#9A2865',
  selectedBackground: theme.isDark ? '#3A2032' : '#F7EAF1'
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
