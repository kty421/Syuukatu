import Constants from 'expo-constants';
import { Platform } from 'react-native';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

type ExpoExtra = {
  apiBaseUrl?: unknown;
  supabaseUrl?: unknown;
  supabaseAnonKey?: unknown;
  webAuthCallbackUrl?: unknown;
  nativeAuthCallbackUrl?: unknown;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

const toEnvString = (value: unknown) => {
  const raw =
    typeof value === 'string' ? value : value == null ? '' : String(value);

  return raw.trim().replace(/^['"]|['"]$/g, '');
};

const readEnvValue = (processValue: string | undefined, extraValue: unknown) => {
  if (typeof processValue === 'string' && processValue.length > 0) {
    return processValue;
  }

  return toEnvString(extraValue);
};

const rawApiBaseUrl = readEnvValue(
  process.env.EXPO_PUBLIC_API_BASE_URL,
  extra.apiBaseUrl
);
const rawSupabaseUrl = readEnvValue(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  extra.supabaseUrl
);
const rawSupabaseAnonKey = readEnvValue(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  extra.supabaseAnonKey
);
const rawWebAuthCallbackUrl = readEnvValue(
  process.env.EXPO_PUBLIC_WEB_AUTH_CALLBACK_URL,
  extra.webAuthCallbackUrl
);
const rawNativeAuthCallbackUrl = readEnvValue(
  process.env.EXPO_PUBLIC_NATIVE_AUTH_CALLBACK_URL,
  extra.nativeAuthCallbackUrl
);

export const apiBaseUrl = rawApiBaseUrl
  ? trimTrailingSlash(rawApiBaseUrl)
  : '';

export const supabaseUrl = rawSupabaseUrl;
export const supabaseAnonKey = rawSupabaseAnonKey;
export const webAuthCallbackUrl = rawWebAuthCallbackUrl;
export const nativeAuthCallbackUrl =
  rawNativeAuthCallbackUrl || 'syuukatu://auth/callback';

export const hasNativeSupabaseConfig =
  supabaseUrl.trim().length > 0 && supabaseAnonKey.trim().length > 0;

export const getApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!path.startsWith('/')) {
    throw new Error('API path must start with /.');
  }

  if (Platform.OS === 'web') {
    return path;
  }

  if (apiBaseUrl) {
    return `${apiBaseUrl}${path}`;
  }

  throw new Error(
    'EXPO_PUBLIC_API_BASE_URL is required for iOS and Android company API access.'
  );
};
