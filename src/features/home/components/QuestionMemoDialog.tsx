import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { AppTheme } from '../../../constants/theme';
import { AppButton } from '../../../ui/AppButton';
import { DismissKeyboardView } from '../../../ui/DismissKeyboardView';
import { FullScreenModalShell } from '../../../ui/FullScreenModalShell';
import { InputField } from '../../../ui/InputField';
import {
  CompanyQuestionAnswer,
  Company,
  QuestionLabel,
  QuestionMemo
} from '../types';
import { QuestionLabelCreateDialog } from './QuestionLabelCreateDialog';

type QuestionMemoDialogProps<T extends CompanyQuestionAnswer | QuestionMemo> = {
  item: T | null;
  labels: QuestionLabel[];
  theme: AppTheme;
  company?: Company | null;
  saveNoticeKey?: number;
  onClose: () => void;
  onSave: (item: T) => void;
  onCreateLabel: (name: string) => Promise<QuestionLabel>;
};

export const QuestionMemoDialog = <
  T extends CompanyQuestionAnswer | QuestionMemo
>({
  item,
  labels,
  theme,
  company,
  saveNoticeKey,
  onClose,
  onSave,
  onCreateLabel
}: QuestionMemoDialogProps<T>) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [labelCreateVisible, setLabelCreateVisible] = useState(false);
  const [saveNoticeVisible, setSaveNoticeVisible] = useState(false);
  const questionInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!item) {
      return;
    }

    setQuestion(item.question);
    setAnswer(item.answer);
    setSelectedLabelIds(item.labelIds ?? []);
    setTitleError(null);
    setLabelCreateVisible(false);
  }, [item]);

  useEffect(() => {
    if (!saveNoticeKey) {
      return undefined;
    }

    setSaveNoticeVisible(true);
    const timeout = setTimeout(() => {
      setSaveNoticeVisible(false);
    }, 1800);

    return () => clearTimeout(timeout);
  }, [saveNoticeKey]);

  if (!item) {
    return null;
  }

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((current) =>
      current.includes(labelId)
        ? current.filter((id) => id !== labelId)
        : [...current, labelId]
    );
  };

  const save = () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setTitleError('題目を入力してください');
      requestAnimationFrame(() => {
        questionInputRef.current?.focus();
      });
      return;
    }

    setTitleError(null);
    onSave({
      ...item,
      question: trimmedQuestion,
      answer,
      labelIds: selectedLabelIds
    });
  };

  return (
    <FullScreenModalShell
      visible
      title="質問メモ"
      theme={theme}
      onClose={onClose}
      closeIcon="close"
    >
      <View style={styles.dialogRoot}>
        {saveNoticeVisible ? (
          <View
            pointerEvents="none"
            style={[
              styles.saveNotice,
              theme.shadows.floating,
              {
                backgroundColor: theme.colors.surfaceOverlay,
                borderColor: theme.colors.primaryBorder,
                borderRadius: theme.radii.md
              }
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={17}
              color={theme.colors.primary}
            />
            <Text
              style={[
                theme.typography.footnote,
                styles.saveNoticeText,
                { color: theme.colors.textPrimary }
              ]}
            >
              保存中です。続けて入力できます。
            </Text>
          </View>
        ) : null}
        <KeyboardAwareScrollView
          bottomOffset={28}
          contentContainerStyle={styles.body}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <DismissKeyboardView style={styles.form}>
            {company ? (
              <View
                style={[
                  styles.companyContext,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radii.md
                  }
                ]}
              >
                <View style={styles.companyIcon}>
                  <Ionicons
                    name="business-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.companyCopy}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.companyName,
                      theme.typography.bodyStrong,
                      { color: theme.colors.textPrimary }
                    ]}
                  >
                    {company.companyName}
                  </Text>
                </View>
              </View>
            ) : null}
            <InputField
              ref={questionInputRef}
              autoFocus
              label="題目"
              required
              errorMessage={titleError}
              theme={theme}
              value={question}
              placeholder="例：学生時代に力を入れたこと"
              onChangeText={(value) => {
                setQuestion(value);
                if (titleError) {
                  setTitleError(null);
                }
              }}
            />
            <View>
              <InputField
                label="回答内容"
                theme={theme}
                value={answer}
                placeholder="話す要点やエピソード"
                multiline
                style={styles.answerTextInput}
                onChangeText={setAnswer}
              />
              <Text
                style={[
                  theme.typography.caption,
                  styles.answerCount,
                  { color: theme.colors.textDisabled }
                ]}
              >
                {answer.length}文字
              </Text>
            </View>

            <View>
              <View style={styles.labelHeader}>
                <Text
                  style={[
                    theme.typography.footnote,
                    styles.fieldLabel,
                    { color: theme.colors.textSecondary }
                  ]}
                >
                  ラベル
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="ラベルを追加"
                  onPress={() => setLabelCreateVisible(true)}
                  style={({ pressed }) => [
                    styles.addLabelButton,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radii.sm
                    },
                    pressed && styles.pressed
                  ]}
                >
                  <Ionicons name="add" size={17} color={theme.colors.primary} />
                </Pressable>
              </View>
              {labels.length > 0 ? (
                <View style={styles.labelChips}>
                  {labels.map((label) => {
                    const selected = selectedLabelIds.includes(label.id);

                    return (
                      <Pressable
                        key={label.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => toggleLabel(label.id)}
                        style={({ pressed }) => [
                          styles.labelChip,
                          {
                            backgroundColor: selected
                              ? theme.colors.primarySubtle
                              : theme.colors.surfaceElevated,
                            borderColor: selected
                              ? theme.colors.primaryBorder
                              : theme.colors.border,
                            borderRadius: theme.radii.pill
                          },
                          pressed && styles.pressed
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.labelChipText,
                            theme.typography.footnote,
                            {
                              color: selected
                                ? theme.colors.primary
                                : theme.colors.textSecondary
                            }
                          ]}
                        >
                          {label.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            <AppButton
              label="保存"
              onPress={save}
              theme={theme}
              variant="primary"
            />
          </DismissKeyboardView>
        </KeyboardAwareScrollView>
        <QuestionLabelCreateDialog
          visible={labelCreateVisible}
          labels={labels}
          theme={theme}
          onClose={() => setLabelCreateVisible(false)}
          continueAfterCreate
          onCreate={async (name) => {
            const createdLabel = await onCreateLabel(name);
            setSelectedLabelIds((current) =>
              current.includes(createdLabel.id)
                ? current
                : [...current, createdLabel.id]
            );
            return createdLabel;
          }}
        />
      </View>
    </FullScreenModalShell>
  );
};

const styles = StyleSheet.create({
  dialogRoot: {
    flex: 1
  },
  body: {
    alignSelf: 'center',
    maxWidth: 760,
    paddingBottom: 22,
    paddingHorizontal: 16,
    paddingTop: 14,
    width: '100%'
  },
  form: {
    gap: 14
  },
  companyContext: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  companyIcon: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28
  },
  companyCopy: {
    flex: 1,
    minWidth: 0
  },
  companyName: {
  },
  saveNotice: {
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    maxWidth: '90%',
    paddingHorizontal: 13,
    paddingVertical: 10,
    position: 'absolute',
    top: 10,
    zIndex: 10
  },
  saveNoticeText: {
    flexShrink: 1,
    fontWeight: '800'
  },
  answerTextInput: {
    minHeight: 196
  },
  answerCount: {
    marginTop: 7,
    textAlign: 'right'
  },
  fieldLabel: {
  },
  labelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 8
  },
  addLabelButton: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    height: 30,
    justifyContent: 'center',
    width: 32
  },
  labelChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  labelChip: {
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 160,
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  labelChipText: {
    fontWeight: '700'
  },
  pressed: {
    opacity: 0.72
  }
});
