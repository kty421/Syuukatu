import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { FullScreenModalShell } from '../../../ui/FullScreenModalShell';
import { SearchField } from '../../../ui/SearchField';
import { QuestionLabel } from '../types';
import { SelectionCircle } from './SelectionCircle';

type QuestionLabelFilterModalProps = {
  labels: QuestionLabel[];
  selectedLabelId: string | null;
  totalCount: number;
  theme: AppTheme;
  onSelect: (id: string | null) => void;
  onClose: () => void;
};

// Mounted only while open, so the search starts empty every time.
export const QuestionLabelFilterModal = ({
  labels, selectedLabelId, totalCount, theme, onSelect, onClose,
}: QuestionLabelFilterModalProps) => {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredLabels = labels.filter((label) => label.name.toLowerCase().includes(normalizedQuery));
  const option = (id: string | null, name: string) => {
    const selected = selectedLabelId === id;
    return (
      <Pressable
        key={id ?? 'all'}
        accessibilityRole="radio"
        accessibilityLabel={name}
        accessibilityState={{ checked: selected }}
        aria-checked={selected}
        onPress={() => onSelect(id)}
        style={({ pressed }) => [styles.option, {
          backgroundColor: selected ? theme.colors.primarySubtle : theme.colors.surface,
          borderColor: selected ? theme.colors.primaryBorder : theme.colors.border,
        }, pressed && { opacity: theme.state.pressedOpacity }]}>
        <SelectionCircle selected={selected} theme={theme} />
        <View style={styles.optionText}>
          <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>{name}</Text>
          {id === null ? <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>全{totalCount}件</Text> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <FullScreenModalShell visible title="ラベルで絞り込み" theme={theme} onClose={onClose} closeIcon="close">
      <View style={[styles.body, { maxWidth: theme.layout.modalMaxWidth }]}>
        <View style={styles.fixedControls}>
          <SearchField value={query} placeholder="ラベル名で検索" theme={theme} onChangeText={setQuery} onClear={() => setQuery('')} />
          {option(null, 'すべて')}
        </View>
        <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.options}>
          {filteredLabels.length > 0 ? filteredLabels.map((label) => option(label.id, label.name)) : (
            <Text style={[theme.typography.body, styles.empty, { color: theme.colors.textSecondary }]}>
              {labels.length === 0 ? 'ラベルがありません' : '一致するラベルがありません'}
            </Text>
          )}
        </ScrollView>
      </View>
    </FullScreenModalShell>
  );
};

const styles = StyleSheet.create({
  body: { alignSelf: 'center', flex: 1, width: '100%' },
  fixedControls: { gap: 12, padding: 20, paddingBottom: 12 },
  options: { gap: 8, paddingHorizontal: 20, paddingBottom: 32 },
  option: { alignItems: 'center', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, minHeight: 56, padding: 14 },
  optionText: { flex: 1, gap: 4 },
  empty: { paddingVertical: 24, textAlign: 'center' },
});
