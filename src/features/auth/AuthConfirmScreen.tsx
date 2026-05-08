import { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTheme } from '../../constants/theme';
import { AppButton } from '../../ui/AppButton';

const INVALID_CONFIRM_LINK_MESSAGE =
  '確認リンクが無効です。最新のメールから再度お試しください。';
const EXPIRED_CONFIRM_LINK_MESSAGE =
  'メールリンクが無効、または有効期限が切れています。最新のメールから再度お試しください。';

type ConfirmState = {
  status: 'success' | 'error';
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

const getInitialConfirmState = (): ConfirmState => {
  const { code, error, errorCode, errorDescription } = getConfirmUrlParams();

  if (error || errorCode || errorDescription) {
    return {
      status: 'error',
      message: isExpiredLinkError(
        errorCode ?? undefined,
        errorDescription ?? undefined
      )
        ? EXPIRED_CONFIRM_LINK_MESSAGE
        : INVALID_CONFIRM_LINK_MESSAGE
    };
  }

  if (!code) {
    return {
      status: 'error',
      message: INVALID_CONFIRM_LINK_MESSAGE
    };
  }

  return {
    status: 'success',
    message: 'メールアドレスの確認が完了しました'
  };
};

export const AuthConfirmScreen = ({
  onBackToSignIn
}: AuthConfirmScreenProps) => {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);
  const confirmState = useMemo(getInitialConfirmState, []);
  const isSuccess = confirmState.status === 'success';

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
            {isSuccess ? 'メールアドレスの確認が完了しました' : 'メール確認'}
          </Text>
          <Text
            style={[
              styles.body,
              { color: isSuccess ? theme.colors.textMuted : theme.colors.danger }
            ]}
          >
            {isSuccess
              ? 'ログイン画面からログインしてください'
              : confirmState.message}
          </Text>
          <AppButton
            label="ログイン画面へ"
            onPress={onBackToSignIn}
            theme={theme}
            variant={isSuccess ? 'primary' : 'secondary'}
          />
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
