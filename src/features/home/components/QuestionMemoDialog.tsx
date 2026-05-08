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
  QuestionLabel,
  QuestionMemo
} from '../types';
import { QuestionLabelCreateDialog } from './QuestionLabelCreateDialog';

type QuestionMemoDialogProps<T extends CompanyQuestionAnswer | QuestionMemo> = {
  item: T | null;
  labels: QuestionLabel[];
  theme: AppTheme;
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
                borderColor: theme.colors.primaryBorder
              }
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={17}
              color={theme.colors.primary}
            />
            <Text style={[styles.saveNoticeText, { color: theme.colors.textPrimary }]}>
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
              <Text style={[styles.answerCount, { color: theme.colors.textDisabled }]}>
                {answer.length}文字
              </Text>
            </View>

            <View>
              <View style={styles.labelHeader}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
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
                      borderColor: theme.colors.border
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
                              : theme.colors.border
                          },
                          pressed && styles.pressed
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.labelChipText,
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
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    width: '100%'
  },
  form: {
    gap: 16
  },
  saveNotice: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 16,
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
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18
  },
  answerTextInput: {
    minHeight: 220
  },
  answerCount: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    marginTop: 7,
    textAlign: 'right'
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
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
    borderRadius: 14,
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
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 160,
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  labelChipText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16
  },
  pressed: {
    opacity: 0.72
  }
});
