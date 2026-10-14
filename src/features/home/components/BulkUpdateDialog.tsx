import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTheme } from '../../../constants/theme';
import { applyLabelOperation, LabelOperation } from '../../../shared/types/bulkUpdate';
import { AppButton } from '../../../ui/AppButton';
import { FullScreenModalShell } from '../../../ui/FullScreenModalShell';
import { Company, QuestionLabel, QuestionMemo, SelectionStatus } from '../types';
import { getStatusList } from '../utils/companyUtils';
import { SelectionCircle } from './SelectionCircle';

type BulkUpdateDialogProps = {
  theme: AppTheme;
  busy: boolean;
  onClose: () => void;
} & ({
  mode: 'status';
  companies: Company[];
  onApply: (status: SelectionStatus) => void;
} | {
  mode: 'labels';
  memos: QuestionMemo[];
  labels: QuestionLabel[];
  operation: LabelOperation;
  onApply: (labelIds: string[]) => void;
});

// The parent mounts a fresh dialog for each operation, so choices always start empty.
export const BulkUpdateDialog = (props: BulkUpdateDialogProps) => {
  const { theme, busy } = props;
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<SelectionStatus | null>(null);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const isStatus = props.mode === 'status';
  const title = isStatus ? '選考状況を変更'
    : props.operation === 'add' ? 'ラベルを追加' : 'ラベルを外す';
  const totalCount = isStatus ? props.companies.length : props.memos.length;
  const changedCount = isStatus
    ? status ? props.companies.filter((company) => company.status !== status).length : 0
    : props.memos.filter((memo) => {
      const next = applyLabelOperation(memo.labelIds, labelIds, props.operation);
      return next.length !== memo.labelIds.length || next.some((id) => !memo.labelIds.includes(id));
    }).length;
  const hasChoice = isStatus ? status !== null : labelIds.length > 0;
  const close = () => { if (!busy) props.onClose(); };
  const toggleLabel = (id: string) => {
    if (busy) return;
    setLabelIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  return (
    <FullScreenModalShell visible title={title} theme={theme} onClose={close} closeIcon="close">
      <View style={[styles.body, { maxWidth: theme.layout.maxContentWidth }]}>
        <Text style={[theme.typography.bodyStrong, styles.summary, { color: theme.colors.textPrimary }]}>
          {isStatus ? `企業${totalCount}社` : `質問${totalCount}件`}を選択中
        </Text>
        <ScrollView contentContainerStyle={styles.options}>
          {isStatus ? getStatusList().map((option) => (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: status === option, disabled: busy }}
              aria-checked={status === option}
              aria-disabled={busy}
              disabled={busy}
              onPress={() => setStatus(option)}
              style={({ pressed }) => [styles.option, {
                backgroundColor: status === option ? theme.colors.primarySubtle : theme.colors.surface,
                borderColor: status === option ? theme.colors.primaryBorder : theme.colors.border,
              }, pressed && styles.pressed]}>
              <SelectionCircle selected={status === option} theme={theme} />
              <Text style={[theme.typography.bodyStrong, styles.optionText, { color: theme.colors.textPrimary }]}>{option}</Text>
            </Pressable>
          )) : props.labels.length === 0 ? (
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              ラベルがありません。ラベル設定で作成してください。
            </Text>
          ) : props.labels.map((label) => {
            const count = props.memos.filter((memo) => memo.labelIds.includes(label.id)).length;
            const selected = labelIds.includes(label.id);
            return (
              <Pressable
                key={label.id}
                accessibilityLabel={`${label.name}、${totalCount}件中${count}件に付与`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled: busy }}
                aria-checked={selected}
                aria-disabled={busy}
                disabled={busy}
                onPress={() => toggleLabel(label.id)}
                style={({ pressed }) => [styles.option, {
                  backgroundColor: selected ? theme.colors.primarySubtle : theme.colors.surface,
                  borderColor: selected ? theme.colors.primaryBorder : theme.colors.border,
                }, pressed && styles.pressed]}>
                <SelectionCircle selected={selected} theme={theme} />
                <View style={styles.optionText}>
                  <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>{label.name}</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{totalCount}件中{count}件に付与</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16), borderColor: theme.colors.border }]}>
          <Text accessibilityLiveRegion="polite" style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {!hasChoice ? isStatus ? '変更先の選考状況を選択してください' : '操作するラベルを選択してください'
              : changedCount === 0 ? '変更が必要な項目はありません' : `${changedCount}${isStatus ? '社' : '件'}を変更します`}
          </Text>
          <AppButton label="適用" theme={theme} loading={busy} disabled={changedCount === 0}
            onPress={() => {
              if (busy || changedCount === 0) return;
              if (props.mode === 'status') {
                if (status) props.onApply(status);
              } else {
                props.onApply(labelIds);
              }
            }} />
          <AppButton label="キャンセル" theme={theme} variant="ghost" disabled={busy} onPress={close} />
        </View>
      </View>
    </FullScreenModalShell>
  );
};

const styles = StyleSheet.create({
  body: { alignSelf: 'center', flex: 1, width: '100%' },
  summary: { paddingHorizontal: 20, paddingVertical: 16 },
  options: { gap: 8, paddingHorizontal: 20, paddingBottom: 20 },
  option: { alignItems: 'center', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, minHeight: 52, padding: 14 },
  optionText: { flex: 1, gap: 4 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  pressed: { opacity: 0.72 },
});
