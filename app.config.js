const { parseProjectEnv } = require('@expo/env');

const parsedEnv = parseProjectEnv(__dirname, { silent: true }).env;

const getEnvValue = (systemValue, parsedValue) => {
  if (typeof systemValue === 'string' && systemValue.length > 0) {
    return systemValue;
  }

  return parsedValue ?? '';
};

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiBaseUrl: getEnvValue(
      process.env.EXPO_PUBLIC_API_BASE_URL,
      parsedEnv.EXPO_PUBLIC_API_BASE_URL
    ),
    supabaseUrl: getEnvValue(
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      parsedEnv.EXPO_PUBLIC_SUPABASE_URL
    ),
    supabaseAnonKey: getEnvValue(
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      parsedEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY
    ),
    webBaseUrl: getEnvValue(
      process.env.EXPO_PUBLIC_WEB_BASE_URL,
      parsedEnv.EXPO_PUBLIC_WEB_BASE_URL
    ),
    confirmEmailRedirectUrl: getEnvValue(
      process.env.EXPO_PUBLIC_CONFIRM_EMAIL_REDIRECT_URL,
      parsedEnv.EXPO_PUBLIC_CONFIRM_EMAIL_REDIRECT_URL
    ),
    resetPasswordRedirectUrl: getEnvValue(
      process.env.EXPO_PUBLIC_RESET_PASSWORD_REDIRECT_URL,
      parsedEnv.EXPO_PUBLIC_RESET_PASSWORD_REDIRECT_URL
    ),
    webAuthCallbackUrl: getEnvValue(
      process.env.EXPO_PUBLIC_WEB_AUTH_CALLBACK_URL,
      parsedEnv.EXPO_PUBLIC_WEB_AUTH_CALLBACK_URL
    ),
    nativeAuthCallbackUrl: getEnvValue(
      process.env.EXPO_PUBLIC_NATIVE_AUTH_CALLBACK_URL,
      parsedEnv.EXPO_PUBLIC_NATIVE_AUTH_CALLBACK_URL
    )
  }
});
