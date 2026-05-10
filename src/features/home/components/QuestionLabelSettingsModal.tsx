import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { AppTheme } from "../../../constants/theme";
import { FullScreenModalShell } from "../../../ui/FullScreenModalShell";
import { QuestionLabel } from "../types";
import { QuestionLabelCreateDialog } from "./QuestionLabelCreateDialog";

type QuestionLabelSettingsModalProps = {
  visible: boolean;
  labels: QuestionLabel[];
  theme: AppTheme;
  onClose: () => void;
  onCreateLabel: (name: string) => Promise<QuestionLabel>;
  onUpdateLabel: (labelId: string, name: string) => Promise<QuestionLabel>;
  onReorderLabels: (labels: QuestionLabel[]) => void;
  onDeleteLabel: (labelId: string) => void;
};

type LabelRowProps = {
  label: QuestionLabel;
  dragging: boolean;
  dragOffsetY: number;
  theme: AppTheme;
  onDragStart: (labelId: string) => void;
  onDragMove: (labelId: string, dy: number) => void;
  onDragEnd: () => void;
  onEdit: (label: QuestionLabel) => void;
  onDelete: (labelId: string) => void;
};

const ROW_DRAG_DISTANCE = 52;

const webCursor =
  Platform.OS === "web" ? ({ cursor: "grab" } as unknown as ViewStyle) : null;
const webDraggingCursor =
  Platform.OS === "web" ? ({ cursor: "grabbing" } as unknown as ViewStyle) : null;

const clampIndex = (value: number, max: number) =>
  Math.min(Math.max(value, 0), max);

