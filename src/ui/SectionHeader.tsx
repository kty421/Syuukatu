import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '../constants/theme';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  count?: number;
  theme: AppTheme;
  actionLabel?: string;
  onActionPress?: () => void;
};

export const SectionHeader = ({
  eyebrow,
  title,
  count,
  theme,
  actionLabel,
  onActionPress
}: SectionHeaderProps) => (
  <View style={styles.row}>
    <View style={styles.textBlock}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: theme.colors.textSubtle }]}>
          {eyebrow}
        </Text>
      ) : null}
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {typeof count === 'number' ? (
          <View
            style={[
              styles.countPill,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.outline
              }
            ]}
          >
            <Text style={[styles.countText, { color: theme.colors.textMuted }]}>
              {count}
            </Text>
          </View>
        ) : null}
      </View>
    </View>

    {actionLabel && onActionPress ? (
      <Pressable
        accessibilityRole="button"
        onPress={onActionPress}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        <Text style={[styles.actionLabel, { color: theme.colors.primary }]}>
          {actionLabel}
        </Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  textBlock: {
    flex: 1
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 23
  },
  countPill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    textAlign: 'center'
  },
  action: {
    minHeight: 36,
    justifyContent: 'center',
    paddingLeft: 12
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16
  },
  pressed: {
    opacity: 0.74
  }
});
