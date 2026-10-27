import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useMemo, useState, type Ref, type ReactNode } from 'react';
import {
  Animated,
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { IconButton } from '../../../ui/IconButton';
import { QuestionLabel } from '../types';
import {
  QuestionMemoEntry,
  QuestionMemoSort
} from '../utils/questionMemoUtils';
import { QuestionMemoRow } from './QuestionMemoRow';
import { QuestionSortMenu } from './QuestionSortMenu';
import { QuestionLabelFilterModal } from './QuestionLabelFilterModal';
import { BulkSelectableRow } from './BulkSelectableRow';
import { BulkSelectionTopControl } from './BulkSelectionControls';

type QuestionListViewProps = {
  entries: QuestionMemoEntry[];
  labels: QuestionLabel[];
  totalCount: number;
  selectedLabelId: string | null;
  sort: QuestionMemoSort;
  query: string;
  isLoading: boolean;
  theme: AppTheme;
  accentColor: string;
  accentSurface: string;
  accentBorder: string;
  contentPadding: number;
  bottomPadding: number;
  containerStyle: ViewStyle;
  listRef?: Ref<FlashListRef<QuestionListItem>>;
  selectionActive: boolean;
  selectionDisabled: boolean;
  selectionProgress: Animated.Value;
  selectedQuestionIds: ReadonlySet<string>;
  bulkActions?: ReactNode;
  onLabelFilterChange: (labelId: string | null) => void;
  onSortChange: (sort: QuestionMemoSort) => void;
  onClearQuery: () => void;
  onOpenQuestion: (entry: QuestionMemoEntry) => void;
  onOpenCompany: (entry: QuestionMemoEntry) => void;
  onDelete: (entry: QuestionMemoEntry) => void;
  onToggleSelectionMode: () => void;
  onToggleSelection: (id: string) => void;
};

export type QuestionListItem =
  {
    kind: 'question';
    id: string;
    entry: QuestionMemoEntry;
  };

const QUESTION_LIST_OVERRIDE_PROPS = { initialDrawBatchSize: 10 } as const;
const DISABLED_MAINTAIN_VISIBLE_CONTENT_POSITION = { disabled: true } as const;
const getQuestionListItemType = (item: QuestionListItem) => item.kind;
const keyQuestionListItem = (item: QuestionListItem) => item.id;

const buildQuestionListItems = (
  entries: QuestionMemoEntry[]
): QuestionListItem[] =>
  entries.map((entry) => ({
    kind: 'question' as const,
    id: `question:${entry.questionMemo.id}`,
    entry
  }));

type QuestionMemoListItemProps = {
  entry: QuestionMemoEntry;
  theme: AppTheme;
  accentColor: string;
  containerStyle: ViewStyle;
  selectionActive: boolean;
  selectionProgress: Animated.Value;
  selected: boolean;
  onOpenQuestion: (entry: QuestionMemoEntry) => void;
  onOpenCompany: (entry: QuestionMemoEntry) => void;
  onDelete: (entry: QuestionMemoEntry) => void;
  onToggleSelection: (id: string) => void;
};

const QuestionMemoListItem = memo(
  ({
    entry,
    theme,
    accentColor,
    containerStyle,
    selectionActive,
    selectionProgress,
    selected,
    onOpenQuestion,
    onOpenCompany,
    onDelete,
    onToggleSelection
  }: QuestionMemoListItemProps) => {
    const handlePress = useCallback(
      () => onOpenQuestion(entry),
      [entry, onOpenQuestion]
    );
    const handleOpenCompany = useCallback(
      () => onOpenCompany(entry),
      [entry, onOpenCompany]
    );
    const handleDelete = useCallback(() => onDelete(entry), [entry, onDelete]);
    const handleToggleSelection = useCallback(
      () => onToggleSelection(entry.questionMemo.id),
      [entry.questionMemo.id, onToggleSelection]
    );

    return (
      <BulkSelectableRow
        active={selectionActive}
        label={`${entry.questionMemo.question || '題目未入力'}を${
          selected ? '選択解除' : '選択'
        }`}
        progress={selectionProgress}
        selected={selected}
        style={containerStyle}
        theme={theme}
        onToggle={handleToggleSelection}
      >
        <QuestionMemoRow
          entry={entry}
          theme={theme}
          accentColor={accentColor}
          hideDeleteAction={selectionActive}
          selected={selected}
          onPress={handlePress}
          onOpenCompany={handleOpenCompany}
          onDelete={handleDelete}
        />
      </BulkSelectableRow>
    );
  }
);

export const QuestionListView = ({
  entries,
  labels,
  totalCount,
  selectedLabelId,
  sort,
  query,
  isLoading,
  theme,
  accentColor,
  accentSurface,
  accentBorder,
  contentPadding,
  bottomPadding,
  containerStyle,
  listRef,
  selectionActive,
  selectionDisabled,
  selectionProgress,
  selectedQuestionIds,
  bulkActions,
  onLabelFilterChange,
  onSortChange,
  onClearQuery,
  onOpenQuestion,
  onOpenCompany,
  onDelete,
  onToggleSelectionMode,
  onToggleSelection
}: QuestionListViewProps) => {
  const [labelFilterVisible, setLabelFilterVisible] = useState(false);
  const selectedLabel = labels.find((label) => label.id === selectedLabelId);
  const listItems = useMemo(() => buildQuestionListItems(entries), [entries]);
  const contentContainerStyle = useMemo(
    () => ({ paddingBottom: bottomPadding, paddingHorizontal: contentPadding, paddingTop: 0 }),
    [bottomPadding, contentPadding]
  );
  const selectLabelFilter = (id: string | null) => {
    Keyboard.dismiss();
    if (id !== selectedLabelId) onLabelFilterChange(id);
    setLabelFilterVisible(false);
  };

  const renderControls = () => (
    <View style={[styles.controlShell, { paddingHorizontal: contentPadding }]}>
      <View style={[containerStyle, styles.filterBar]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`ラベルで絞り込み：${selectedLabel?.name ?? 'すべて'}`}
          accessibilityState={{ expanded: labelFilterVisible }}
          aria-expanded={labelFilterVisible}
          onPress={() => { Keyboard.dismiss(); setLabelFilterVisible(true); }}
          style={({ pressed }) => [styles.labelFilterButton, {
            backgroundColor: selectedLabelId ? accentSurface : theme.colors.surface,
            borderColor: selectedLabelId ? accentBorder : theme.colors.border,
          }, pressed && styles.pressed]}>
          <Text numberOfLines={1} style={[theme.typography.label, styles.filterText, {
            color: selectedLabelId ? accentColor : theme.colors.textPrimary,
          }]}>ラベル：{selectedLabel?.name ?? 'すべて'}</Text>
          <Ionicons name="chevron-down" size={16} color={accentColor} />
        </Pressable>
        {selectedLabelId ? (
          <IconButton icon="close" label="ラベルの絞り込みを解除" tooltip="ラベルの絞り込みを解除"
            theme={theme} tone="accent" variant="plain" onPress={() => selectLabelFilter(null)} />
        ) : null}
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>全{totalCount}件</Text>
        <QuestionSortMenu value={sort} theme={theme} accentColor={accentColor} onChange={onSortChange} />
      </View>
    </View>
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={[containerStyle, styles.emptyState]}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textMuted }]}>
            読み込み中
          </Text>
        </View>
      );
    }

    if (!query.trim() && totalCount === 0) {
      return (
        <View style={[containerStyle, styles.emptyState]}>
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
            登録済みの質問はありません
          </Text>
          <Text style={[styles.emptyDescription, { color: theme.colors.textMuted }]}>
            企業の追加・編集画面から質問を登録できます
          </Text>
        </View>
      );
    }

    return (
      <View style={[containerStyle, styles.emptyState]}>
        <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
          一致する質問がありません
        </Text>
        {query.trim() ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="検索をクリア"
            onPress={onClearQuery}
            style={({ pressed }) => [
              styles.clearSearchButton,
              pressed && styles.pressed
            ]}
          >
            <Text style={[styles.clearSearchText, { color: accentColor }]}>
              検索をクリア
            </Text>
          </Pressable>
        ) : selectedLabelId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="質問フィルタをリセット"
            onPress={() => onLabelFilterChange(null)}
            style={({ pressed }) => [
              styles.clearSearchButton,
              pressed && styles.pressed
            ]}
          >
            <Text style={[styles.clearSearchText, { color: accentColor }]}>
              すべて表示
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }, [
    accentColor,
    containerStyle,
    isLoading,
    onClearQuery,
    onLabelFilterChange,
    query,
    selectedLabelId,
    theme,
    totalCount
  ]);

  const renderQuestionItem = useCallback(
    ({ item }: { item: QuestionListItem }) => {
      return (
        <QuestionMemoListItem
          entry={item.entry}
          theme={theme}
          accentColor={accentColor}
          containerStyle={containerStyle}
          selectionActive={selectionActive}
          selectionProgress={selectionProgress}
          selected={selectedQuestionIds.has(item.entry.questionMemo.id)}
          onOpenQuestion={onOpenQuestion}
          onOpenCompany={onOpenCompany}
          onDelete={onDelete}
          onToggleSelection={onToggleSelection}
        />
      );
    },
    [
      accentColor,
      containerStyle,
      onDelete,
      onOpenCompany,
      onOpenQuestion,
      onToggleSelection,
      selectedQuestionIds,
      selectionActive,
      selectionProgress,
      theme
    ]
  );

  return (
    <View style={styles.root}>
      {renderControls()}
      {labelFilterVisible ? (
        <QuestionLabelFilterModal labels={labels} selectedLabelId={selectedLabelId} totalCount={totalCount}
          theme={theme} onSelect={selectLabelFilter} onClose={() => { Keyboard.dismiss(); setLabelFilterVisible(false); }} />
      ) : null}
      <View
        style={[
          styles.bulkControlShell,
          { paddingHorizontal: contentPadding }
        ]}
      >
        <View style={containerStyle}>
          <BulkSelectionTopControl
            active={selectionActive}
            disabled={selectionDisabled}
            theme={theme}
            onToggle={onToggleSelectionMode}
          />
          {selectionActive ? bulkActions : null}
        </View>
      </View>
      <FlashList
        ref={listRef}
        data={listItems}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={contentContainerStyle}
        drawDistance={640}
        getItemType={getQuestionListItemType}
        keyExtractor={keyQuestionListItem}
        maintainVisibleContentPosition={
          DISABLED_MAINTAIN_VISIBLE_CONTENT_POSITION
        }
        onScrollBeginDrag={Keyboard.dismiss}
        overrideProps={QUESTION_LIST_OVERRIDE_PROPS}
        renderItem={renderQuestionItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  controlShell: {
    paddingTop: 4
  },
  filterBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  labelFilterButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 12,
  },
  filterText: { flex: 1, minWidth: 0 },
  bulkControlShell: { paddingBottom: 0 },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    minHeight: 212,
    paddingHorizontal: 24
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center'
  },
  emptyDescription: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center'
  },
  clearSearchButton: {
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 12
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16
  },
  pressed: {
    opacity: 0.72
  }
});
