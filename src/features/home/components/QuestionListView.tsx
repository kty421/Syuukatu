import { Ionicons } from '@expo/vector-icons';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { memo, useCallback, useMemo, type Ref } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { FilterChip } from '../../../ui/FilterChip';
import { SectionHeader } from '../../../ui/SectionHeader';
import { QuestionLabel } from '../types';
import {
  QuestionMemoEntry,
  QuestionMemoSort,
  UNASSIGNED_COMPANY_TITLE
} from '../utils/questionMemoUtils';
import { QuestionMemoRow } from './QuestionMemoRow';
import { QuestionSortMenu } from './QuestionSortMenu';

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
  onLabelFilterChange: (labelId: string | null) => void;
  onCreateLabelPress: () => void;
  onSortChange: (sort: QuestionMemoSort) => void;
  onClearQuery: () => void;
  onOpenQuestion: (entry: QuestionMemoEntry) => void;
  onOpenCompany: (entry: QuestionMemoEntry) => void;
  onDelete: (entry: QuestionMemoEntry) => void;
};

export type QuestionListItem =
  | {
      kind: 'section';
      id: string;
      title: string;
      count: number;
    }
  | {
      kind: 'question';
      id: string;
      entry: QuestionMemoEntry;
    };

const QUESTION_LIST_OVERRIDE_PROPS = { initialDrawBatchSize: 10 } as const;
const DISABLED_MAINTAIN_VISIBLE_CONTENT_POSITION = { disabled: true } as const;
const getQuestionListItemType = (item: QuestionListItem) => item.kind;
const keyQuestionListItem = (item: QuestionListItem) => item.id;

const getGroupKey = (entry: QuestionMemoEntry) =>
  entry.company?.id ?? '__unassigned__';

const getGroupTitle = (entry: QuestionMemoEntry) =>
  entry.company?.companyName ?? UNASSIGNED_COMPANY_TITLE;

const buildQuestionListItems = (
  entries: QuestionMemoEntry[]
): QuestionListItem[] => {
  const grouped = new Map<
    string,
    { title: string; entries: QuestionMemoEntry[] }
  >();

  for (const entry of entries) {
    const key = getGroupKey(entry);
    const group = grouped.get(key);

    if (group) {
      group.entries.push(entry);
      continue;
    }

    grouped.set(key, {
      title: getGroupTitle(entry),
      entries: [entry]
    });
  }

  return [...grouped.entries()].flatMap(([id, group]) => [
    {
      kind: 'section' as const,
      id: `section:${id}`,
      title: group.title,
      count: group.entries.length
    },
    ...group.entries.map((entry) => ({
      kind: 'question' as const,
      id: `question:${entry.questionMemo.id}`,
      entry
    }))
  ]);
};

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
  onLabelFilterChange,
  onCreateLabelPress,
  onSortChange,
  onClearQuery,
  onOpenQuestion,
  onOpenCompany,
  onDelete
}: QuestionListViewProps) => {
  const listItems = useMemo(() => buildQuestionListItems(entries), [entries]);
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
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
          style={styles.filterScroll}
        >
          <FilterChip
            label={`すべて ${totalCount}`}
            theme={theme}
            selected={!selectedLabelId}
            tint={accentColor}
            surface={accentSurface}
            border={accentBorder}
            onPress={() => onLabelFilterChange(null)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ラベルを追加"
            onPress={onCreateLabelPress}
            style={({ pressed }) => [
              styles.addLabelButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              },
              pressed && styles.pressed
            ]}
          >
            <Ionicons name="add" size={18} color={accentColor} />
          </Pressable>
          {labels.map((label) => (
            <FilterChip
              key={label.id}
              label={label.name}
              theme={theme}
              selected={selectedLabelId === label.id}
              tint={accentColor}
              surface={accentSurface}
              border={accentBorder}
              onPress={() => onLabelFilterChange(label.id)}
            />
          ))}
        </ScrollView>
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
      if (item.kind === 'section') {
        return (
          <View style={[containerStyle, styles.sectionHeader]}>
            <SectionHeader title={item.title} count={item.count} theme={theme} />
          </View>
        );
      }

      return (
        <QuestionMemoListItem
          entry={item.entry}
          theme={theme}
          accentColor={accentColor}
          containerStyle={containerStyle}
          onOpenQuestion={onOpenQuestion}
          onOpenCompany={onOpenCompany}
          onDelete={onDelete}
        />
      );
    },
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

const webPointer =
  Platform.OS === 'web'
    ? ({ cursor: 'pointer' } as unknown as ViewStyle)
    : null;

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
  filterScroll: {
    flex: 1,
    minWidth: 0
  },
  filterChips: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4
  },
  addLabelButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 36,
    overflow: 'hidden',
    ...(webPointer ?? {})
  },
  sectionHeader: {
    marginTop: 14
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
