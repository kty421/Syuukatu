import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTheme } from "../../../constants/theme";
import { ScheduleCategory, ScheduleCategoryDraft } from "../types";
import {
  getUncategorizedCategoryColor,
  scheduleCategoryPalette,
  uncategorizedCategoryName,
} from "../utils/scheduleCategoryUtils";

type ScheduleCategoryPickerProps = {
  visible: boolean;
  categories: ScheduleCategory[];
  selectedCategoryId?: string | null;
  theme: AppTheme;
  onClose: () => void;
  onSelectCategoryId: (categoryId: string | null) => void;
  onSaveCategory: (
    category: ScheduleCategoryDraft | ScheduleCategory,
  ) => Promise<ScheduleCategory>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
};

type EditorRoute = {
  category: ScheduleCategory | null;
};

const webInputOutlineReset =
  Platform.OS === "web"
    ? ({ outlineColor: "transparent", outlineStyle: "none", outlineWidth: 0 } as unknown as TextStyle)
    : null;

const normalizeColorCode = (colorCode: string) =>
  colorCode.trim().toUpperCase();

const getPickerColors = (theme: AppTheme) => ({
  groupedBackground: theme.colors.backgroundAlt,
  divider: theme.colors.divider,
  rowPressed: theme.colors.surfacePressed,
  rowText: theme.colors.textPrimary,
  chevron: theme.colors.textMuted,
  clearIcon: theme.colors.textDisabled,
  danger: theme.colors.danger,
  link: theme.colors.primary,
  backdrop: theme.colors.overlay,
});

