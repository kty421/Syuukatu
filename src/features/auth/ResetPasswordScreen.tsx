import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  View,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTheme } from '../../constants/theme';
import { AppButton } from '../../ui/AppButton';
import { DismissKeyboardView } from '../../ui/DismissKeyboardView';
import { IconButton } from '../../ui/IconButton';
import { InputField } from '../../ui/InputField';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENT_TEXT,
  PASSWORD_TOO_SHORT_MESSAGE
} from '../../shared/authPolicy';
import {
  INVALID_PASSWORD_RESET_LINK_MESSAGE,
  prepareWebPasswordReset,
  updateWebPassword
} from './application/usecases/webAuthFlowUsecases';

type ResetPasswordStatus = 'loading' | 'ready' | 'error';

type ResetPasswordScreenProps = {
  onBackToSignIn: () => void;
};

export const ResetPasswordScreen = ({
  onBackToSignIn
}: ResetPasswordScreenProps) => {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);
  const hasExchangedCodeRef = useRef(false);
  const [resetPasswordStatus, setResetPasswordStatus] =
    useState<ResetPasswordStatus>('loading');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasExchangedCodeRef.current) {
      return;
    }

    hasExchangedCodeRef.current = true;

    const preparePasswordReset = async () => {
      const result = await prepareWebPasswordReset();

      if (result.status === 'ready') {
        setResetPasswordStatus('ready');
        setLinkError(null);
        return;
      }

      setResetPasswordStatus('error');
      setLinkError(result.message ?? INVALID_PASSWORD_RESET_LINK_MESSAGE);
    };

    preparePasswordReset().catch(() => {
      setResetPasswordStatus('error');
      setLinkError(INVALID_PASSWORD_RESET_LINK_MESSAGE);
    });
  }, []);

  const updatePassword = useCallback(async () => {
    if (isSubmitting || isUpdated) {
      return;
    }

    if (resetPasswordStatus !== 'ready') {
      setError(INVALID_PASSWORD_RESET_LINK_MESSAGE);
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(PASSWORD_TOO_SHORT_MESSAGE);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('2つのパスワードが一致しません。');
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const successMessage = await updateWebPassword(newPassword);

      setNewPassword('');
      setConfirmPassword('');
      setIsUpdated(true);
      setMessage(successMessage);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'パスワードの更新に失敗しました。'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    confirmPassword,
    isSubmitting,
    isUpdated,
    newPassword,
    resetPasswordStatus
  ]);

  const renderBody = () => {
    if (resetPasswordStatus === 'loading') {
      return (
        <Text
          style={[
            theme.typography.body,
            styles.body,
            { color: theme.colors.textMuted }
          ]}
        >
          読み込み中
        </Text>
      );
    }

    if (resetPasswordStatus === 'error' && !isUpdated) {
      return (
        <>
          <Text
            style={[
              theme.typography.footnote,
              styles.errorText,
              { color: theme.colors.danger }
            ]}
          >
            {linkError ?? INVALID_PASSWORD_RESET_LINK_MESSAGE}
          </Text>
          <AppButton
            label="ログイン画面へ"
            onPress={onBackToSignIn}
            theme={theme}
            variant="secondary"
          />
        </>
      );
    }

    if (isUpdated) {
      return (
        <>
          <Text
            style={[
              theme.typography.footnote,
              styles.messageText,
              { color: theme.colors.success }
            ]}
          >
            {message ?? 'パスワードを更新しました'}
          </Text>
          <AppButton
            label="ログイン画面へ"
            onPress={onBackToSignIn}
            theme={theme}
          />
        </>
      );
    }

    return (
      <>
        <InputField
          label="新しいパスワード"
          theme={theme}
          value={newPassword}
          placeholder={PASSWORD_REQUIREMENT_TEXT}
          autoCapitalize="none"
          autoComplete="new-password"
          secureTextEntry={!passwordVisible}
          textContentType="newPassword"
          onChangeText={setNewPassword}
          onSubmitEditing={() => {
            void updatePassword();
          }}
          trailing={
            <IconButton
              icon={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              label={passwordVisible ? 'パスワードを隠す' : 'パスワードを表示'}
              onPress={() => setPasswordVisible((current) => !current)}
              theme={theme}
              tone="accent"
              size="compact"
              variant="plain"
            />
          }
        />
        <Text
          style={[
            theme.typography.footnote,
            styles.requirementText,
            { color: theme.colors.textMuted }
          ]}
        >
          {PASSWORD_REQUIREMENT_TEXT}
        </Text>
        <InputField
          label="確認用パスワード"
          theme={theme}
          value={confirmPassword}
          placeholder="もう一度入力"
          autoCapitalize="none"
          autoComplete="new-password"
          secureTextEntry={!passwordVisible}
          textContentType="newPassword"
          onChangeText={setConfirmPassword}
          onSubmitEditing={() => {
            void updatePassword();
          }}
        />

        {error ? (
          <Text
            style={[
              theme.typography.footnote,
              styles.errorText,
              { color: theme.colors.danger }
            ]}
          >
            {error}
          </Text>
        ) : null}

        <AppButton
          label="パスワードを更新"
          loading={isSubmitting}
          disabled={
            isSubmitting ||
            newPassword.length < MIN_PASSWORD_LENGTH ||
            confirmPassword.length === 0
          }
          onPress={() => {
            void updatePassword();
          }}
          theme={theme}
        />
      </>
    );
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <DismissKeyboardView style={styles.flex}>
        <View style={styles.center}>
          <View
            style={[
              styles.panel,
              theme.shadows.surface,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.lg,
                padding: theme.spacing.xl
              }
            ]}
          >
            <Text
              style={[
                theme.typography.title2,
                styles.title,
                { color: theme.colors.textPrimary }
              ]}
            >
              新しいパスワードを設定
            </Text>
            <View style={styles.form}>{renderBody()}</View>
          </View>
        </View>
      </DismissKeyboardView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  flex: {
    flex: 1
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 420,
    width: '100%'
  },
  title: {
    marginBottom: 20,
    textAlign: 'center'
  },
  form: {
    gap: 16
  },
  body: {
    textAlign: 'center'
  },
  requirementText: {
    marginTop: -8
  },
  errorText: {
    fontWeight: '700',
    textAlign: 'center'
  },
  messageText: {
    fontWeight: '700',
    textAlign: 'center'
  }
});
