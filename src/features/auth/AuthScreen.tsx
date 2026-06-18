import { useCallback, useMemo, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getTheme } from "../../constants/theme";
import { AppButton } from "../../ui/AppButton";
import { DismissKeyboardView } from "../../ui/DismissKeyboardView";
import { IconButton } from "../../ui/IconButton";
import { InputField } from "../../ui/InputField";
import { useResponsiveLayout } from "../../ui/useResponsiveLayout";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENT_TEXT,
  PASSWORD_TOO_SHORT_MESSAGE,
} from "../../shared/authPolicy";
import {
  resendConfirmationEmail,
  sendPasswordReset,
  signIn,
  signUp,
} from "./authService";
import { normalizeAuthErrorMessage } from "./authErrors";
import { useOptionalAuth } from "./AuthProvider";
import { AuthMode } from "./types";

const webCursor =
  Platform.OS === "web" ? ({ cursor: "pointer" } as unknown as object) : null;

type AuthScreenProps = {
  initialMode?: AuthMode;
  onAuthenticated?: () => void;
  onBackToSignIn?: () => void;
};

export const AuthScreen = ({
  initialMode = "signIn",
  onAuthenticated,
  onBackToSignIn,
}: AuthScreenProps) => {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);
  const responsive = useResponsiveLayout();
  const isDesktopLayout = responsive.isExpanded;
  const auth = useOptionalAuth();
  const setAuthenticatedUser = auth?.setAuthenticatedUser;
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSignIn = mode === "signIn";
  const isSignUp = mode === "signUp";
  const isForgotPassword = mode === "forgotPassword";
  const title = isForgotPassword
    ? "パスワード再設定"
    : isSignIn
      ? "ログイン"
      : "新規登録";
  const isConfirmationState = isSignUp && Boolean(confirmationEmail);
  const submitLabel = isSignIn ? "ログインする" : "登録する";
  const canSubmit =
    email.trim().length > 0 &&
    (isForgotPassword
      ? true
      : isSignIn
        ? password.length > 0
        : password.length >= MIN_PASSWORD_LENGTH);
  const passwordAutoComplete = isSignIn ? "current-password" : "new-password";

  const submit = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    if (!email.trim()) {
      setError("メールアドレスを入力してください。");
      return;
    }

    if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
      setError(PASSWORD_TOO_SHORT_MESSAGE);
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

      if (isSignUp) {
        setConfirmationEmail(trimmedEmail);
        return;
      }

      if (authResponse?.user) {
        setPassword("");
        setAuthenticatedUser?.(authResponse.user);
        onAuthenticated?.();
        return;
      }

      setMessage(
        authResponse?.message ??
          "ログイン状態を確認できませんでした。もう一度ログインしてください。",
      );
    } catch (caughtError) {
      if (isSignUp) {
        setPassword("");
      }

      setError(
        caughtError instanceof Error
          ? normalizeAuthErrorMessage(caughtError.message)
          : "認証に失敗しました。入力内容を確認してください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canSubmit,
    email,
    isSignIn,
    isSignUp,
    isSubmitting,
    password,
    onAuthenticated,
    setAuthenticatedUser,
  ]);

  const backToSignIn = useCallback(() => {
    setMode("signIn");
    setPasswordVisible(false);
    setConfirmationEmail(null);
    setError(null);
    setMessage(null);
    onBackToSignIn?.();
  }, [onBackToSignIn]);

  const resendConfirmation = useCallback(async () => {
    const targetEmail = confirmationEmail ?? email.trim();

    if (!targetEmail || isResendingConfirmation) {
      return;
    }

    setIsResendingConfirmation(true);
    setError(null);
    setMessage(null);

    try {
      await resendConfirmationEmail(targetEmail);
      setMessage("確認メールを再送しました。受信ボックスを確認してください。");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? normalizeAuthErrorMessage(caughtError.message)
          : "確認メールの再送に失敗しました。",
      );
    } finally {
      setIsResendingConfirmation(false);
    }
  }, [confirmationEmail, email, isResendingConfirmation]);

  const resetPassword = useCallback(async () => {
    if (isResetting) {
      return;
    }

    if (!email.trim()) {
      setError("メールアドレスを入力してください。");
      return;
    }

    Keyboard.dismiss();
    setIsResetting(true);
    setError(null);
    setMessage(null);

    try {
      await sendPasswordReset(email.trim());
      setMessage(
        "パスワード再設定用のメールを送信しました。メールをご確認ください。",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? normalizeAuthErrorMessage(caughtError.message)
          : "再設定メールの送信に失敗しました。",
      );
    } finally {
      setIsResetting(false);
    }
  }, [email, isResetting]);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <DismissKeyboardView style={styles.flex}>
        <View style={[styles.center, isDesktopLayout && styles.centerDesktop]}>
          {isDesktopLayout ? (
            <View style={styles.desktopHero}>
              <Text
                style={[
                  styles.desktopHeroTitle,
                  { color: theme.colors.textPrimary },
                ]}>
                就活の情報管理を一箇所に。
              </Text>
              <Text
                style={[
                  styles.desktopHeroText,
                  { color: theme.colors.textMuted },
                ]}>
                企業、質問内容、日程などを横断して管理できます。PCでは広い画面で一覧を見ながら、スマホでは必要な情報だけをすばやく確認できます。
              </Text>
              <View style={styles.desktopHeroBullets}>
                {[
                  "企業ごとの選考状況を整理",
                  "質問内容と日程を横断検索",
                  "ログイン情報を安全に扱う",
                ].map((item) => (
                  <View key={item} style={styles.desktopHeroBullet}>
                    <View
                      style={[
                        styles.desktopHeroDot,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.desktopHeroBulletText,
                        { color: theme.colors.textSecondary },
                      ]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          <View
            style={[
              styles.panel,
              isDesktopLayout && styles.panelDesktop,
              theme.shadows.surface,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.lg,
                padding: theme.spacing.xl,
              },
            ]}>
            {!isConfirmationState ? (
              <View style={styles.header}>
                <Text
                  style={[
                    theme.typography.title2,
                    styles.title,
                    { color: theme.colors.textPrimary },
                  ]}>
                  {title}
                </Text>
              </View>
            ) : null}

            {isConfirmationState && confirmationEmail ? (
              <View style={styles.confirmationState}>
                <Text
                  style={[
                    theme.typography.title3,
                    styles.confirmationTitle,
                    { color: theme.colors.textPrimary },
                  ]}>
                  確認メールを送信しました
                </Text>
                <Text
                  style={[
                    theme.typography.footnote,
                    styles.confirmationText,
                    { color: theme.colors.textMuted },
                  ]}>
                  確認メールを送信しました。メール内のリンクから認証を完了してください。
                </Text>
                <View
                  style={[
                    styles.confirmationEmailBox,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radii.md,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.confirmationEmailLabel,
                      theme.typography.caption,
                      { color: theme.colors.textMuted },
                    ]}>
                    登録したメールアドレス
                  </Text>
                  <Text
                    selectable
                    style={[
                      styles.confirmationEmailValue,
                      theme.typography.label,
                      { color: theme.colors.textPrimary },
                    ]}>
                    {confirmationEmail}
                  </Text>
                </View>
                <Text
                  style={[
                    theme.typography.footnote,
                    styles.confirmationText,
                    { color: theme.colors.textMuted },
                  ]}>
                  メールが届かない場合は、迷惑メールフォルダを確認するか、少し時間をおいて再送してください。
                </Text>
                {error ? (
                  <Text
                    style={[
                      theme.typography.footnote,
                      styles.errorText,
                      { color: theme.colors.danger },
                    ]}>
                    {error}
                  </Text>
                ) : null}
                <AppButton
                  label="確認メールを再送"
                  loading={isResendingConfirmation}
                  disabled={isResendingConfirmation}
                  onPress={() => {
                    void resendConfirmation();
                  }}
                  theme={theme}
                />
                {message ? (
                  <Text
                    style={[
                      theme.typography.footnote,
                      styles.messageText,
                      { color: theme.colors.success },
                    ]}>
                    {message}
                  </Text>
                ) : null}
                <AppButton
                  label="メールアドレスを修正"
                  onPress={() => {
                    setConfirmationEmail(null);
                    setPassword("");
                    setMessage(null);
                    setError(null);
                  }}
                  theme={theme}
                  variant="secondary"
                />
                <AppButton
                  label="ログイン画面へ"
                  onPress={backToSignIn}
                  theme={theme}
                  variant="secondary"
                />
              </View>
            ) : isForgotPassword ? (
              <>
                <View style={styles.form}>
                  <InputField
                    label="メールアドレス"
                    theme={theme}
                    value={email}
                    placeholder="登録済みのメールアドレスを入力"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="username"
                    onChangeText={setEmail}
                    onSubmitEditing={() => {
                      void resetPassword();
                    }}
                  />

                  {error ? (
                    <Text
                      style={[
                        theme.typography.footnote,
                        styles.errorText,
                        { color: theme.colors.danger },
                      ]}>
                      {error}
                    </Text>
                  ) : null}
                  {message ? (
                    <Text
                      style={[
                        theme.typography.footnote,
                        styles.messageText,
                        { color: theme.colors.success },
                      ]}>
                      {message}
                    </Text>
                  ) : null}

                  <AppButton
                    label="再設定メールを送信"
                    loading={isResetting}
                    disabled={email.trim().length === 0 || isResetting}
                    onPress={() => {
                      void resetPassword();
                    }}
                    theme={theme}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={backToSignIn}
                  style={({ pressed }) => [
                    styles.modeSwitch,
                    webCursor,
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.modeSwitchText,
                      { color: theme.colors.textSecondary },
                    ]}>
                    ログイン画面に戻る
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.form}>
                  <InputField
                    label="メールアドレス"
                    theme={theme}
                    value={email}
                    placeholder="メールアドレスを入力"
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
                    placeholder="パスワードを入力"
                    autoCapitalize="none"
                    autoComplete={passwordAutoComplete}
                    secureTextEntry={!passwordVisible}
                    textContentType={isSignIn ? "password" : "newPassword"}
                    onChangeText={setPassword}
                    onSubmitEditing={() => {
                      void submit();
                    }}
                    trailing={
                      <IconButton
                        icon={
                          passwordVisible ? "eye-off-outline" : "eye-outline"
                        }
                        label={
                          passwordVisible
                            ? "パスワードを隠す"
                            : "パスワードを表示"
                        }
                        onPress={() =>
                          setPasswordVisible((current) => !current)
                        }
                        theme={theme}
                        tone="accent"
                        size="compact"
                        variant="plain"
                      />
                    }
                  />
                  {isSignUp ? (
                    <Text
                      style={[
                        theme.typography.footnote,
                        styles.requirementText,
                        { color: theme.colors.textMuted },
                      ]}>
                      {PASSWORD_REQUIREMENT_TEXT}
                    </Text>
                  ) : null}

                  {error ? (
                    <Text
                      style={[
                        theme.typography.footnote,
                        styles.errorText,
                        { color: theme.colors.danger },
                      ]}>
                      {error}
                    </Text>
                  ) : null}
                  {message ? (
                    <Text
                      style={[
                        theme.typography.footnote,
                        styles.messageText,
                        { color: theme.colors.primary },
                      ]}>
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
                        setMode("forgotPassword");
                        setPassword("");
                        setPasswordVisible(false);
                        setConfirmationEmail(null);
                        setError(null);
                        setMessage(null);
                      }}
                      style={({ pressed }) => [
                        styles.textButton,
                        webCursor,
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          theme.typography.footnote,
                          styles.textButtonLabel,
                          { color: theme.colors.primary },
                        ]}>
                        パスワードを忘れた場合
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setMode(isSignIn ? "signUp" : "signIn");
                    setPassword("");
                    setPasswordVisible(false);
                    setConfirmationEmail(null);
                    setError(null);
                    setMessage(null);
                  }}
                  style={({ pressed }) => [
                    styles.modeSwitch,
                    webCursor,
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.modeSwitchText,
                      theme.typography.footnote,
                      { color: theme.colors.textSecondary },
                    ]}>
                    {isSignIn ? "新規登録はこちら" : "ログイン画面に戻る"}
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
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  centerDesktop: {
    flexDirection: "row",
    gap: 48,
    paddingHorizontal: 56,
  },
  desktopHero: {
    flex: 1,
    maxWidth: 520,
  },
  desktopHeroTitle: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 42,
  },
  desktopHeroText: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 24,
    marginTop: 18,
  },
  desktopHeroBullets: {
    gap: 12,
    marginTop: 28,
  },
  desktopHeroBullet: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  desktopHeroDot: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  desktopHeroBulletText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 420,
    width: "100%",
  },
  panelDesktop: {
    flexShrink: 0,
  },
  header: {
    gap: 8,
    marginBottom: 22,
  },
  title: {
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  confirmationState: {
    gap: 16,
  },
  confirmationTitle: {
    textAlign: "center",
  },
  confirmationText: {
    textAlign: "center",
  },
  confirmationEmailBox: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  confirmationEmailLabel: {},
  confirmationEmailValue: {},
  errorText: {
    fontWeight: "700",
  },
  requirementText: {
    marginTop: -8,
  },
  messageText: {
    fontWeight: "700",
  },
  textButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  textButtonLabel: {
    fontWeight: "700",
  },
  modeSwitch: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    minHeight: 40,
  },
  modeSwitchText: {
    fontWeight: "700",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.72,
  },
});
