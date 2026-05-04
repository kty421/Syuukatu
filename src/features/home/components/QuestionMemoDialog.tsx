import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { AppTheme } from '../../../constants/theme';
import { AppButton } from '../../../ui/AppButton';
import { DismissKeyboardView } from '../../../ui/DismissKeyboardView';
import { FullScreenModalShell } from '../../../ui/FullScreenModalShell';
import { InputField } from '../../../ui/InputField';
import { CompanyQuestionAnswer } from '../types';

type QuestionMemoDialogProps = {
  item: CompanyQuestionAnswer | null;
  theme: AppTheme;
  saveNoticeKey?: number;
  onClose: () => void;
  onSave: (item: CompanyQuestionAnswer) => void;
};

export const QuestionMemoDialog = ({
  item,
  theme,
  saveNoticeKey,
  onClose,
  onSave
}: QuestionMemoDialogProps) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saveNoticeVisible, setSaveNoticeVisible] = useState(false);

  useEffect(() => {
    if (!item) {
      return;
    }

    setQuestion(item.question);
    setAnswer(item.answer);
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
              保存しました。続けて入力できます。
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
              autoFocus
              label="題目"
              theme={theme}
              value={question}
              placeholder="例：学生時代に力を入れたこと"
              onChangeText={setQuestion}
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
            <AppButton
              label="保存"
              onPress={() =>
                onSave({
                  ...item,
                  question,
                  answer
                })
              }
              theme={theme}
              variant="primary"
            />
          </DismissKeyboardView>
        </KeyboardAwareScrollView>
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
  }
});
