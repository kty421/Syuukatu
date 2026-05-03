import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { FullScreenModalShell } from '../../../ui/FullScreenModalShell';
import { Company } from '../types';

type QuestionCompanyPickerModalProps = {
  visible: boolean;
  companies: Company[];
  theme: AppTheme;
  accentColor: string;
  accentSurface: string;
  onClose: () => void;
  onSelect: (company: Company) => void;
};

export const QuestionCompanyPickerModal = ({
  visible,
  companies,
  theme,
  accentColor,
  accentSurface,
  onClose,
  onSelect
}: QuestionCompanyPickerModalProps) => (
  <FullScreenModalShell
    visible={visible}
    title="企業を選択"
    theme={theme}
    onClose={onClose}
  >
    <ScrollView
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.surface,
          theme.shadows.surface,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }
        ]}
      >
        {companies.length > 0 ? (
          companies.map((company, index) => (
            <View key={company.id}>
              {index > 0 ? (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.divider }
                  ]}
                />
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${company.companyName}に質問メモを追加`}
                onPress={() => onSelect(company)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: theme.colors.surfaceSubtle }
                ]}
              >
                <View style={styles.rowText}>
                  <Text
                    numberOfLines={1}
                    style={[styles.companyName, { color: theme.colors.textPrimary }]}
                  >
                    {company.companyName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.metaText, { color: theme.colors.textMuted }]}
                  >
                    {company.status} / 質問{company.questionAnswers?.length ?? 0}件
                  </Text>
                </View>
                <View
                  style={[
                    styles.selectPill,
                    { backgroundColor: accentSurface }
                  ]}
                >
                  <Text style={[styles.selectText, { color: accentColor }]}>
                    選択
                  </Text>
                </View>
              </Pressable>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              企業がありません
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  </FullScreenModalShell>
);

const styles = StyleSheet.create({
  body: {
    alignSelf: 'center',
    maxWidth: 760,
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    width: '100%'
  },
  surface: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden'
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  rowText: {
    flex: 1,
    minWidth: 0
  },
  companyName: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 4
  },
  selectPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  selectText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    padding: 24
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center'
  }
});
