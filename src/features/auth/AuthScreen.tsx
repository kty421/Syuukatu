import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTheme } from '../../constants/theme';
import { AppButton } from '../../ui/AppButton';
import { DismissKeyboardView } from '../../ui/DismissKeyboardView';
import { InputField } from '../../ui/InputField';
import {
  getRememberedEmail,
  sendPasswordReset,
  setRememberedEmail,
  signIn,
  signUp
} from './authService';
import { useAuth } from './AuthProvider';
import { AuthMode } from './types';

const webCursor =
  Platform.OS === 'web'
    ? ({ cursor: 'pointer' } as unknown as object)
    : null;

export const AuthScreen = () => {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberEmail, setRememberEmailState] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSignIn = mode === 'signIn';
  const title = isSignIn ? 'ログイン' : '新規登録';
  const submitLabel = isSignIn ? 'ログインする' : '登録する';
  const canSubmit =
    email.trim().length > 0 &&
    (isSignIn
      ? password.length > 0
      : password.length >= 8 &&
        confirmPassword.length >= 8 &&
        password === confirmPassword);

  const passwordAutoComplete = useMemo(
    () => (isSignIn ? 'current-password' : 'new-password'),
    [isSignIn]
  );

  useEffect(() => {
    let mounted = true;

    getRememberedEmail().then((storedEmail) => {
      if (mounted && storedEmail) {
        setEmail(storedEmail);
        setRememberEmailState(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const submit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!email.trim()) {
      setError('メールアドレスを入力してください。');
      return;
    }

    if (!isSignIn && password.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }

    if (!isSignIn && password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    if (!canSubmit) {
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const trimmedEmail = email.trim();
      const authResponse = isSignIn
        ? await signIn(trimmedEmail, password)
        : await signUp(trimmedEmail, password);
      await setRememberedEmail(trimmedEmail, rememberEmail);
      setPassword('');
      setConfirmPassword('');

      if (authResponse?.user) {
        await refreshUser();
        return;
      }

      if (!isSignIn) {
        setConfirmationEmail(trimmedEmail);
        setMessage(
          authResponse?.message ??
            '確認メールを送信しました。メール内のリンクから登録を完了してください。'
        );
        return;
      }

      setMessage(
        authResponse?.message ??
          'ログイン状態を確認できませんでした。もう一度ログインしてください。'
      );
    } catch (caughtError) {
      if (!isSignIn) {
        setPassword('');
        setConfirmPassword('');
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : '認証に失敗しました。入力内容を確認してください。'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim() || isResetting) {
      setError('メールアドレスを入力してください。');
      return;
    }

    setIsResetting(true);
    setError(null);
    setMessage(null);

    try {
      await sendPasswordReset(email.trim());
      setMessage('パスワード再設定用のメールを送信しました。');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : '再設定メールの送信に失敗しました。'
      );
    } finally {
      setIsResetting(false);
    }
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
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                {title}
              </Text>
              <Text style={[styles.lead, { color: theme.colors.textMuted }]}>
                就活管理を安全に同期して利用できます。
              </Text>
            </View>

            {!isSignIn && confirmationEmail ? (
              <View style={styles.confirmationState}>
                <Text
                  style={[
                    styles.confirmationTitle,
                    { color: theme.colors.textPrimary }
                  ]}
                >
                  確認メールを送信しました
                </Text>
                <Text
                  style={[
                    styles.confirmationText,
                    { color: theme.colors.textMuted }
                  ]}
                >
                  メール内のリンクを開くと登録が完了します。認証が完了すると自動でホーム画面に移動します。
                </Text>
                {message ? (
                  <Text
                    style={[
                      styles.messageText,
                      { color: theme.colors.primary }
                    ]}
                  >
                    {message}
                  </Text>
                ) : null}
                <AppButton
                  label="ログイン画面へ"
                  onPress={() => {
                    setMode('signIn');
                    setConfirmationEmail(null);
                    setMessage(null);
                    setError(null);
                  }}
                  theme={theme}
                  variant="secondary"
                />
              </View>
            ) : (
              <>
            <View style={styles.form}>
              <InputField
                label="メールアドレス"
                theme={theme}
                value={email}
                placeholder="name@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
                onChangeText={setEmail}
                onSubmitEditing={() => {
                  if (canSubmit) {
                    void submit();
                  }
                }}
              />
              <InputField
                label="パスワード"
                theme={theme}
                value={password}
                placeholder="8文字以上"
                autoCapitalize="none"
                autoComplete={passwordAutoComplete}
                secureTextEntry
                textContentType={isSignIn ? 'password' : 'newPassword'}
                onChangeText={setPassword}
                onSubmitEditing={() => {
                  void submit();
                }}
              />
              {!isSignIn ? (
                <InputField
                  label="パスワード確認"
                  theme={theme}
                  value={confirmPassword}
                  placeholder="もう一度入力"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  secureTextEntry
                  textContentType="newPassword"
                  onChangeText={setConfirmPassword}
                  onSubmitEditing={() => {
                    void submit();
                  }}
                />
              ) : null}

              <View style={styles.checkboxRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberEmail }}
                  accessibilityLabel="ログインIDを保存する"
                  onPress={() => setRememberEmailState((current) => !current)}
                  style={({ pressed }) => [
                    styles.checkboxHitArea,
                    webCursor,
                    pressed && styles.pressed
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: rememberEmail
                          ? theme.colors.primary
                          : theme.colors.surfaceElevated,
                        borderColor: rememberEmail
                          ? theme.colors.primary
                          : theme.colors.border
                      }
                    ]}
                  >
                    {rememberEmail ? (
                      <Text
                        style={[
                          styles.checkboxMark,
                          { color: theme.colors.textOnPrimary }
                        ]}
                      >
                        ✓
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
                <View style={styles.checkboxTextBlock}>
                  <Text
                    style={[
                      styles.checkboxLabel,
                      { color: theme.colors.textPrimary }
                    ]}
                  >
                    ログインIDを保存する
                  </Text>
                  <Text
                    style={[
                      styles.checkboxHint,
                      { color: theme.colors.textMuted }
                    ]}
                  >
                    共有端末では保存しないでください。
                  </Text>
                </View>
              </View>

              {error ? (
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                  {error}
                </Text>
              ) : null}
              {message ? (
                <Text style={[styles.messageText, { color: theme.colors.primary }]}>
                  {message}
                </Text>
              ) : null}

              <AppButton
                label={submitLabel}
                loading={isSubmitting}
                disabled={!canSubmit}
                onPress={() => {
                  void submit();
                }}
                theme={theme}
              />

              {isSignIn ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void resetPassword();
                  }}
                  style={({ pressed }) => [
                    styles.textButton,
                    webCursor,
                    pressed && styles.pressed
                  ]}
                >
                  {isResetting ? (
                    <ActivityIndicator color={theme.colors.primary} />
                  ) : (
                    <Text
                      style={[
                        styles.textButtonLabel,
                        { color: theme.colors.primary }
                      ]}
                    >
                      パスワードを再設定する
                    </Text>
                  )}
                </Pressable>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMode(isSignIn ? 'signUp' : 'signIn');
                setConfirmPassword('');
                setConfirmationEmail(null);
                setError(null);
                setMessage(null);
              }}
              style={({ pressed }) => [
                styles.modeSwitch,
                webCursor,
                pressed && styles.pressed
              ]}
            >
              <Text
                style={[
                  styles.modeSwitchText,
                  { color: theme.colors.textSecondary }
                ]}
              >
                {isSignIn
                  ? '新規登録はこちら'
                  : 'ログイン画面に戻る'}
              </Text>
            </Pressable>
              </>
            )}
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
  header: {
    gap: 8,
    marginBottom: 22
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center'
  },
  lead: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center'
  },
  form: {
    gap: 16
  },
  confirmationState: {
    gap: 16
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    textAlign: 'center'
  },
  confirmationText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center'
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 44
  },
  checkboxHitArea: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 24,
    justifyContent: 'center',
    width: 24
  },
  checkboxMark: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19
  },
  checkboxTextBlock: {
    flex: 1,
    minWidth: 0
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18
  },
  checkboxHint: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 2
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19
  },
  messageText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19
  },
  textButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40
  },
  textButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18
  },
  modeSwitch: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 40
  },
  modeSwitchText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.72
  }
});
