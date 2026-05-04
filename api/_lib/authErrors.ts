const RATE_LIMIT_MESSAGE =
  '確認メールの送信回数が上限に達しました。時間をおいて再度お試しください。';
const SUPABASE_CONFIG_MESSAGE =
  'SupabaseのAPIキーが正しくありません。VercelのSUPABASE_ANON_KEYとEXPO_PUBLIC_SUPABASE_ANON_KEYを確認してから再デプロイしてください。';

export const normalizeAuthErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('rate limit') ||
    normalized.includes('email rate limit') ||
    normalized.includes('over_email_send_rate_limit')
  ) {
    return RATE_LIMIT_MESSAGE;
  }

  if (
    normalized.includes('invalid api key') ||
    normalized.includes('invalid apikey')
  ) {
    return SUPABASE_CONFIG_MESSAGE;
  }

  return message;
};

export const getAuthErrorStatus = (message: string, fallbackStatus = 400) => {
  const normalized = normalizeAuthErrorMessage(message);

  if (normalized === RATE_LIMIT_MESSAGE) {
    return 429;
  }

  if (normalized === SUPABASE_CONFIG_MESSAGE) {
    return 500;
  }

  return fallbackStatus;
};

export const isSupabaseConfigError = (message: string) =>
  normalizeAuthErrorMessage(message) === SUPABASE_CONFIG_MESSAGE;
