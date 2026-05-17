import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { AppTheme } from "../../../constants/theme";
import { AppButton } from "../../../ui/AppButton";
import { DismissKeyboardView } from "../../../ui/DismissKeyboardView";
import { FullScreenModalShell } from "../../../ui/FullScreenModalShell";
import { InputField } from "../../../ui/InputField";
import { QuestionLabel } from "../types";

type QuestionLabelCreateDialogProps = {
  visible: boolean;
  labels: QuestionLabel[];
  theme: AppTheme;
  title?: string;
  submitLabel?: string;
  submitIcon?: keyof typeof Ionicons.glyphMap;
  failureMessage?: string;
  successMessage?: string;
  initialName?: string;
  ignoredLabelId?: string;
  continueAfterCreate?: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<QuestionLabel>;
};

export const QuestionLabelCreateDialog = ({
  visible,
  labels,
  theme,
  title = "ラベル追加",
  submitLabel = "追加",
  submitIcon = "add",
  failureMessage = "ラベルを作成できませんでした",
  successMessage = "ラベルを追加しました",
  initialName = "",
  ignoredLabelId,
  continueAfterCreate = false,
  onClose,
  onCreate,
}: QuestionLabelCreateDialogProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName(initialName);
    setError(null);
    setNotice(null);
    setIsCreating(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [initialName, visible]);

  useEffect(
    () => () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    },
    [],
  );

  const createLabel = async () => {
    const trimmedName = name.trim();

    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
      noticeTimeoutRef.current = null;
    }

    if (!trimmedName) {
      setError("ラベル名を入力してください");
      setNotice(null);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return;
    }

    if (
      labels.some(
        (label) => label.id !== ignoredLabelId && label.name === trimmedName,
      )
    ) {
      setError("同じ名前のラベルがあります");
      setNotice(null);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreate(trimmedName);
      if (!continueAfterCreate) {
        onClose();
        return;
      }

      setName("");
      setNotice(successMessage);
      noticeTimeoutRef.current = setTimeout(() => {
        setNotice(null);
        noticeTimeoutRef.current = null;
      }, 1800);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } catch {
      setError(failureMessage);
      setNotice(null);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <FullScreenModalShell
      visible={visible}
      title={title}
      theme={theme}
      onClose={onClose}>
      <KeyboardAwareScrollView
        bottomOffset={28}
        contentContainerStyle={styles.body}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <DismissKeyboardView style={styles.form}>
          {notice ? (
            <View
              style={[
                styles.notice,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Ionicons
                color={theme.colors.textSecondary}
                name="checkmark-circle"
                size={17}
              />
              <Text
                style={[styles.noticeText, { color: theme.colors.textPrimary }]}>
                {notice}
              </Text>
            </View>
          ) : null}
          <InputField
            ref={inputRef}
            label="ラベル名"
            required
            theme={theme}
            value={name}
            errorMessage={error}
            placeholder="ガクチカ、自己PR"
            onChangeText={(value) => {
              setName(value);
              if (error) {
                setError(null);
              }
              if (notice) {
                setNotice(null);
              }
            }}
            onSubmitEditing={() => {
              void createLabel();
            }}
          />
          <AppButton
            label={submitLabel}
            icon={submitIcon}
            loading={isCreating}
            disabled={isCreating}
            onPress={() => {
              void createLabel();
            }}
            theme={theme}
            variant="primary"
          />
        </DismissKeyboardView>
      </KeyboardAwareScrollView>
    </FullScreenModalShell>
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
  form: {
    gap: 16,
  },
  notice: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
});
