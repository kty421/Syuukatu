import { memo } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { IconButton } from '../../../ui/IconButton';
import { applicationTypeLabels } from '../types';
import { formatUpdatedAt } from '../utils/companyUtils';
import { QuestionMemoEntry, QuestionMemoStatus } from '../utils/questionMemoUtils';

type QuestionMemoRowProps = {
  entry: QuestionMemoEntry;
  theme: AppTheme;
  accentColor: string;
  onPress: () => void;
  onOpenCompany: () => void;
  onDelete: () => void;
};

export const QuestionMemoRow = memo(({
  entry,
  theme,
  accentColor,
  onPress,
  onOpenCompany,
  onDelete
}: QuestionMemoRowProps) => {
  const { company, questionAnswer } = entry;
  const statusMeta = getStatusMeta(entry.status);
  const updatedAt = formatUpdatedAt(
    questionAnswer.updatedAt || questionAnswer.createdAt || company.updatedAt
  );

  const runChildAction =
    (handler: () => void) => (event: GestureResponderEvent) => {
      event.stopPropagation();
      handler();
    };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${questionAnswer.question || '題目未入力'}を開く`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        },
        pressed && { backgroundColor: theme.colors.surfaceSubtle }
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text
            numberOfLines={2}
            style={[styles.questionTitle, { color: theme.colors.textPrimary }]}
          >
            {questionAnswer.question.trim() || '題目未入力'}
          </Text>
          <View style={styles.metaRow}>
            <Text
              numberOfLines={1}
              style={[styles.companyName, { color: accentColor }]}
            >
              {company.companyName}
            </Text>
            <Text style={[styles.dot, { color: theme.colors.textDisabled }]}>/</Text>
            <Text
              numberOfLines={1}
              style={[styles.metaText, { color: theme.colors.textMuted }]}
            >
              {applicationTypeLabels[company.type]}
            </Text>
            <Text style={[styles.dot, { color: theme.colors.textDisabled }]}>/</Text>
            <Text
              numberOfLines={1}
              style={[styles.metaText, { color: theme.colors.textMuted }]}
            >
              {company.status}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <IconButton
            icon="business-outline"
            label={`${company.companyName}を編集`}
            onPress={runChildAction(onOpenCompany)}
            theme={theme}
            tone="accent"
            variant="plain"
            accentColor={accentColor}
            size="compact"
            iconSize={17}
          />
          <IconButton
            icon="trash-outline"
            label="質問メモを削除"
            onPress={runChildAction(onDelete)}
            theme={theme}
            tone="danger"
            variant="plain"
            size="compact"
            iconSize={17}
          />
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerLeft}>
          <View
            style={[
              styles.statePill,
              {
                backgroundColor: statusMeta.background(theme),
                borderColor: statusMeta.border(theme)
              }
            ]}
          >
            <Text
              style={[
                styles.statePillText,
                { color: statusMeta.foreground(theme) }
              ]}
            >
              {statusMeta.label}
            </Text>
          </View>
          {company.tags.slice(0, 2).map((tag) => (
            <View
              key={tag}
              style={[
                styles.tagPill,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border
                }
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.tagText, { color: theme.colors.textMuted }]}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>
        {updatedAt ? (
          <Text style={[styles.updatedAt, { color: theme.colors.textDisabled }]}>
            {updatedAt}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

const getStatusMeta = (status: QuestionMemoStatus) => {
  switch (status) {
    case 'answered':
      return {
        label: '回答済み',
        background: (theme: AppTheme) => theme.colors.primary,
        border: (theme: AppTheme) => theme.colors.primary,
        foreground: (theme: AppTheme) => theme.colors.textOnPrimary
      };
    case 'unanswered':
    default:
      return {
        label: '未回答',
        background: (theme: AppTheme) => theme.colors.surface,
        border: (theme: AppTheme) => theme.colors.primaryBorder,
        foreground: (theme: AppTheme) => theme.colors.primary
      };
  }
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8
  },
  titleBlock: {
    flex: 1,
    minWidth: 0
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 5,
    minHeight: 17
  },
  companyName: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    minWidth: 0
  },
  dot: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15
  },
  metaText: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 0,
    marginRight: -4
  },
  footerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 8
  },
  footerLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0
  },
  statePill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  statePillText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14
  },
  tagPill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 104,
    paddingHorizontal: 7,
    paddingVertical: 2
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14
  },
  updatedAt: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 3
  }
});
