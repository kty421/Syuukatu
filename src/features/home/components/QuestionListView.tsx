import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { memo, useCallback, useMemo, type Ref } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { FilterChip } from '../../../ui/FilterChip';
import {
  QuestionMemoEntry,
  QuestionMemoFilter,
  QuestionMemoSort
} from '../utils/questionMemoUtils';
import { QuestionMemoRow } from './QuestionMemoRow';
import { QuestionSortMenu } from './QuestionSortMenu';

type QuestionListViewProps = {
  entries: QuestionMemoEntry[];
  counts: Record<QuestionMemoFilter, number>;
  filter: QuestionMemoFilter;
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
  listRef?: Ref<FlashListRef<QuestionMemoEntry>>;
  onFilterChange: (filter: QuestionMemoFilter) => void;
  onSortChange: (sort: QuestionMemoSort) => void;
  onClearQuery: () => void;
  onOpenQuestion: (entry: QuestionMemoEntry) => void;
  onOpenCompany: (entry: QuestionMemoEntry) => void;
  onDelete: (entry: QuestionMemoEntry) => void;
};

const filterOptions: { value: QuestionMemoFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'unanswered', label: '未回答' },
  { value: 'answered', label: '回答済み' }
];

const QUESTION_LIST_OVERRIDE_PROPS = { initialDrawBatchSize: 10 } as const;
const DISABLED_MAINTAIN_VISIBLE_CONTENT_POSITION = { disabled: true } as const;
const keyQuestionMemoEntry = (item: QuestionMemoEntry) =>
  `${item.company.id}:${item.questionAnswer.id}`;
const getQuestionListItemType = () => 'question';

type QuestionMemoListItemProps = {
  entry: QuestionMemoEntry;
  theme: AppTheme;
  accentColor: string;
  containerStyle: ViewStyle;
  onOpenQuestion: (entry: QuestionMemoEntry) => void;
  onOpenCompany: (entry: QuestionMemoEntry) => void;
  onDelete: (entry: QuestionMemoEntry) => void;
};

const QuestionMemoListItem = memo(
  ({
    entry,
    theme,
    accentColor,
    containerStyle,
    onOpenQuestion,
    onOpenCompany,
    onDelete
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

    return (
      <View style={containerStyle}>
        <QuestionMemoRow
          entry={entry}
          theme={theme}
          accentColor={accentColor}
          onPress={handlePress}
          onOpenCompany={handleOpenCompany}
          onDelete={handleDelete}
        />
      </View>
    );
  }
);

export const QuestionListView = ({
  entries,
  counts,
  filter,
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
  onFilterChange,
  onSortChange,
  onClearQuery,
  onOpenQuestion,
  onOpenCompany,
  onDelete
}: QuestionListViewProps) => {
  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomPadding,
      paddingHorizontal: contentPadding,
      paddingTop: 0
    }),
    [bottomPadding, contentPadding]
  );

  const renderControls = () => (
    <View style={[styles.controlShell, { paddingHorizontal: contentPadding }]}>
      <View style={[containerStyle, styles.filterBar]}>
        <View style={styles.filterChips}>
          {filterOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={`${option.label} ${counts[option.value]}`}
              theme={theme}
              selected={filter === option.value}
              tint={accentColor}
              surface={accentSurface}
              border={accentBorder}
              onPress={() => {
                if (filter !== option.value) {
                  onFilterChange(option.value);
                }
              }}
            />
          ))}
        </View>
        <QuestionSortMenu
          value={sort}
          theme={theme}
          accentColor={accentColor}
          onChange={onSortChange}
        />
      </View>
    </View>
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={[containerStyle, styles.emptyState]}>
          <Text style={[styles.emptyTitle, { color: theme.colors.textMuted }]}>
            読み込み中
          </Text>
        </View>
      );
    }

    if (!query.trim() && counts.all === 0) {
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
        ) : filter !== 'all' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="質問フィルタをリセット"
            onPress={() => onFilterChange('all')}
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
    counts.all,
    filter,
    isLoading,
    onClearQuery,
    onFilterChange,
    query,
    theme
  ]);

  const renderQuestionItem = useCallback(
    ({ item }: { item: QuestionMemoEntry }) => (
      <QuestionMemoListItem
        entry={item}
        theme={theme}
        accentColor={accentColor}
        containerStyle={containerStyle}
        onOpenQuestion={onOpenQuestion}
        onOpenCompany={onOpenCompany}
        onDelete={onDelete}
      />
    ),
    [
      accentColor,
      containerStyle,
      onDelete,
      onOpenCompany,
      onOpenQuestion,
      theme
    ]
  );

  return (
    <View style={styles.root}>
      {renderControls()}
      <FlashList
        ref={listRef}
        data={entries}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={contentContainerStyle}
        drawDistance={640}
        getItemType={getQuestionListItemType}
        keyExtractor={keyQuestionMemoEntry}
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
    paddingTop: 8
  },
  filterBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12
  },
  filterChips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minWidth: 0
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    minHeight: 260,
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
