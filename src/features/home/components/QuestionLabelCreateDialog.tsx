import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { AppTheme } from '../../../constants/theme';
import { AppButton } from '../../../ui/AppButton';
import { DismissKeyboardView } from '../../../ui/DismissKeyboardView';
import { FullScreenModalShell } from '../../../ui/FullScreenModalShell';
import { InputField } from '../../../ui/InputField';
import { QuestionLabel } from '../types';

type QuestionLabelCreateDialogProps = {
  visible: boolean;
  labels: QuestionLabel[];
  theme: AppTheme;
  onClose: () => void;
  onCreate: (name: string) => Promise<QuestionLabel>;
};

export const QuestionLabelCreateDialog = ({
  visible,
  labels,
  theme,
  onClose,
  onCreate
}: QuestionLabelCreateDialogProps) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName('');
    setError(null);
    setIsCreating(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [visible]);

  const createLabel = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('ラベル名を入力してください');
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return;
    }

    if (labels.some((label) => label.name === trimmedName)) {
      setError('同じ名前のラベルがあります');
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreate(trimmedName);
      onClose();
    } catch {
      setError('ラベルを作成できませんでした');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <FullScreenModalShell
      visible={visible}
      title="ラベル追加"
      theme={theme}
      onClose={onClose}
    >
      <KeyboardAwareScrollView
        bottomOffset={28}
        contentContainerStyle={styles.body}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <DismissKeyboardView style={styles.form}>
          <InputField
            ref={inputRef}
            label="ラベル名"
            required
            theme={theme}
            value={name}
            errorMessage={error}
            placeholder="例：面接で聞く"
            onChangeText={(value) => {
              setName(value);
              if (error) {
                setError(null);
              }
            }}
            onSubmitEditing={() => {
              void createLabel();
            }}
          />
          <AppButton
            label="追加"
            icon="add"
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
    alignSelf: 'center',
    maxWidth: 760,
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    width: '100%'
  },
  form: {
    gap: 16
  }
});
