import { Ionicons } from "@expo/vector-icons";
import { memo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppTheme } from "../../../constants/theme";
import { IconButton } from "../../../ui/IconButton";
import { Company, SelectionStatus } from "../types";
import { SelectionStatusPickerSheet } from "./SelectionStatusPickerSheet";

type CompanyCardProps = {
  company: Company;
  theme: AppTheme;
  isPasswordVisible: boolean;
  showPasswordControls: boolean;
  statusOptions: SelectionStatus[];
  isStatusSaving: boolean;
  onPress: () => void;
  onTogglePassword: () => void;
  onCopy: (value: string, label: string) => void;
  onOpenUrl: () => void;
  onDelete: () => void;
  onStatusChange: (status: SelectionStatus) => void;
};

const maskPassword = (password: string) => (password ? "••••••••" : "未登録");

export const CompanyCard = memo(
  ({
    company,
    theme,
    isPasswordVisible,
    showPasswordControls,
    statusOptions,
    isStatusSaving,
    onPress,
    onTogglePassword,
    onCopy,
    onOpenUrl,
    onDelete,
    onStatusChange,
  }: CompanyCardProps) => {
    const [statusPickerVisible, setStatusPickerVisible] = useState(false);

    const runChildAction =
      (handler: () => void) => (event: GestureResponderEvent) => {
        event.stopPropagation();
        handler();
      };

    const openStatusPicker = (event: GestureResponderEvent) => {
      event.stopPropagation();
      if (isStatusSaving) {
        return;
      }

      Keyboard.dismiss();
      setStatusPickerVisible(true);
    };

    const closeStatusPicker = () => {
      setStatusPickerVisible(false);
    };

    return (
      <Pressable
        accessibilityLabel={`${company.companyName}を編集`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs,
          },
          pressed && { backgroundColor: theme.colors.surfaceSubtle },
        ]}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <View style={styles.nameRow}>
              <Text
                style={[
                  theme.typography.bodyStrong,
                  styles.companyName,
                  { color: theme.colors.textPrimary },
                ]}
                numberOfLines={1}>
                {company.companyName}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${company.companyName}の選考状況を変更`}
                accessibilityHint={`現在の選考状況は${company.status}です`}
                accessibilityState={{ disabled: isStatusSaving }}
                disabled={isStatusSaving}
                onPress={openStatusPicker}
                style={({ pressed }) => [
                  styles.statusChip,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: isStatusSaving ? theme.state.disabledOpacity : 1,
                  },
                  pressed && styles.statusChipPressed,
                ]}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.statusText,
                    { color: theme.colors.textPrimary },
                  ]}>
                  {company.status}
                </Text>
                {isStatusSaving ? (
                  <ActivityIndicator
                    color={theme.colors.textMuted}
                    size="small"
                  />
                ) : (
                  <Ionicons
                    color={theme.colors.textMuted}
                    name="chevron-down"
                    size={15}
                  />
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.actions}>
            <IconButton
              icon="open-outline"
              label="企業ページを開く"
              onPress={runChildAction(onOpenUrl)}
              theme={theme}
              tone="neutral"
              variant="plain"
              disabled={!company.myPageUrl}
              size="compact"
              iconSize={17}
            />
            <IconButton
              icon="trash-outline"
              label={`${company.companyName}を削除`}
              onPress={runChildAction(onDelete)}
              theme={theme}
              tone="danger"
              variant="plain"
              size="compact"
              iconSize={17}
            />
          </View>
        </View>

        <View
          style={[
            styles.credentialBlock,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.md,
            },
          ]}>
          <CredentialRow
            label="ID"
            value={company.loginId || "未登録"}
            isPlaceholder={!company.loginId}
            theme={theme}
            iconButtons={
              <View style={styles.credentialActionsSlot}>
                <View style={styles.singleActionWrap}>
                  <IconButton
                    icon="copy-outline"
                    label="ログインIDをコピー"
                    onPress={runChildAction(() =>
                      onCopy(company.loginId, "ログインID"),
                    )}
                    theme={theme}
                    tone="accent"
                    size="compact"
                    variant="plain"
                    disabled={!company.loginId}
                  />
                </View>
              </View>
            }
          />
          {showPasswordControls ? (
            <>
              <View
                style={[
                  styles.credentialDivider,
                  { backgroundColor: theme.colors.divider },
                ]}
              />
              <CredentialRow
                label="PW"
                value={
                  isPasswordVisible
                    ? company.password || "未登録"
                    : maskPassword(company.password)
                }
                isPlaceholder={!company.password}
                theme={theme}
                iconButtons={
                  <View style={styles.credentialActionsSlot}>
                    <View style={styles.passwordActions}>
                      <IconButton
                        icon={
                          isPasswordVisible ? "eye-off-outline" : "eye-outline"
                        }
                        label={
                          isPasswordVisible
                            ? "パスワードを隠す"
                            : "パスワードを表示"
                        }
                        onPress={runChildAction(onTogglePassword)}
                        theme={theme}
                        tone="accent"
                        size="compact"
                        variant="plain"
                        disabled={!company.password}
                      />
                      <IconButton
                        icon="copy-outline"
                        label="パスワードをコピー"
                        onPress={runChildAction(() =>
                          onCopy(company.password, "パスワード"),
                        )}
                        theme={theme}
                        tone="accent"
                        size="compact"
                        variant="plain"
                        disabled={!company.password}
                      />
                    </View>
                  </View>
                }
              />
            </>
          ) : null}
        </View>

        <SelectionStatusPickerSheet
          visible={statusPickerVisible}
          value={company.status}
          options={statusOptions}
          theme={theme}
          onClose={closeStatusPicker}
          onSelect={onStatusChange}
        />
      </Pressable>
    );
  },
);

const CredentialRow = ({
  label,
  value,
  isPlaceholder,
  theme,
  iconButtons,
}: {
  label: string;
  value: string;
  isPlaceholder?: boolean;
  theme: AppTheme;
  iconButtons: ReactNode;
}) => (
  <View style={styles.credentialRow}>
    <Text
      style={[styles.credentialLabel, { color: theme.colors.textDisabled }]}>
      {label}
    </Text>
    <Text
      style={[
        styles.credentialValue,
        theme.typography.footnote,
        isPlaceholder
          ? styles.credentialValuePlaceholder
          : styles.credentialValueFilled,
        {
          color: isPlaceholder
            ? theme.colors.textDisabled
            : theme.colors.textPrimary,
        },
      ]}
      numberOfLines={1}>
      {value}
    </Text>
    {iconButtons}
  </View>
);

const styles = StyleSheet.create({
  card: {
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  companyName: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 0,
    marginRight: -2,
  },
  statusChip: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
    flexDirection: "row",
    gap: 6,
    marginLeft: 8,
    marginTop: 2,
    maxWidth: 148,
    minHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusChipPressed: {
    opacity: 0.76,
  },
  statusText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    minWidth: 0,
  },
  credentialBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
    overflow: "hidden",
  },
  credentialRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  credentialLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    lineHeight: 13,
    width: 24,
  },
  credentialValue: {
    flex: 1,
    minWidth: 0,
  },
  credentialValueFilled: {
    fontWeight: "700",
  },
  credentialValuePlaceholder: {
    fontWeight: "600",
  },
  credentialActionsSlot: {
    alignItems: "flex-end",
    justifyContent: "center",
    width: 72,
  },
  singleActionWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
  },
  credentialDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 34,
  },
  passwordActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 0,
    justifyContent: "flex-end",
    width: 72,
  },
});
