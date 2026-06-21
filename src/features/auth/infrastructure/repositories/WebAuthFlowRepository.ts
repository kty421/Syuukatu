import type { EmailOtpType } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { requireWebSupabase } from '../../../../services/webSupabase';
import {
  AuthConfirmState,
  EXPIRED_CONFIRM_LINK_MESSAGE,
  INVALID_CONFIRM_LINK_MESSAGE,
  INVALID_PASSWORD_RESET_LINK_MESSAGE,
  PasswordResetPreparation
} from '../../domain/entities/authFlow';
import { AuthFlowRepository } from '../../domain/repositories/AuthFlowRepository';
import { normalizeAuthErrorMessage } from '../../authErrors';

type AuthUrlParams = {
  accessToken: string | null;
  code: string | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  refreshToken: string | null;
  tokenHash: string | null;
  type: string | null;
};

const getAuthUrlParams = (): AuthUrlParams => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return {
      accessToken: null,
      code: null,
      error: null,
      errorCode: null,
      errorDescription: null,
      refreshToken: null,
      tokenHash: null,
      type: null
    };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const getParam = (key: string) =>
    searchParams.get(key) ?? hashParams.get(key);

  return {
    accessToken: getParam('access_token'),
    code: getParam('code'),
    error: getParam('error'),
    errorCode: getParam('error_code'),
    errorDescription: getParam('error_description'),
    refreshToken: getParam('refresh_token'),
    tokenHash: getParam('token_hash'),
    type: getParam('type')
  };
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

const getConfirmLinkErrorMessage = (
  ...values: Array<string | undefined>
) =>
  isExpiredLinkError(...values)
    ? EXPIRED_CONFIRM_LINK_MESSAGE
    : INVALID_CONFIRM_LINK_MESSAGE;

const getErrorConfirmState = (
  ...values: Array<string | undefined>
): AuthConfirmState => ({
  status: 'error',
  message: getConfirmLinkErrorMessage(...values)
});

const getConfirmOtpType = (type: string | null): EmailOtpType | null => {
  if (!type || type === 'signup') {
    return 'signup';
  }

  if (type === 'email') {
    return 'email';
  }

  return null;
};

const getRecoveryOtpType = (type: string | null): EmailOtpType | null => {
  if (!type || type === 'recovery') {
    return 'recovery';
  }

  return null;
};

const getInvalidPasswordResetPreparation =
  (): PasswordResetPreparation => ({
    status: 'error',
    message: INVALID_PASSWORD_RESET_LINK_MESSAGE
  });

const hasUrlError = ({
  error,
  errorCode,
  errorDescription
}: Pick<AuthUrlParams, 'error' | 'errorCode' | 'errorDescription'>) =>
  Boolean(error || errorCode || errorDescription);

const signOutLocalSession = async () => {
  await requireWebSupabase().auth.signOut({ scope: 'local' }).catch(() => {});
};

export const webAuthFlowRepository: AuthFlowRepository = {
  preparePasswordReset: async () => {
    const params = getAuthUrlParams();

    if (hasUrlError(params)) {
      return getInvalidPasswordResetPreparation();
    }

    try {
      const supabase = requireWebSupabase();

      if (params.tokenHash) {
        const otpType = getRecoveryOtpType(params.type);

        if (!otpType) {
          return getInvalidPasswordResetPreparation();
        }

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: params.tokenHash,
          type: otpType
        });

        if (error || !data.session) {
          return getInvalidPasswordResetPreparation();
        }
      } else if (params.accessToken && params.refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken
        });

        if (error) {
          return getInvalidPasswordResetPreparation();
        }
      } else if (params.code) {
        const { error } =
          await supabase.auth.exchangeCodeForSession(params.code);

        if (error) {
          return getInvalidPasswordResetPreparation();
        }
      } else {
        return getInvalidPasswordResetPreparation();
      }

      return {
        status: 'ready'
      };
    } catch {
      return getInvalidPasswordResetPreparation();
    }
  },
  updatePassword: async (newPassword: string) => {
    try {
      const supabase = requireWebSupabase();
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});

      return 'パスワードを更新しました';
    } catch (caughtError) {
      throw new Error(
        caughtError instanceof Error
          ? normalizeAuthErrorMessage(caughtError.message)
          : 'パスワードの更新に失敗しました。',
        {
          cause: caughtError
        }
      );
    }
  },
  verifyEmailConfirmationLink: async () => {
    const params = getAuthUrlParams();

    if (hasUrlError(params)) {
      return getErrorConfirmState(
        params.error ?? undefined,
        params.errorCode ?? undefined,
        params.errorDescription ?? undefined
      );
    }

    try {
      const supabase = requireWebSupabase();

      if (params.tokenHash) {
        const otpType = getConfirmOtpType(params.type);

        if (!otpType) {
          return {
            status: 'error',
            message: INVALID_CONFIRM_LINK_MESSAGE
          };
        }

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: params.tokenHash,
          type: otpType
        });

        if (error || !data.user) {
          return getErrorConfirmState(error?.message);
        }

        await signOutLocalSession();

        return {
          status: 'success',
          message: 'メールアドレスの確認が完了しました'
        };
      }

      if (params.accessToken && params.refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken
        });

        if (error) {
          return getErrorConfirmState(error.message);
        }

        await signOutLocalSession();

        return {
          status: 'success',
          message: 'メールアドレスの確認が完了しました'
        };
      }

      if (params.code) {
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(params.code);

        if (error || !data.user) {
          return getErrorConfirmState(error?.message);
        }

        await signOutLocalSession();

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
  }
};
