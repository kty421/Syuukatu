import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import {
  hasNativeSupabaseConfig,
  supabaseAnonKey,
  supabaseUrl
} from '../config/env';

const WEB_PASSWORD_RECOVERY_STORAGE_KEY =
  'syuukatu-web-password-recovery-auth';

export const webSupabase =
  Platform.OS === 'web' && hasNativeSupabaseConfig
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
          persistSession: true,
          storageKey: WEB_PASSWORD_RECOVERY_STORAGE_KEY
        }
      })
    : null;

export const requireWebSupabase = () => {
  if (!webSupabase) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return webSupabase;
};