const getColorLuminance = (colorCode: string) => {
  const hex = colorCode.replace("#", "");
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  return (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
};

export const ScheduleCategoryPicker = ({
  visible,
  categories,
  selectedCategoryId,
  theme,
  onClose,
  onSelectCategoryId,
  onSaveCategory,
  onDeleteCategory,
}: ScheduleCategoryPickerProps) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pickerColors = getPickerColors(theme);
  const routeX = useRef(new Animated.Value(width)).current;
  const editorX = useRef(new Animated.Value(width)).current;
  const [rendered, setRendered] = useState(visible);
  const [editingMode, setEditingMode] = useState(false);
  const [editorRoute, setEditorRoute] = useState<EditorRoute | null>(null);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      routeX.setValue(width);
      Animated.timing(routeX, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(routeX, {
      toValue: width,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setRendered(false);
        setEditingMode(false);
        setEditorRoute(null);
      }
    });
  }, [routeX, visible, width]);

  const openEditor = (category: ScheduleCategory | null) => {
    setEditorRoute({ category });
    editorX.setValue(width);
    requestAnimationFrame(() => {
      Animated.timing(editorX, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeEditor = () => {
    Animated.timing(editorX, {
      toValue: width,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setEditorRoute(null);
      }
    });
  };

  const selectCategory = (categoryId: string | null) => {
    onSelectCategoryId(categoryId);
    onClose();
  };

  if (!rendered) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      presentationStyle="overFullScreen"
      visible={rendered}
      onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Animated.View
          style={[
            styles.pushScreen,
            {
              backgroundColor: pickerColors.groupedBackground,
              transform: [{ translateX: routeX }],
            },
          ]}>
          <ScreenHeader
            title="色を選択"
            topInset={insets.top}
            theme={theme}
            onBack={onClose}
            rightLabel={editingMode ? "完了" : "編集"}
            onRightPress={() => setEditingMode((current) => !current)}
          />
          <ScrollView
            contentContainerStyle={[
              styles.listBody,
              { paddingBottom: Math.max(insets.bottom, 18) + 18 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View
              style={[
                styles.listGroup,
                { backgroundColor: theme.colors.surface },
              ]}>
              <CategoryListRow
                name={uncategorizedCategoryName}
                colorCode={getUncategorizedCategoryColor(theme)}
                editable={false}
                showChevron={false}
                theme={theme}
                onPress={() => {
                  if (!editingMode) {
                    selectCategory(null);
                  }
                }}
              />
              {categories.map((category) => (
                <CategoryListRow
                  key={category.id}
                  name={category.name}
                  colorCode={category.colorCode}
                  editable
                  showChevron
                  theme={theme}
                  onPress={() => {
                    if (editingMode) {
                      openEditor(category);
                      return;
                    }

                    selectCategory(category.id);
                  }}
                />
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="色を追加"
              onPress={() => openEditor(null)}
              style={({ pressed }) => [
                styles.createRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderTopColor: pickerColors.divider,
                },
                pressed && { backgroundColor: pickerColors.rowPressed },
              ]}>
              <Ionicons name="add" size={20} color={theme.colors.primary} />
              <Text
                style={[
                  theme.typography.body,
                  styles.createRowText,
                  { color: theme.colors.primary },
                ]}>
                色を追加
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>

        {editorRoute ? (
          <Animated.View
            style={[
              styles.pushScreen,
              {
                backgroundColor: pickerColors.groupedBackground,
                transform: [{ translateX: editorX }],
              },
            ]}>
            <CategoryEditorScreen
              category={editorRoute.category}
              categories={categories}
              bottomInset={insets.bottom}
              topInset={insets.top}
              theme={theme}
              onBack={closeEditor}
              onSave={async (category) => {
                await onSaveCategory(category);
                closeEditor();
              }}
              onDelete={async (category) => {
                await onDeleteCategory(category.id);

                if (selectedCategoryId === category.id) {
                  onSelectCategoryId(null);
                }

                closeEditor();
              }}
            />
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
};

const ScreenHeader = ({
  title,
  topInset,
  theme,
  onBack,
  rightLabel,
  onRightPress,
}: {
  title: string;
  topInset: number;
  theme: AppTheme;
  onBack: () => void;
  rightLabel: string;
  onRightPress: () => void;
}) => (
  <View
    style={[
      styles.header,
      {
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.divider,
        paddingTop: topInset + 6,
      },
    ]}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="戻る"
      onPress={onBack}
      style={({ pressed }) => [styles.headerSide, pressed && styles.pressed]}>
      <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
    </Pressable>
    <Text
      numberOfLines={1}
      style={[
        theme.typography.label,
        styles.headerTitle,
        { color: theme.colors.textPrimary },
      ]}
    >
      {title}
    </Text>
    <Pressable
      accessibilityRole="button"
      onPress={onRightPress}
      style={({ pressed }) => [styles.headerSide, pressed && styles.pressed]}>
      <Text
        style={[
          theme.typography.label,
          styles.headerActionText,
          { color: theme.colors.primary },
        ]}>
        {rightLabel}
      </Text>
    </Pressable>
  </View>
);

const CategoryListRow = ({
  name,
  colorCode,
  editable,
  showChevron,
  theme,
  onPress,
}: {
  name: string;
  colorCode: string;
  editable: boolean;
  showChevron: boolean;
  theme: AppTheme;
  onPress: () => void;
}) => {
  const pickerColors = getPickerColors(theme);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.listRow,
        { borderBottomColor: pickerColors.divider },
        pressed && { backgroundColor: pickerColors.rowPressed },
      ]}>
      <View style={[styles.listColorDot, { backgroundColor: colorCode }]} />
      <Text
        numberOfLines={1}
        style={[
          theme.typography.body,
          styles.listRowName,
          { color: pickerColors.rowText },
        ]}>
        {name}
      </Text>
      {showChevron && editable ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={pickerColors.chevron}
        />
      ) : (
        <View style={styles.chevronSpacer} />
      )}
    </Pressable>
  );
};

const CategoryEditorScreen = ({
  category,
  categories,
  topInset,
  bottomInset,
  theme,
  onBack,
  onSave,
  onDelete,
}: {
  category: ScheduleCategory | null;
  categories: ScheduleCategory[];
  topInset: number;
  bottomInset: number;
  theme: AppTheme;
  onBack: () => void;
  onSave: (category: ScheduleCategoryDraft | ScheduleCategory) => Promise<void>;
  onDelete: (category: ScheduleCategory) => Promise<void>;
}) => {
  const pickerColors = getPickerColors(theme);
  const inputRef = useRef<TextInput>(null);
  const [name, setName] = useState(category?.name ?? "");
  const [colorCode, setColorCode] = useState<string>(
    category?.colorCode ?? scheduleCategoryPalette[0],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [paletteVisible, setPaletteVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  useEffect(() => {
    setName(category?.name ?? "");
    setColorCode(category?.colorCode ?? scheduleCategoryPalette[0]);
    setError(null);
    setSaving(false);
    setPaletteVisible(false);
    setDeleteConfirmVisible(false);
    setDeleting(false);
    setNameFocused(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [category]);

  const saveCategory = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("色名を入力してください");
      return;
    }

    if (
      categories.some(
        (item) => item.id !== category?.id && item.name === trimmedName,
      )
    ) {
      setError("同じ名前の色があります");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        id: category?.id,
        name: trimmedName,
        colorCode,
        createdAt: category?.createdAt,
        updatedAt: category?.updatedAt,
      });
    } catch {
      setError("色を保存できませんでした");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async () => {
    if (!category || deleting) {
      return;
    }

    setDeleting(true);

    try {
      await onDelete(category);
      setDeleteConfirmVisible(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View
      style={[
        styles.editorScreen,
        { backgroundColor: pickerColors.groupedBackground },
      ]}>
      <ScreenHeader
        title={category ? "色を編集" : "色作成"}
        topInset={topInset}
        theme={theme}
        onBack={onBack}
        rightLabel="完了"
        onRightPress={() => {
          void saveCategory();
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.editorBody,
          { paddingBottom: Math.max(bottomInset, 18) + 18 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: nameFocused
                ? theme.colors.focusRing
                : "transparent",
            },
          ]}>
          <View
            style={[
              styles.nameInputRow,
              { borderBottomColor: pickerColors.divider },
            ]}>
            <TextInput
              ref={inputRef}
              value={name}
              placeholder="色名を入力"
              placeholderTextColor={theme.colors.placeholder}
              autoCorrect={false}
              onChangeText={(value) => {
                setName(value);
                if (error) {
                  setError(null);
                }
              }}
              onSubmitEditing={() => {
                void saveCategory();
              }}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              style={[
                theme.typography.body,
                styles.nameInput,
                webInputOutlineReset,
                { color: pickerColors.rowText },
              ]}
            />
            {name.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="色名をクリア"
                onPress={() => setName("")}
                style={({ pressed }) => [
                  styles.clearButton,
                  pressed && styles.pressed,
                ]}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={pickerColors.clearIcon}
                />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="色を選択"
            onPress={() => {
              Keyboard.dismiss();
              setPaletteVisible(true);
            }}
            style={({ pressed }) => [
              styles.colorRow,
              pressed && { backgroundColor: pickerColors.rowPressed },
            ]}>
            <Text
              style={[
                theme.typography.body,
                styles.colorRowLabel,
                { color: pickerColors.rowText },
              ]}>
              色
            </Text>
            <View
              style={[styles.colorIndicator, { backgroundColor: colorCode }]}
            />
          </Pressable>
        </View>

        {error ? (
          <Text
            style={[
              theme.typography.caption,
              styles.errorText,
              { color: theme.colors.danger },
            ]}>
            {error}
          </Text>
        ) : null}

        {category ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setDeleteConfirmVisible(true)}
            style={({ pressed }) => [
              styles.deleteRow,
              { backgroundColor: theme.colors.surface },
              pressed && { backgroundColor: pickerColors.rowPressed },
            ]}>
            <Text
              style={[
                theme.typography.label,
                styles.deleteRowText,
                { color: theme.colors.danger },
              ]}>
              色の削除
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <ColorPaletteSheet
        visible={paletteVisible}
        selectedColor={colorCode}
        usedColorCodes={categories.map((item) => item.colorCode)}
        bottomInset={bottomInset}
        theme={theme}
        onClose={() => setPaletteVisible(false)}
        onSelect={(value) => {
          setColorCode(value);
          setPaletteVisible(false);
        }}
      />

      <DeleteConfirmDialog
        visible={deleteConfirmVisible}
        deleting={deleting}
        theme={theme}
        onCancel={() => setDeleteConfirmVisible(false)}
        onDelete={() => {
          void deleteCategory();
        }}
      />

      {saving ? (
        <View
          pointerEvents="none"
          style={[
            styles.savingOverlay,
            { backgroundColor: theme.colors.surfaceOverlay },
          ]}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : null}
    </View>
  );
};

const ColorPaletteSheet = ({
  visible,
  selectedColor,
  usedColorCodes,
  bottomInset,
  theme,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selectedColor: string;
  usedColorCodes: string[];
  bottomInset: number;
  theme: AppTheme;
  onClose: () => void;
  onSelect: (colorCode: string) => void;
}) => {
  const { width } = useWindowDimensions();
  const sheetY = useRef(new Animated.Value(360)).current;
  const [rendered, setRendered] = useState(visible);
  const usedColorSet = new Set(usedColorCodes.map(normalizeColorCode));
  const compact = width < 768;
  const narrow = width < 380;
  const columnCount = compact ? 8 : 12;
  const sheetHorizontalPadding = compact ? (narrow ? 10 : 14) : 24;
  const paletteMaxWidth = compact ? 420 : 680;
  const paletteCellWidth = `${100 / columnCount}%` as `${number}%`;
  const ringSize = compact ? (narrow ? 32 : 36) : 42;
  const circleSize = compact ? (narrow ? 26 : 30) : 34;
  const checkSize = compact ? (narrow ? 16 : 18) : 20;
  const rowGap = compact ? (narrow ? 8 : 10) : 12;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      sheetY.setValue(360);
      Animated.timing(sheetY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(sheetY, {
      toValue: 360,
      duration: 190,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setRendered(false);
      }
    });
  }, [sheetY, visible]);

  if (!rendered) {
    return null;
  }

  return (
    <View style={styles.sheetLayer}>
      <Pressable
        accessibilityLabel="カラーパレットを閉じる"
        onPress={onClose}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.colors.overlay },
        ]}
      />
      <Animated.View
        style={[
          styles.paletteSheet,
          {
            backgroundColor: theme.colors.surface,
            paddingBottom: Math.max(bottomInset, 16) + 16,
            paddingHorizontal: sheetHorizontalPadding,
            transform: [{ translateY: sheetY }],
          },
        ]}>
        <View style={styles.sheetHeader}>
          <Text
            style={[
              theme.typography.label,
              styles.sheetTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            色を選択
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.sheetCloseButton,
              pressed && styles.pressed,
            ]}>
            <Text
              style={[
                theme.typography.label,
                styles.sheetCloseText,
                { color: theme.colors.primary },
              ]}
            >
              閉じる
            </Text>
          </Pressable>
        </View>
        <View style={[styles.paletteGrid, { maxWidth: paletteMaxWidth }]}>
          {scheduleCategoryPalette.map((colorCode) => {
            const selected =
              normalizeColorCode(selectedColor) ===
              normalizeColorCode(colorCode);
            const used = usedColorSet.has(normalizeColorCode(colorCode));
            const luminance = getColorLuminance(colorCode);
            const usedAsOutline = used && luminance >= 0.35;
            const markerColor = colorCode;

            return (
              <Pressable
                key={colorCode}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={
                  used ? `${colorCode}を選択、使用済み` : `${colorCode}を選択`
                }
                onPress={() => onSelect(colorCode)}
                style={({ pressed }) => [
                  styles.paletteCell,
                  {
                    marginBottom: rowGap,
                    width: paletteCellWidth,
                  },
                  pressed && styles.pressed,
                ]}>
                <View
                  style={[
                    styles.paletteSelectedRing,
                    {
                      height: ringSize,
                      width: ringSize,
                    },
                    selected && { borderColor: theme.colors.textPrimary },
                  ]}>
                  <View
                    style={[
                      styles.paletteCircle,
                      {
                        backgroundColor: usedAsOutline
                          ? theme.colors.surface
                          : colorCode,
                        borderColor: used
                          ? markerColor
                          : luminance > 0.9
                            ? theme.colors.divider
                            : "transparent",
                        borderWidth: used ? 4 : luminance > 0.9 ? 1 : 0,
                        height: circleSize,
                        width: circleSize,
                      },
                    ]}>
                    {used ? (
                      <Ionicons
                        name="checkmark"
                        size={checkSize}
                        color={
                          usedAsOutline ? markerColor : theme.colors.surface
                        }
                      />
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
};

const DeleteConfirmDialog = ({
  visible,
  deleting,
  theme,
  onCancel,
  onDelete,
}: {
  visible: boolean;
  deleting: boolean;
  theme: AppTheme;
  onCancel: () => void;
  onDelete: () => void;
}) => (
  <Modal
    animationType="fade"
    transparent
    visible={visible}
    statusBarTranslucent
    onRequestClose={onCancel}>
    <View style={styles.alertRoot}>
      <Pressable
        accessibilityLabel="削除確認を閉じる"
        disabled={deleting}
        onPress={onCancel}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.colors.overlay },
        ]}
      />
      <View
        style={[
          styles.alertCard,
          theme.shadows.floating,
          { backgroundColor: theme.colors.surface },
        ]}>
        <Text
          style={[
            theme.typography.label,
            styles.alertTitle,
            { color: theme.colors.textPrimary },
          ]}
        >
          色の削除
        </Text>
        <Text
          style={[
            theme.typography.footnote,
            styles.alertMessage,
            { color: theme.colors.textSecondary },
          ]}
        >
          この色が設定されている予定は全て”未分類”となります。
        </Text>
        <View
          style={[styles.alertDivider, { backgroundColor: theme.colors.divider }]}
        />
        <View style={styles.alertActions}>
          <Pressable
            accessibilityRole="button"
            disabled={deleting}
            onPress={onCancel}
            style={({ pressed }) => [
              styles.alertButton,
              pressed && { backgroundColor: theme.colors.surfacePressed },
            ]}>
            <Text
              style={[
                theme.typography.label,
                styles.alertCancelText,
                { color: theme.colors.primary },
              ]}
            >
              キャンセル
            </Text>
          </Pressable>
          <View
            style={[
              styles.alertVerticalDivider,
              { backgroundColor: theme.colors.divider },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            disabled={deleting}
            onPress={onDelete}
            style={({ pressed }) => [
              styles.alertButton,
              pressed &&
                !deleting && { backgroundColor: theme.colors.surfacePressed },
            ]}>
            {deleting ? (
              <ActivityIndicator color={theme.colors.danger} />
            ) : (
              <Text
                style={[
                  theme.typography.label,
                  styles.alertDeleteText,
                  { color: theme.colors.danger },
                ]}
              >
                削除
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    overflow: "hidden",
  },
  pushScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 50,
    paddingBottom: 7,
  },
  headerSide: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    width: 74,
  },
  headerTitle: {
    flex: 1,
    fontWeight: "700",
    textAlign: "center",
  },
  headerActionText: {
    fontWeight: "600",
  },
  listBody: {
    paddingTop: 14,
  },
  listGroup: {
    overflow: "hidden",
  },
  listRow: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  listColorDot: {
    borderRadius: 999,
    height: 16,
    width: 16,
  },
  listRowName: {
    flex: 1,
    fontWeight: "400",
    minWidth: 0,
  },
  chevronSpacer: {
    width: 18,
  },
  createRow: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    height: 56,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  createRowText: {
    fontWeight: "500",
  },
  editorScreen: {
    flex: 1,
  },
  editorBody: {
    paddingTop: 18,
  },
  formCard: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  nameInputRow: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 10,
  },
  nameInput: {
    flex: 1,
    fontWeight: "400",
    minHeight: 54,
    paddingVertical: 14,
  },
  clearButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  colorRow: {
    alignItems: "center",
    flexDirection: "row",
    height: 56,
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  colorRowLabel: {
    fontWeight: "400",
  },
  colorIndicator: {
    borderRadius: 999,
    height: 24,
    width: 24,
  },
  errorText: {
    fontWeight: "600",
    marginHorizontal: 18,
    marginTop: 8,
  },
  deleteRow: {
    alignItems: "center",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 22,
  },
  deleteRowText: {
    fontWeight: "700",
  },
  sheetLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 20,
  },
  paletteSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    width: "100%",
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 18,
  },
  sheetTitle: {
    flex: 1,
    fontWeight: "700",
  },
  sheetCloseButton: {
    minHeight: 34,
    justifyContent: "center",
  },
  sheetCloseText: {
    fontWeight: "600",
  },
  paletteGrid: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  paletteCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  paletteSelectedRing: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: "center",
  },
  paletteCircle: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
  },
  alertRoot: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  alertCard: {
    borderRadius: 14,
    maxWidth: 320,
    overflow: "hidden",
    width: "100%",
  },
  alertTitle: {
    fontWeight: "700",
    paddingHorizontal: 18,
    paddingTop: 16,
    textAlign: "center",
  },
  alertMessage: {
    fontWeight: "400",
    paddingBottom: 16,
    paddingHorizontal: 18,
    paddingTop: 6,
    textAlign: "center",
  },
  alertDivider: {
    height: StyleSheet.hairlineWidth,
  },
  alertActions: {
    flexDirection: "row",
    minHeight: 46,
  },
  alertVerticalDivider: {
    width: StyleSheet.hairlineWidth,
  },
  alertButton: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  alertCancelText: {
    fontWeight: "400",
  },
  alertDeleteText: {
    fontWeight: "700",
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.65,
  },
});
