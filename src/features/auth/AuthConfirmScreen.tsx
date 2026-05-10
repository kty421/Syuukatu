import type { EmailOtpType } from '@supabase/supabase-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
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

const INVALID_CONFIRM_LINK_MESSAGE =
  '確認リンクが無効です。最新のメールから再度お試しください。';
const EXPIRED_CONFIRM_LINK_MESSAGE =
  'メールリンクが無効、または有効期限が切れています。最新のメールから再度お試しください。';

type ConfirmState = {
  status: 'loading' | 'success' | 'error';
  message: string;
};

type AuthConfirmScreenProps = {
  onBackToSignIn: () => void;
};

const isExpiredLinkError = (...values: Array<string | undefined>) =>
  values.some((value) => {
    const normalized = value?.toLowerCase() ?? '';

    return (
      normalized.includes('otp_expired') ||
      normalized.includes('expired') ||
      normalized.includes('already been used')
    );
  });

const getConfirmUrlParams = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return {
      code: null,
      tokenHash: null,
      type: null,
      accessToken: null,
      refreshToken: null,
      error: null,
      errorCode: null,
      errorDescription: null
    };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const getParam = (key: string) =>
    searchParams.get(key) ?? hashParams.get(key);

  return {
    code: getParam('code'),
    tokenHash: getParam('token_hash'),
    type: getParam('type'),
    accessToken: getParam('access_token'),
    refreshToken: getParam('refresh_token'),
    error: getParam('error'),
    errorCode: getParam('error_code'),
    errorDescription: getParam('error_description')
  };
};

const getConfirmOtpType = (type: string | null): EmailOtpType | null => {
  if (!type || type === 'signup') {
    return 'signup';
  }

  if (type === 'email') {
    return 'email';
  }

  return null;
};

const getConfirmLinkErrorMessage = (
  ...values: Array<string | undefined>
) =>
  isExpiredLinkError(...values)
    ? EXPIRED_CONFIRM_LINK_MESSAGE
    : INVALID_CONFIRM_LINK_MESSAGE;

const getInitialConfirmState = (): ConfirmState => ({
  status: 'loading',
  message: '確認中'
});

const getErrorConfirmState = (
  ...values: Array<string | undefined>
): ConfirmState => ({
  status: 'error',
  message: getConfirmLinkErrorMessage(...values)
});

const verifyConfirmLink = async (): Promise<ConfirmState> => {
  const {
    code,
    tokenHash,
    type,
    accessToken,
    refreshToken,
    error,
    errorCode,
    errorDescription
  } = getConfirmUrlParams();

  if (error || errorCode || errorDescription) {
    return getErrorConfirmState(
      error ?? undefined,
      errorCode ?? undefined,
      errorDescription ?? undefined
    );
  }

  try {
    const supabase = requireWebSupabase();

    if (tokenHash) {
      const otpType = getConfirmOtpType(type);

      if (!otpType) {
        return {
          status: 'error',
          message: INVALID_CONFIRM_LINK_MESSAGE
        };
      }

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType
      });

      if (verifyError || !data.user) {
        return getErrorConfirmState(verifyError?.message);
      }

      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});

      return {
        status: 'success',
        message: 'メールアドレスの確認が完了しました'
      };
    }

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (sessionError) {
        return getErrorConfirmState(sessionError.message);
      }

      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});

      return {
        status: 'success',
        message: 'メールアドレスの確認が完了しました'
      };
    }

    if (code) {
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError || !data.user) {
        return getErrorConfirmState(exchangeError?.message);
      }

      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});

      return {
        status: 'success',
        message: 'メールアドレスの確認が完了しました'
      };
    }

    return {
      status: 'error',
      message: INVALID_CONFIRM_LINK_MESSAGE
    };
  } catch {
    return {
      status: 'error',
      message: INVALID_CONFIRM_LINK_MESSAGE
    };
  }
};

export const AuthConfirmScreen = ({
  onBackToSignIn
}: AuthConfirmScreenProps) => {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);
  const hasVerifiedRef = useRef(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(
    getInitialConfirmState
  );
  const isSuccess = confirmState.status === 'success';
  const isLoading = confirmState.status === 'loading';

  useEffect(() => {
    if (hasVerifiedRef.current) {
      return;
    }

    hasVerifiedRef.current = true;

    verifyConfirmLink().then(setConfirmState).catch(() => {
      setConfirmState({
        status: 'error',
        message: INVALID_CONFIRM_LINK_MESSAGE
      });
    });
  }, []);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
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
            {isLoading
              ? 'メール確認中'
              : isSuccess
                ? 'メールアドレスの確認が完了しました'
                : 'メール確認'}
          </Text>
          <Text
            style={[
              styles.body,
              {
                color:
                  isSuccess || isLoading
                    ? theme.colors.textMuted
                    : theme.colors.danger
              }
            ]}
          >
            {isLoading
              ? 'メールリンクを確認しています'
              : isSuccess
                ? 'ログイン画面からログインしてください'
                : confirmState.message}
          </Text>
          {!isLoading ? (
            <AppButton
              label="ログイン画面へ"
              onPress={onBackToSignIn}
              theme={theme}
              variant={isSuccess ? 'primary' : 'secondary'}
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
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
    gap: 18,
    maxWidth: 420,
    padding: 22,
    width: '100%'
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 29,
    textAlign: 'center'
  },
  body: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    textAlign: 'center'
  }
});
