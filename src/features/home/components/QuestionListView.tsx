import { Ionicons } from '@expo/vector-icons';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useState, type Ref } from 'react';
import {
  Keyboard,
  Modal,
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

const sortOptions: {
  value: QuestionMemoSort;
  label: string;
}[] = [
  {
    value: 'titleAsc',
    label: 'タイトル名'
  },
  {
    value: 'updatedAtDesc',
    label: '更新日'
  },
  {
    value: 'createdAtDesc',
    label: '追加日'
  }
];

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
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="質問の並び替え"
          onPress={() => setSortMenuVisible(true)}
          style={({ pressed }) => [
            styles.sortTrigger,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            },
            pressed && styles.pressed
          ]}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={18}
            color={theme.colors.textMuted}
          />
        </Pressable>
      </View>
      <Modal
        animationType="fade"
        transparent
        visible={sortMenuVisible}
        onRequestClose={() => setSortMenuVisible(false)}
      >
        <View style={[styles.menuRoot, { backgroundColor: theme.colors.overlay }]}>
          <Pressable
            accessibilityLabel="並び替えメニューを閉じる"
            style={StyleSheet.absoluteFill}
            onPress={() => setSortMenuVisible(false)}
          />
          <View
            style={[
              styles.sortMenu,
              theme.shadows.floating,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            <Text style={[styles.menuTitle, { color: theme.colors.textSecondary }]}>
              並び替え
            </Text>
            {sortOptions.map((option) => {
              const selected = option.value === sort;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    if (!selected) {
                      onSortChange(option.value);
                    }
                    setSortMenuVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.sortMenuItem,
                    pressed && { backgroundColor: theme.colors.surfaceSubtle }
                  ]}
                >
                  <Text
                    style={[
                      styles.sortMenuText,
                      { color: selected ? accentColor : theme.colors.textPrimary }
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark" size={18} color={accentColor} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderEmpty = () => {
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
  };

  return (
    <View style={styles.root}>
      {renderControls()}
      <FlashList
        ref={listRef}
        data={entries}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingBottom: bottomPadding,
          paddingHorizontal: contentPadding,
          paddingTop: 0
        }}
        onScrollBeginDrag={Keyboard.dismiss}
        keyExtractor={(item) => `${item.company.id}:${item.questionAnswer.id}`}
        renderItem={({ item }) => (
          <View style={containerStyle}>
            <QuestionMemoRow
              entry={item}
              theme={theme}
              accentColor={accentColor}
              onPress={() => onOpenQuestion(item)}
              onOpenCompany={() => onOpenCompany(item)}
              onDelete={() => onDelete(item)}
            />
          </View>
        )}
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
  sortTrigger: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 34,
    width: 40
  },
  menuRoot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  sortMenu: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 320,
    overflow: 'hidden',
    paddingVertical: 8,
    width: '100%'
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    paddingBottom: 6,
    paddingHorizontal: 16,
    paddingTop: 6
  },
  sortMenuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 16
  },
  sortMenuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19
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
