import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';

import { AppTheme } from '../../../constants/theme';
import { FullScreenModalShell } from '../../../ui/FullScreenModalShell';
import { QuestionLabel } from '../types';

type QuestionLabelSettingsModalProps = {
  visible: boolean;
  labels: QuestionLabel[];
  theme: AppTheme;
  onClose: () => void;
  onCreateLabel: () => void;
  onReorderLabels: (labels: QuestionLabel[]) => void;
  onDeleteLabel: (labelId: string) => void;
};

type LabelRowProps = {
  label: QuestionLabel;
  dragging: boolean;
  theme: AppTheme;
  onDragStart: (labelId: string) => void;
  onDragMove: (labelId: string, dy: number) => void;
  onDragEnd: () => void;
  onDelete: (labelId: string) => void;
};

const ROW_DRAG_DISTANCE = 52;

const webCursor =
  Platform.OS === 'web' ? ({ cursor: 'grab' } as unknown as ViewStyle) : null;

const clampIndex = (value: number, max: number) =>
  Math.min(Math.max(value, 0), max);

export const QuestionLabelSettingsModal = ({
  visible,
  labels,
  theme,
  onClose,
  onCreateLabel,
  onReorderLabels,
  onDeleteLabel
}: QuestionLabelSettingsModalProps) => {
  const [orderedLabels, setOrderedLabels] = useState(labels);
  const [draggingLabelId, setDraggingLabelId] = useState<string | null>(null);
  const orderedLabelsRef = useRef(labels);
  const dragStateRef = useRef<{
    labelId: string;
    startIndex: number;
    lastTargetIndex: number;
    moved: boolean;
  } | null>(null);

  const setOrderedLabelsState = useCallback(
    (nextLabels: QuestionLabel[]) => {
      orderedLabelsRef.current = nextLabels;
      setOrderedLabels(nextLabels);
    },
    []
  );

  useEffect(() => {
    if (!visible || draggingLabelId) {
      return;
    }

    setOrderedLabelsState(labels);
  }, [draggingLabelId, labels, setOrderedLabelsState, visible]);

  const startDrag = useCallback((labelId: string) => {
    const startIndex = orderedLabelsRef.current.findIndex(
      (label) => label.id === labelId
    );

    if (startIndex < 0) {
      return;
    }

    dragStateRef.current = {
      labelId,
      startIndex,
      lastTargetIndex: startIndex,
      moved: false
    };
    setDraggingLabelId(labelId);
  }, []);

  const moveDrag = useCallback(
    (labelId: string, dy: number) => {
      const dragState = dragStateRef.current;

      if (!dragState || dragState.labelId !== labelId) {
        return;
      }

      const maxIndex = orderedLabelsRef.current.length - 1;
      const targetIndex = clampIndex(
        dragState.startIndex + Math.round(dy / ROW_DRAG_DISTANCE),
        maxIndex
      );
      const currentIndex = orderedLabelsRef.current.findIndex(
        (label) => label.id === labelId
      );

      if (
        currentIndex < 0 ||
        targetIndex === currentIndex ||
        targetIndex === dragState.lastTargetIndex
      ) {
        return;
      }

      const nextLabels = [...orderedLabelsRef.current];
      const [movedLabel] = nextLabels.splice(currentIndex, 1);
      nextLabels.splice(targetIndex, 0, movedLabel);

      dragState.lastTargetIndex = targetIndex;
      dragState.moved = true;
      setOrderedLabelsState(nextLabels);
    },
    [setOrderedLabelsState]
  );

  const finishDrag = useCallback(() => {
    const dragState = dragStateRef.current;
    dragStateRef.current = null;
    setDraggingLabelId(null);

    if (dragState?.moved) {
      onReorderLabels(orderedLabelsRef.current);
    }
  }, [onReorderLabels]);

  return (
    <FullScreenModalShell
      visible={visible}
      title="質問ラベル詳細設定"
      theme={theme}
      onClose={onClose}
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ラベルを追加"
          onPress={onCreateLabel}
          style={({ pressed }) => [
            styles.headerAddButton,
            pressed && styles.pressed
          ]}
        >
          <Ionicons name="add" size={21} color={theme.colors.primary} />
        </Pressable>
      }
    >
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {orderedLabels.length > 0 ? (
          <View style={styles.list}>
            {orderedLabels.map((label) => (
              <LabelRow
                key={label.id}
                label={label}
                dragging={draggingLabelId === label.id}
                theme={theme}
                onDragStart={startDrag}
                onDragMove={moveDrag}
                onDragEnd={finishDrag}
                onDelete={onDeleteLabel}
              />
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              ラベルはありません
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.colors.textMuted }]}>
              右上の追加ボタンから作成できます
            </Text>
          </View>
        )}
      </ScrollView>
    </FullScreenModalShell>
  );
};

const LabelRow = ({
  label,
  dragging,
  theme,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDelete
}: LabelRowProps) => {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dy) > 2,
        onPanResponderGrant: () => onDragStart(label.id),
        onPanResponderMove: (_event, gestureState) =>
          onDragMove(label.id, gestureState.dy),
        onPanResponderRelease: onDragEnd,
        onPanResponderTerminate: onDragEnd
      }),
    [label.id, onDragEnd, onDragMove, onDragStart]
  );

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: dragging
            ? theme.colors.primarySubtle
            : theme.colors.surface,
          borderColor: dragging ? theme.colors.primaryBorder : theme.colors.border
        }
      ]}
    >
      <View
        accessibilityLabel={`${label.name}を並び替え`}
        accessibilityRole="adjustable"
        style={[styles.dragHandle, webCursor]}
        {...panResponder.panHandlers}
      >
        <Ionicons name="menu" size={19} color={theme.colors.textSecondary} />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.labelName, { color: theme.colors.textPrimary }]}
      >
        {label.name}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label.name}を削除`}
        onPress={() => onDelete(label.id)}
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && styles.pressed
        ]}
      >
        <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    alignSelf: 'center',
    maxWidth: 760,
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    width: '100%'
  },
  headerAddButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 34
  },
  list: {
    gap: 8
  },
  row: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 8
  },
  dragHandle: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38
  },
  labelName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
    minWidth: 0
  },
  deleteButton: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 24
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center'
  },
  emptyDescription: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.72
  }
});
