import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useMemo, useRef, useState, type Ref } from 'react';
import {
  LayoutChangeEvent,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { FilterChip } from '../../../ui/FilterChip';
import { QuestionLabel } from '../types';
import {
  QuestionMemoEntry,
  QuestionMemoSort
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
  onSortChange: (sort: QuestionMemoSort) => void;
  onClearQuery: () => void;
  onOpenQuestion: (entry: QuestionMemoEntry) => void;
  onOpenCompany: (entry: QuestionMemoEntry) => void;
  onDelete: (entry: QuestionMemoEntry) => void;
};

export type QuestionListItem =
  {
    kind: 'question';
    id: string;
    entry: QuestionMemoEntry;
  };

const QUESTION_LIST_OVERRIDE_PROPS = { initialDrawBatchSize: 10 } as const;
const DISABLED_MAINTAIN_VISIBLE_CONTENT_POSITION = { disabled: true } as const;
const FILTER_EDGE_FADE_WIDTH = 24;
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

const withColorAlpha = (color: string, alpha: number) => {
  const hex = color.trim().match(/^#([0-9a-f]{6})$/i)?.[1];

  if (!hex) {
    return alpha === 0 ? 'transparent' : color;
  }

  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
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
  onSortChange,
  onClearQuery,
  onOpenQuestion,
  onOpenCompany,
  onDelete
}: QuestionListViewProps) => {
  const scrollMetricsRef = useRef({
    contentWidth: 0,
    scrollX: 0,
    viewportWidth: 0
  });
  const fadeVisibilityRef = useRef({
    left: false,
    right: false
  });
  const [fadeVisibility, setFadeVisibility] = useState({
    left: false,
    right: false
  });
  const listItems = useMemo(() => buildQuestionListItems(entries), [entries]);
  const softBackground = useMemo(
    () => withColorAlpha(theme.colors.background, 0.45),
    [theme.colors.background]
  );
  const transparentBackground = useMemo(
    () => withColorAlpha(theme.colors.background, 0),
    [theme.colors.background]
  );
  const leftFadeColors = useMemo(
    () => [theme.colors.background, softBackground, transparentBackground] as const,
    [softBackground, theme.colors.background, transparentBackground]
  );
  const rightFadeColors = useMemo(
    () => [transparentBackground, softBackground, theme.colors.background] as const,
    [softBackground, theme.colors.background, transparentBackground]
  );
  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomPadding,
      paddingHorizontal: contentPadding,
      paddingTop: 0
    }),
    [bottomPadding, contentPadding]
  );

  const updateFadeVisibility = useCallback(() => {
    const { contentWidth, scrollX, viewportWidth } = scrollMetricsRef.current;
    const maxScrollX = Math.max(contentWidth - viewportWidth, 0);
    const nextVisibility = {
      left: scrollX > 1,
      right: maxScrollX > 1 && scrollX < maxScrollX - 1
    };
    const currentVisibility = fadeVisibilityRef.current;

    if (
      currentVisibility.left === nextVisibility.left &&
      currentVisibility.right === nextVisibility.right
    ) {
      return;
    }

    fadeVisibilityRef.current = nextVisibility;
    setFadeVisibility(nextVisibility);
  }, []);

  const handleFilterScrollLayout = useCallback(
    (event: LayoutChangeEvent) => {
      scrollMetricsRef.current.viewportWidth = event.nativeEvent.layout.width;
      updateFadeVisibility();
    },
    [updateFadeVisibility]
  );

  const handleFilterContentSizeChange = useCallback(
    (contentWidth: number) => {
      scrollMetricsRef.current.contentWidth = contentWidth;
      updateFadeVisibility();
    },
    [updateFadeVisibility]
  );

  const handleFilterScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollMetricsRef.current.scrollX = event.nativeEvent.contentOffset.x;
      updateFadeVisibility();
    },
    [updateFadeVisibility]
  );

  const renderControls = () => (
    <View style={[styles.controlShell, { paddingHorizontal: contentPadding }]}>
      <View style={[containerStyle, styles.filterBar]}>
        <View style={styles.fixedStartChip}>
          <FilterChip
            label={`すべて ${totalCount}`}
            theme={theme}
            selected={!selectedLabelId}
            tint={accentColor}
            surface={accentSurface}
            border={accentBorder}
            onPress={() => onLabelFilterChange(null)}
          />
        </View>
        <View style={styles.leftFadeSlot}>
          <LinearGradient
            pointerEvents="none"
            colors={leftFadeColors}
            locations={[0, 0.18, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.edgeFade,
              !fadeVisibility.left && styles.hiddenFade
            ]}
          />
        </View>
        <View style={styles.filterScrollWrap}>
          <ScrollView
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
            onContentSizeChange={handleFilterContentSizeChange}
            onLayout={handleFilterScrollLayout}
            onScroll={handleFilterScroll}
            scrollEventThrottle={16}
            style={styles.filterScroll}
          >
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
        </View>
        <View style={styles.rightFadeSlot}>
          <LinearGradient
            pointerEvents="none"
            colors={rightFadeColors}
            locations={[0, 0.82, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.edgeFade,
              !fadeVisibility.right && styles.hiddenFade
            ]}
          />
        </View>
        <View style={styles.fixedEndChip}>
          <QuestionSortMenu
            value={sort}
            theme={theme}
            accentColor={accentColor}
            onChange={onSortChange}
          />
        </View>
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
    paddingBottom: 12
  },
  fixedStartChip: {
    zIndex: 3
  },
  fixedEndChip: {
    zIndex: 3
  },
  filterScroll: {
    flex: 1,
    minWidth: 0
  },
  filterScrollWrap: {
    flex: 1,
    marginHorizontal: -FILTER_EDGE_FADE_WIDTH,
    minWidth: 0,
    position: 'relative'
  },
  filterChips: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4
  },
  edgeFade: {
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: FILTER_EDGE_FADE_WIDTH,
    zIndex: 2
  },
  leftFadeSlot: {
    height: 34,
    position: 'relative',
    width: FILTER_EDGE_FADE_WIDTH,
    zIndex: 2
  },
  rightFadeSlot: {
    height: 34,
    position: 'relative',
    width: FILTER_EDGE_FADE_WIDTH,
    zIndex: 2
  },
  hiddenFade: {
    opacity: 0
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
