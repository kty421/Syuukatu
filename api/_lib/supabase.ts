import { createClient } from '@supabase/supabase-js';

import { HttpError } from './http';

type AuthStorage = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
};

type ServerClientOptions = {
  flowType?: 'implicit' | 'pkce';
  storage?: AuthStorage;
};

const SERVER_AUTH_STORAGE_KEY = 'syuukatu-server-auth';

const normalizeEnvValue = (value: string | undefined) => {
  const trimmed = value?.trim() ?? '';

  return trimmed.replace(/^['"]|['"]$/g, '');
};

const getSupabaseUrl = () =>
  normalizeEnvValue(
    process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL
  );

const getSupabaseAnonKey = () =>
  normalizeEnvValue(
    process.env.SUPABASE_ANON_KEY ??
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );

export const getSupabaseServerConfigStatus = () => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  return {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    supabaseAnonKeyLength: supabaseAnonKey.length,
    supabaseAnonKeyLooksLikeJwt:
      supabaseAnonKey.split('.').length === 3 &&
      supabaseAnonKey.startsWith('ey')
  };
};

export const createSupabaseServerClient = (
  accessToken?: string,
  options: ServerClientOptions = {}
) => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new HttpError(500, 'Supabaseの環境変数が設定されていません。');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: options.flowType,
      persistSession: false,
      storage: options.storage,
      storageKey: SERVER_AUTH_STORAGE_KEY
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      : undefined
  });
};
