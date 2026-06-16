import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTheme } from "../../../constants/theme";
import { IconButton } from "../../../ui/IconButton";

type CompanyAddMethodSheetProps = {
  visible: boolean;
  typeLabel: string;
  canInherit: boolean;
  theme: AppTheme;
  onClose: () => void;
  onCreateNew: () => void;
  onInherit: () => void;
};

const webCursor =
  Platform.OS === "web"
    ? ({ cursor: "pointer", outlineStyle: "none" } as unknown as ViewStyle)
    : null;

export const CompanyAddMethodSheet = ({
  visible,
  typeLabel,
  canInherit,
  theme,
  onClose,
  onCreateNew,
  onInherit,
}: CompanyAddMethodSheetProps) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 900;

  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={onClose}>
      <View style={[styles.root, isDesktopWeb && styles.desktopRoot]}>
        <Pressable
          accessibilityLabel="企業追加方法の選択を閉じる"
          accessibilityRole="button"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }]}
        />

        <View
          style={[
            styles.panel,
            isDesktopWeb && styles.desktopPanel,
            theme.shadows.floating,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: isDesktopWeb ? theme.radii.xl : 24,
              paddingBottom: isDesktopWeb ? 16 : Math.max(insets.bottom, 14),
            },
          ]}>
          <View style={styles.header}>
            <View style={styles.headerTextBlock}>
              <Text
                style={[styles.title, { color: theme.colors.textPrimary }]}>
                {typeLabel}を追加
              </Text>
              <Text
                style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                追加方法を選んでください
              </Text>
            </View>
            <IconButton
              icon="close"
              label="閉じる"
              onPress={onClose}
              theme={theme}
              size="compact"
              variant="plain"
            />
          </View>

          <View style={styles.options}>
            <MethodOption
              icon="document-text-outline"
              title="新しく追加"
              description="空の入力画面から登録します"
              theme={theme}
              onPress={onCreateNew}
            />
            <MethodOption
              icon="duplicate-outline"
              title="引き継いで追加"
              description={
                canInherit
                  ? "既存企業のログイン情報などを引き継ぎます"
                  : "登録済み企業がありません"
              }
              disabled={!canInherit}
              theme={theme}
              onPress={onInherit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const MethodOption = ({
  icon,
  title,
  description,
  disabled,
  theme,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  disabled?: boolean;
  theme: AppTheme;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ disabled: Boolean(disabled) }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.option,
      webCursor,
      {
        backgroundColor: theme.colors.surfaceElevated,
        borderColor: theme.colors.border,
        opacity: disabled ? theme.state.disabledOpacity : 1,
      },
      pressed && !disabled && styles.pressed,
    ]}>
    <View
      style={[
        styles.optionIcon,
        { backgroundColor: theme.colors.primarySubtle },
      ]}>
      <Ionicons color={theme.colors.primary} name={icon} size={20} />
    </View>
    <View style={styles.optionTextBlock}>
      <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>
        {title}
      </Text>
      <Text
        numberOfLines={2}
        style={[styles.optionDescription, { color: theme.colors.textMuted }]}>
        {description}
      </Text>
    </View>
    <Ionicons color={theme.colors.textMuted} name="chevron-forward" size={18} />
  </Pressable>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  desktopRoot: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  panel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  desktopPanel: {
    maxWidth: 420,
    width: "100%",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 2,
  },
  options: {
    gap: 10,
  },
  option: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  optionTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  optionDescription: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.74,
  },
});