export const QuestionLabelSettingsModal = ({
  visible,
  labels,
  theme,
  onClose,
  onCreateLabel,
  onUpdateLabel,
  onReorderLabels,
  onDeleteLabel,
}: QuestionLabelSettingsModalProps) => {
  const [orderedLabels, setOrderedLabels] = useState(labels);
  const [draggingLabelId, setDraggingLabelId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [labelCreateVisible, setLabelCreateVisible] = useState(false);
  const [editingLabel, setEditingLabel] = useState<QuestionLabel | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<QuestionLabel | null>(null);
  const [deleteRunning, setDeleteRunning] = useState(false);
  const orderedLabelsRef = useRef(labels);
  const dragStateRef = useRef<{
    labelId: string;
    startIndex: number;
    lastTargetIndex: number;
    moved: boolean;
  } | null>(null);

  const setOrderedLabelsState = useCallback((nextLabels: QuestionLabel[]) => {
    orderedLabelsRef.current = nextLabels;
    setOrderedLabels(nextLabels);
  }, []);

  useEffect(() => {
    if (!visible || draggingLabelId) {
      return;
    }

    setOrderedLabelsState(labels);
  }, [draggingLabelId, labels, setOrderedLabelsState, visible]);

  const startDrag = useCallback((labelId: string) => {
    const startIndex = orderedLabelsRef.current.findIndex(
      (label) => label.id === labelId,
    );

    if (startIndex < 0) {
      return;
    }

    dragStateRef.current = {
      labelId,
      startIndex,
      lastTargetIndex: startIndex,
      moved: false,
    };
    setDraggingLabelId(labelId);
    setDragOffsetY(0);
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
        maxIndex,
      );
      const currentIndex = orderedLabelsRef.current.findIndex(
        (label) => label.id === labelId,
      );

      if (currentIndex < 0) {
        return;
      }

      if (
        targetIndex === currentIndex ||
        targetIndex === dragState.lastTargetIndex
      ) {
        setDragOffsetY(
          dy - (currentIndex - dragState.startIndex) * ROW_DRAG_DISTANCE,
        );
        return;
      }

      const nextLabels = [...orderedLabelsRef.current];
      const [movedLabel] = nextLabels.splice(currentIndex, 1);
      nextLabels.splice(targetIndex, 0, movedLabel);

      dragState.lastTargetIndex = targetIndex;
      dragState.moved = true;
      setOrderedLabelsState(nextLabels);
      setDragOffsetY(
        dy - (targetIndex - dragState.startIndex) * ROW_DRAG_DISTANCE,
      );
    },
    [setOrderedLabelsState],
  );

  const finishDrag = useCallback(() => {
    const dragState = dragStateRef.current;
    dragStateRef.current = null;
    setDraggingLabelId(null);
    setDragOffsetY(0);

    if (dragState?.moved) {
      onReorderLabels(orderedLabelsRef.current);
    }
  }, [onReorderLabels]);

  const confirmDeleteLabel = useCallback(async () => {
    if (!deletingLabel || deleteRunning) {
      return;
    }

    setDeleteRunning(true);

    try {
      await onDeleteLabel(deletingLabel.id);
      setDeletingLabel(null);
    } finally {
      setDeleteRunning(false);
    }
  }, [deleteRunning, deletingLabel, onDeleteLabel]);

  return (
    <FullScreenModalShell
      visible={visible}
      title="質問ラベルの追加・編集"
      theme={theme}
      onClose={onClose}
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ラベルを追加"
          onPress={() => setLabelCreateVisible(true)}
          style={({ pressed }) => [
            styles.headerAddButton,
            pressed && styles.pressed,
          ]}>
          <Ionicons name="add" size={21} color={theme.colors.primary} />
        </Pressable>
      }>
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!draggingLabelId}
        showsVerticalScrollIndicator={false}>
        {orderedLabels.length > 0 ? (
          <View style={styles.list}>
            {orderedLabels.map((label) => (
              <LabelRow
                key={label.id}
                label={label}
                dragging={draggingLabelId === label.id}
                dragOffsetY={draggingLabelId === label.id ? dragOffsetY : 0}
                theme={theme}
                onDragStart={startDrag}
                onDragMove={moveDrag}
                onDragEnd={finishDrag}
                onEdit={setEditingLabel}
                onDelete={(labelId) => {
                  const label = orderedLabelsRef.current.find(
                    (item) => item.id === labelId,
                  );

                  if (label) {
                    setDeletingLabel(label);
                  }
                }}
              />
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <Text
              style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              ラベルはありません
            </Text>
            <Text
              style={[
                styles.emptyDescription,
                { color: theme.colors.textMuted },
              ]}>
              右上の追加ボタンから作成できます
            </Text>
          </View>
        )}
      </ScrollView>
      <QuestionLabelCreateDialog
        visible={labelCreateVisible}
        labels={labels}
        theme={theme}
        onClose={() => setLabelCreateVisible(false)}
        onCreate={onCreateLabel}
      />
      <QuestionLabelCreateDialog
        visible={Boolean(editingLabel)}
        labels={labels}
        theme={theme}
        title="ラベル名を編集"
        submitLabel="変更を保存"
        submitIcon="checkmark"
        failureMessage="ラベル名を変更できませんでした"
        initialName={editingLabel?.name ?? ""}
        ignoredLabelId={editingLabel?.id}
        onClose={() => setEditingLabel(null)}
        onCreate={async (name) => {
          if (!editingLabel) {
            throw new Error("Editing label is not selected.");
          }

          const updatedLabel = await onUpdateLabel(editingLabel.id, name);
          setEditingLabel(null);
          return updatedLabel;
        }}
      />
      <Modal
        animationType="fade"
        transparent
        visible={Boolean(deletingLabel)}
        statusBarTranslucent
        onRequestClose={() => {
          if (!deleteRunning) {
            setDeletingLabel(null);
          }
        }}>
        <View style={styles.confirmRoot}>
          <Pressable
            accessibilityLabel="確認ダイアログを閉じる"
            disabled={deleteRunning}
            onPress={() => setDeletingLabel(null)}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.overlay },
            ]}
          />
          <View
            style={[
              styles.confirmCard,
              theme.shadows.floating,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <View style={styles.confirmCopy}>
              <Text
                style={[styles.confirmTitle, { color: theme.colors.textPrimary }]}>
                ラベルを削除しますか？
              </Text>
              <Text
                style={[
                  styles.confirmMessage,
                  { color: theme.colors.textSecondary },
                ]}>
                {deletingLabel
                  ? `「${deletingLabel.name}」を削除します。質問メモ自体は削除されません。`
                  : ""}
              </Text>
            </View>
            <View style={styles.confirmActions}>
              <Pressable
                accessibilityRole="button"
                disabled={deleteRunning}
                onPress={() => setDeletingLabel(null)}
                style={({ pressed }) => [
                  styles.confirmButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.primary,
                  },
                  pressed && !deleteRunning && styles.pressed,
                  deleteRunning && styles.disabled,
                ]}>
                <Text
                  style={[
                    styles.confirmCancelText,
                    { color: theme.colors.primary },
                  ]}>
                  キャンセル
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={deleteRunning}
                onPress={() => {
                  void confirmDeleteLabel();
                }}
                style={({ pressed }) => [
                  styles.confirmButton,
                  {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                  pressed && !deleteRunning && styles.pressed,
                ]}>
                {deleteRunning ? (
                  <ActivityIndicator color={theme.colors.textOnPrimary} />
                ) : (
                  <Text
                    style={[
                      styles.confirmOkText,
                      { color: theme.colors.textOnPrimary },
                    ]}>
                    OK
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </FullScreenModalShell>
  );
};

const LabelRow = ({
  label,
  dragging,
  dragOffsetY,
  theme,
  onDragStart,
  onDragMove,
  onDragEnd,
  onEdit,
  onDelete,
}: LabelRowProps) => {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_event, gestureState) =>
          Math.abs(gestureState.dy) > 2,
        onPanResponderGrant: () => onDragStart(label.id),
        onPanResponderMove: (_event, gestureState) =>
          onDragMove(label.id, gestureState.dy),
        onPanResponderRelease: onDragEnd,
        onPanResponderTerminate: onDragEnd,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      }),
    [label.id, onDragEnd, onDragMove, onDragStart],
  );

  return (
    <View
      style={[
        styles.row,
        dragging && styles.draggingRow,
        dragging && theme.shadows.floating,
        dragging && { transform: [{ translateY: dragOffsetY }, { scale: 1.02 }] },
        {
          backgroundColor: dragging
            ? theme.colors.primarySubtle
            : theme.colors.surface,
          borderColor: dragging
            ? theme.colors.primaryBorder
            : theme.colors.border,
        },
      ]}>
      <Text
        numberOfLines={1}
        style={[styles.labelName, { color: theme.colors.textPrimary }]}>
        {label.name}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label.name}を編集`}
        onPress={() => onEdit(label)}
        style={({ pressed }) => [
          styles.editButton,
          pressed && styles.pressed,
        ]}>
        <Ionicons name="pencil-outline" size={18} color={theme.colors.primary} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label.name}を削除`}
        onPress={() => onDelete(label.id)}
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && styles.pressed,
        ]}>
        <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
      </Pressable>
      <View
        accessibilityLabel={`${label.name}を並び替え`}
        accessibilityRole="adjustable"
        style={[
          styles.dragHandle,
          webCursor,
          dragging && webDraggingCursor,
          dragging && {
            backgroundColor: theme.colors.surface,
          },
        ]}
        {...panResponder.panHandlers}>
        <View style={styles.handleGlyph}>
          <Ionicons
            name="chevron-up"
            size={8}
            color={theme.colors.textMuted}
          />
          <View style={styles.handleBars}>
            <View
              style={[
                styles.handleBar,
                { backgroundColor: theme.colors.textMuted },
              ]}
            />
            <View
              style={[
                styles.handleBar,
                { backgroundColor: theme.colors.textMuted },
              ]}
            />
            <View
              style={[
                styles.handleBar,
                { backgroundColor: theme.colors.textMuted },
              ]}
            />
          </View>
          <Ionicons
            name="chevron-down"
            size={8}
            color={theme.colors.textMuted}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    alignSelf: "center",
    maxWidth: 760,
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    width: "100%",
  },
  headerAddButton: {
    alignItems: "center",
    borderRadius: 12,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  list: {
    gap: 8,
  },
  row: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 4,
    minHeight: 52,
    paddingLeft: 12,
    paddingRight: 6,
  },
  draggingRow: {
    opacity: 0.94,
    zIndex: 5,
  },
  dragHandle: {
    alignItems: "center",
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  handleGlyph: {
    alignItems: "center",
    justifyContent: "center",
  },
  handleBars: {
    gap: 2,
    marginVertical: -1,
  },
  handleBar: {
    borderRadius: 999,
    height: 1,
    width: 15,
  },
  labelName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
    minWidth: 0,
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  editButton: {
    alignItems: "center",
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  emptyState: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    textAlign: "center",
  },
  confirmRoot: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  confirmCard: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 18,
    maxWidth: 420,
    padding: 20,
    width: "100%",
  },
  confirmCopy: {
    gap: 8,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  confirmMessage: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
  },
  confirmButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  confirmOkText: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.52,
  },
});
