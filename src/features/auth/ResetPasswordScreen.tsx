import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTheme } from '../../constants/theme';
import { requireWebSupabase } from '../../services/webSupabase';
import { AppButton } from '../../ui/AppButton';
import { DismissKeyboardView } from '../../ui/DismissKeyboardView';
import { IconButton } from '../../ui/IconButton';
import { InputField } from '../../ui/InputField';
import { normalizeAuthErrorMessage } from './authErrors';

const MIN_PASSWORD_LENGTH = 8;
const INVALID_LINK_MESSAGE =
  'リンクが無効、または有効期限が切れています。再度パスワード再設定メールを送信してください。';

type ResetPasswordStatus = 'loading' | 'ready' | 'error';

type ResetPasswordScreenProps = {
  onBackToSignIn: () => void;
};

const getResetPasswordUrlParams = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return {
      code: null,
      error: null,
      errorCode: null,
      errorDescription: null
    };
  }

  const searchParams = new URLSearchParams(window.location.search);

  return {
    code: searchParams.get('code'),
    error: searchParams.get('error'),
    errorCode: searchParams.get('error_code'),
    errorDescription: searchParams.get('error_description')
  };
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
      const { code, error, errorCode, errorDescription } =
        getResetPasswordUrlParams();

      if (error || errorCode || errorDescription || !code) {
        setResetPasswordStatus('error');
        setLinkError(INVALID_LINK_MESSAGE);
        return;
      }

      try {
        const supabase = requireWebSupabase();
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setResetPasswordStatus('error');
          setLinkError(INVALID_LINK_MESSAGE);
          return;
        }

        setResetPasswordStatus('ready');
        setLinkError(null);
      } catch {
        setResetPasswordStatus('error');
        setLinkError(INVALID_LINK_MESSAGE);
      }
    };

    void preparePasswordReset();
  }, []);

  const updatePassword = useCallback(async () => {
    if (isSubmitting || isUpdated) {
      return;
    }

    if (resetPasswordStatus !== 'ready') {
      setError(INVALID_LINK_MESSAGE);
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError('パスワードは8文字以上で入力してください。');
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
      const supabase = requireWebSupabase();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setNewPassword('');
      setConfirmPassword('');
      setIsUpdated(true);
      setMessage('パスワードを更新しました');
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? normalizeAuthErrorMessage(caughtError.message)
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
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          読み込み中
        </Text>
      );
    }

    if (resetPasswordStatus === 'error' && !isUpdated) {
      return (
        <>
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>
            {linkError ?? INVALID_LINK_MESSAGE}
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
          <Text style={[styles.messageText, { color: theme.colors.success }]}>
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
          placeholder="8文字以上で入力"
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
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>
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
                borderColor: theme.colors.border
              }
            ]}
          >
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
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
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 420,
    padding: 22,
    width: '100%'
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 29,
    marginBottom: 20,
    textAlign: 'center'
  },
  form: {
    gap: 16
  },
  body: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    textAlign: 'center'
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center'
  },
  messageText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center'
  }
});
