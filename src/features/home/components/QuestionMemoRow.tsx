import { memo } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { IconButton } from '../../../ui/IconButton';
import { formatUpdatedAt } from '../utils/companyUtils';
import {
  QuestionMemoEntry,
  UNASSIGNED_COMPANY_TITLE
} from '../utils/questionMemoUtils';

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
  const { company, questionMemo, labels } = entry;
  const updatedAt = formatUpdatedAt(
    questionMemo.updatedAt || questionMemo.createdAt
  );
  const companyName = company?.companyName ?? UNASSIGNED_COMPANY_TITLE;

  const runChildAction =
    (handler: () => void) => (event: GestureResponderEvent) => {
      event.stopPropagation();
      handler();
    };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${questionMemo.question || '題目未入力'}を開く`}
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
            {questionMemo.question.trim() || '題目未入力'}
          </Text>
          <View style={styles.metaRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.companyName,
                { color: company ? accentColor : theme.colors.textMuted }
              ]}
            >
              {companyName}
            </Text>
            {labels.length > 0 ? (
              <View style={styles.labelPills}>
                {labels.map((label) => (
                  <View
                    key={label.id}
                    style={[
                      styles.labelPill,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.primaryBorder
                      }
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.labelText, { color: theme.colors.primary }]}
                    >
                      {label.name}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          {company ? (
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
          ) : null}
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

      {updatedAt ? (
        <View style={styles.footerRow}>
          <Text style={[styles.updatedAt, { color: theme.colors.textDisabled }]}>
            {updatedAt}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
});

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
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    marginTop: 5,
    minHeight: 20
  },
  companyName: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    minWidth: 0
  },
  labelPills: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    minWidth: 0
  },
  labelPill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 120,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 0,
    marginRight: -4
  },
  footerRow: {
    alignItems: 'flex-end',
    marginTop: 8
  },
  updatedAt: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14
  }
});
