import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, type ElementRef } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTheme } from "../../../constants/theme";
import { IconButton } from "../../../ui/IconButton";
import { SelectionStatus } from "../types";

type SelectionStatusPickerSheetProps = {
  visible: boolean;
  value: SelectionStatus;
  options: SelectionStatus[];
  theme: AppTheme;
  deferSelect?: boolean;
  onClose: () => void;
  onSelect: (value: SelectionStatus) => void;
};

export const SelectionStatusPickerSheet = ({
  visible,
  value,
  options,
  theme,
  deferSelect = false,
  onClose,
  onSelect,
}: SelectionStatusPickerSheetProps) => {
  const insets = useSafeAreaInsets();
  const listRef = useRef<ElementRef<typeof ScrollView>>(null);
  const selectedIndex = Math.max(options.indexOf(value), 0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const scrollOffset = Math.max(0, selectedIndex * 56 - 96);
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ y: scrollOffset, animated: false });
    });
  }, [selectedIndex, visible]);

  const selectStatus = (nextValue: SelectionStatus) => {
    onClose();

    if (!deferSelect) {
      onSelect(nextValue);
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        onSelect(nextValue);
      });
    });
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="選考状況の選択を閉じる"
          style={StyleSheet.absoluteFill}
          onPress={onClose}>
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.overlay },
            ]}
          />
        </Pressable>

        <View
          style={[
            styles.panel,
            theme.shadows.floating,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}>
          <View style={styles.header}>
            <IconButton
              icon="close"
              label="選考状況の選択を閉じる"
              onPress={onClose}
              theme={theme}
              size="compact"
              variant="plain"
            />
          </View>

          <ScrollView
            ref={listRef}
            contentContainerStyle={styles.list}
            nestedScrollEnabled
            overScrollMode="never"
            showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const selected = option === value;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => selectStatus(option)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: selected
                        ? theme.colors.surfaceSubtle
                        : theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                    pressed && styles.optionPressed,
                  ]}>
                  <Text
                    style={[
                      styles.optionText,
                      { color: theme.colors.textPrimary },
                    ]}>
                    {option}
                  </Text>
                  {selected ? (
                    <Ionicons
                      color={theme.colors.textSecondary}
                      name="checkmark-circle"
                      size={20}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  panel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "78%",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    minHeight: 44,
  },
  list: {
    gap: 8,
    paddingTop: 8,
  },
  option: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionPressed: {
    opacity: 0.74,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
});
