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

const groupedBackground = "#F2F2F7";
const dividerColor = "#E5E5EA";
const dangerRed = "#FF3B30";
const rowTextColor = "#111111";
const chevronColor = "#8E8E93";
const sheetBackdrop = "rgba(0,0,0,0.4)";
const webInputOutlineReset =
  Platform.OS === "web"
    ? ({ outlineColor: "transparent", outlineStyle: "none", outlineWidth: 0 } as unknown as TextStyle)
    : null;

const normalizeColorCode = (colorCode: string) =>
  colorCode.trim().toUpperCase();

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
              backgroundColor: groupedBackground,
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
            <View style={styles.listGroup}>
              <CategoryListRow
                name={uncategorizedCategoryName}
                colorCode={getUncategorizedCategoryColor(theme)}
                editable={false}
                showChevron={false}
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
                pressed && styles.pressed,
              ]}>
              <Ionicons name="add" size={20} color={theme.colors.primary} />
              <Text
                style={[styles.createRowText, { color: theme.colors.primary }]}>
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
                backgroundColor: groupedBackground,
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
    <Text numberOfLines={1} style={styles.headerTitle}>
      {title}
    </Text>
    <Pressable
      accessibilityRole="button"
      onPress={onRightPress}
      style={({ pressed }) => [styles.headerSide, pressed && styles.pressed]}>
      <Text style={[styles.headerActionText, { color: theme.colors.primary }]}>
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
  onPress,
}: {
  name: string;
  colorCode: string;
  editable: boolean;
  showChevron: boolean;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [styles.listRow, pressed && styles.rowPressed]}>
    <View style={[styles.listColorDot, { backgroundColor: colorCode }]} />
    <Text numberOfLines={1} style={styles.listRowName}>
      {name}
    </Text>
    {showChevron && editable ? (
      <Ionicons name="chevron-forward" size={18} color={chevronColor} />
    ) : (
      <View style={styles.chevronSpacer} />
    )}
  </Pressable>
);

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
    <View style={styles.editorScreen}>
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
              borderColor: nameFocused
                ? theme.colors.focusRing
                : "transparent",
            },
          ]}>
          <View style={styles.nameInputRow}>
            <TextInput
              ref={inputRef}
              value={name}
              placeholder="色名を入力"
              placeholderTextColor="#8E8E93"
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
              style={[styles.nameInput, webInputOutlineReset]}
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
                <Ionicons name="close-circle" size={20} color="#C7C7CC" />
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
              pressed && styles.rowPressed,
            ]}>
            <Text style={styles.colorRowLabel}>色</Text>
            <View
              style={[styles.colorIndicator, { backgroundColor: colorCode }]}
            />
          </Pressable>
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>
            {error}
          </Text>
        ) : null}

        {category ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setDeleteConfirmVisible(true)}
            style={({ pressed }) => [
              styles.deleteRow,
              pressed && styles.rowPressed,
            ]}>
            <Text style={styles.deleteRowText}>色の削除</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <ColorPaletteSheet
        visible={paletteVisible}
        selectedColor={colorCode}
        usedColorCodes={categories.map((item) => item.colorCode)}
        bottomInset={bottomInset}
        onClose={() => setPaletteVisible(false)}
        onSelect={(value) => {
          setColorCode(value);
          setPaletteVisible(false);
        }}
      />

      <DeleteConfirmDialog
        visible={deleteConfirmVisible}
        deleting={deleting}
        onCancel={() => setDeleteConfirmVisible(false)}
        onDelete={() => {
          void deleteCategory();
        }}
      />

      {saving ? (
        <View pointerEvents="none" style={styles.savingOverlay}>
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
  onClose,
  onSelect,
}: {
  visible: boolean;
  selectedColor: string;
  usedColorCodes: string[];
  bottomInset: number;
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
        style={[StyleSheet.absoluteFill, { backgroundColor: sheetBackdrop }]}
      />
      <Animated.View
        style={[
          styles.paletteSheet,
          {
            paddingBottom: Math.max(bottomInset, 16) + 16,
            paddingHorizontal: sheetHorizontalPadding,
            transform: [{ translateY: sheetY }],
          },
        ]}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>色を選択</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.sheetCloseButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.sheetCloseText}>閉じる</Text>
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
                    selected && styles.paletteSelectedRingActive,
                  ]}>
                  <View
                    style={[
                      styles.paletteCircle,
                      {
                        backgroundColor: usedAsOutline ? "#FFFFFF" : colorCode,
                        borderColor: used
                          ? markerColor
                          : luminance > 0.9
                            ? "#D1D5DB"
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
                        color={usedAsOutline ? markerColor : "#FFFFFF"}
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
  onCancel,
  onDelete,
}: {
  visible: boolean;
  deleting: boolean;
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
        style={[StyleSheet.absoluteFill, { backgroundColor: sheetBackdrop }]}
      />
      <View style={styles.alertCard}>
        <Text style={styles.alertTitle}>色の削除</Text>
        <Text style={styles.alertMessage}>
          この色が設定されている予定は全て”未分類”となります。
        </Text>
        <View style={styles.alertDivider} />
        <View style={styles.alertActions}>
          <Pressable
            accessibilityRole="button"
            disabled={deleting}
            onPress={onCancel}
            style={({ pressed }) => [
              styles.alertButton,
              pressed && styles.rowPressed,
            ]}>
            <Text style={styles.alertCancelText}>キャンセル</Text>
          </Pressable>
          <View style={styles.alertVerticalDivider} />
          <Pressable
            accessibilityRole="button"
            disabled={deleting}
            onPress={onDelete}
            style={({ pressed }) => [
              styles.alertButton,
              pressed && !deleting && styles.rowPressed,
            ]}>
            {deleting ? (
              <ActivityIndicator color={dangerRed} />
            ) : (
              <Text style={styles.alertDeleteText}>削除</Text>
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
    backgroundColor: "#FFFFFF",
    borderBottomColor: dividerColor,
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
    color: rowTextColor,
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
  },
  headerActionText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  listBody: {
    paddingTop: 18,
  },
  listGroup: {
    backgroundColor: "#FFFFFF",
  },
  listRow: {
    alignItems: "center",
    borderBottomColor: dividerColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  rowPressed: {
    backgroundColor: "#E5E5EA",
  },
  listColorDot: {
    borderRadius: 999,
    height: 16,
    width: 16,
  },
  listRowName: {
    color: rowTextColor,
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 21,
    minWidth: 0,
  },
  chevronSpacer: {
    width: 18,
  },
  createRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopColor: dividerColor,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    height: 56,
    marginTop: 18,
    paddingHorizontal: 16,
  },
  createRowText: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 21,
  },
  editorScreen: {
    flex: 1,
    backgroundColor: groupedBackground,
  },
  editorBody: {
    paddingTop: 24,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  nameInputRow: {
    alignItems: "center",
    borderBottomColor: dividerColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 10,
  },
  nameInput: {
    color: rowTextColor,
    flex: 1,
    fontSize: 16,
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
    color: rowTextColor,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 21,
  },
  colorIndicator: {
    borderRadius: 999,
    height: 24,
    width: 24,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginHorizontal: 18,
    marginTop: 8,
  },
  deleteRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 28,
  },
  deleteRowText: {
    color: dangerRed,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
  },
  sheetLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 20,
  },
  paletteSheet: {
    backgroundColor: "#FFFFFF",
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
    color: rowTextColor,
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  sheetCloseButton: {
    minHeight: 34,
    justifyContent: "center",
  },
  sheetCloseText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21,
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
  paletteSelectedRingActive: {
    borderColor: "#111111",
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
    padding: 28,
  },
  alertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    maxWidth: 320,
    overflow: "hidden",
    width: "100%",
  },
  alertTitle: {
    color: rowTextColor,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    textAlign: "center",
  },
  alertMessage: {
    color: rowTextColor,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 6,
    textAlign: "center",
  },
  alertDivider: {
    backgroundColor: dividerColor,
    height: StyleSheet.hairlineWidth,
  },
  alertActions: {
    flexDirection: "row",
    minHeight: 46,
  },
  alertVerticalDivider: {
    backgroundColor: dividerColor,
    width: StyleSheet.hairlineWidth,
  },
  alertButton: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  alertCancelText: {
    color: "#007AFF",
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 22,
  },
  alertDeleteText: {
    color: dangerRed,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(242,242,247,0.45)",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.65,
  },
});
