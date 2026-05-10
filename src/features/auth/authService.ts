import { Platform } from 'react-native';

import { apiRequest } from '../../services/apiClient';
import { requireNativeSupabase } from '../../services/nativeSupabase';
import { normalizeAuthError } from './authErrors';
import { AuthUser } from './types';

type AuthResponse = {
  user: AuthUser | null;
  message?: string;
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  if (Platform.OS === 'web') {
    try {
      const response = await apiRequest<AuthResponse>('/api/auth/session');
      return response.user;
    } catch {
      return null;
    }
  }

  const supabase = requireNativeSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null
  };
};

export const getNativeAccessToken = async () => {
  if (Platform.OS === 'web') {
    return null;
  }

  const supabase = requireNativeSupabase();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session?.access_token ?? null;
};

export const signIn = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  if (Platform.OS === 'web') {
    return apiRequest<AuthResponse>('/api/auth/sign-in', {
      method: 'POST',
      body: { email, password }
    });
  }

  const { data, error } = await requireNativeSupabase().auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw normalizeAuthError(error);
  }

  return {
    user: data.session && data.user
      ? {
          id: data.user.id,
          email: data.user.email ?? null
        }
      : null
  };
};

export const signUp = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>('/api/auth/sign-up', {
    method: 'POST',
    body: { email, password }
  });
};

export const completeNativeAuthCallback = async (url: string) => {
  if (Platform.OS === 'web') {
    return false;
  }

  const callbackUrl = new URL(url);
  const code = callbackUrl.searchParams.get('code');

  if (!code) {
    return false;
  }

  const { data, error } =
    await requireNativeSupabase().auth.exchangeCodeForSession(code);

  if (error) {
    throw error;
  }

  return Boolean(data.session);
};

export const signOut = async () => {
  if (Platform.OS === 'web') {
    await apiRequest('/api/auth/sign-out', { method: 'POST' });
    return;
  }

  await requireNativeSupabase().auth.signOut();
};

export const sendPasswordReset = async (email: string) => {
  await apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: { email }
  });
};

export const resendConfirmationEmail = async (email: string) => {
  await apiRequest('/api/auth/resend-confirmation', {
    method: 'POST',
    body: { email }
  });
};
