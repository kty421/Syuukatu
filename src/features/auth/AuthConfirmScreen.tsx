import { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTheme } from '../../constants/theme';
import { AppButton } from '../../ui/AppButton';
import {
  getInitialConfirmState,
  verifyEmailConfirmationLink
} from './application/usecases/webAuthFlowUsecases';
import {
  AuthConfirmState,
  INVALID_CONFIRM_LINK_MESSAGE
} from './domain/entities/authFlow';

type AuthConfirmScreenProps = {
  onBackToSignIn: () => void;
};

export const AuthConfirmScreen = ({
  onBackToSignIn
}: AuthConfirmScreenProps) => {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);
  const hasVerifiedRef = useRef(false);
  const [confirmState, setConfirmState] = useState<AuthConfirmState>(
    getInitialConfirmState
  );
  const isSuccess = confirmState.status === 'success';
  const isLoading = confirmState.status === 'loading';

  useEffect(() => {
    if (hasVerifiedRef.current) {
      return;
    }

    hasVerifiedRef.current = true;

    verifyEmailConfirmationLink()
      .then(setConfirmState)
      .catch(() => {
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
            {isLoading
              ? 'メール確認中'
              : isSuccess
                ? 'メールアドレスの確認が完了しました'
                : 'メール確認'}
          </Text>
          <Text
            style={[
              theme.typography.body,
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
    borderWidth: StyleSheet.hairlineWidth,
    gap: 18,
    maxWidth: 420,
    width: '100%'
  },
  title: {
    textAlign: 'center'
  },
  body: {
    textAlign: 'center'
  }
});
