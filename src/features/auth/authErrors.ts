const RATE_LIMIT_MESSAGE =
  '確認メールの送信回数が上限に達しました。時間をおいて再度お試しください。';
const SUPABASE_CONFIG_MESSAGE =
  'SupabaseのAPIキーが正しくありません。VercelのSUPABASE_ANON_KEYとEXPO_PUBLIC_SUPABASE_ANON_KEYを確認してから再デプロイしてください。';
const INVALID_CREDENTIALS_MESSAGE =
  'メールアドレスまたはパスワードを確認してください。';
const EMAIL_NOT_CONFIRMED_MESSAGE =
  'メール認証が完了していません。確認メールのリンクを開いてからログインしてください。';
const INVALID_EMAIL_MESSAGE = 'メールアドレスの形式を確認してください。';
const WEAK_PASSWORD_MESSAGE =
  'パスワードは8文字以上で入力してください。';
const EMAIL_EXISTS_MESSAGE =
  'このメールアドレスはすでに登録されています。ログイン画面からお試しください。';
const NETWORK_MESSAGE =
  '通信に失敗しました。ネットワーク接続を確認してください。';

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

  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid credentials') ||
    normalized.includes('email not found') ||
    normalized.includes('user not found')
  ) {
    return INVALID_CREDENTIALS_MESSAGE;
  }

  if (
    normalized.includes('email not confirmed') ||
    normalized.includes('email_not_confirmed')
  ) {
    return EMAIL_NOT_CONFIRMED_MESSAGE;
  }

  if (
    normalized.includes('invalid email') ||
    normalized.includes('email address is invalid')
  ) {
    return INVALID_EMAIL_MESSAGE;
  }

  if (
    normalized.includes('password should be at least') ||
    normalized.includes('weak password') ||
    normalized.includes('password is too short')
  ) {
    return WEAK_PASSWORD_MESSAGE;
  }

  if (
    normalized.includes('user already registered') ||
    normalized.includes('already registered') ||
    normalized.includes('already exists')
  ) {
    return EMAIL_EXISTS_MESSAGE;
  }

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network request failed') ||
    normalized.includes('load failed')
  ) {
    return NETWORK_MESSAGE;
  }

  return message;
};

export const normalizeAuthError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : '認証に失敗しました。';

  return new Error(normalizeAuthErrorMessage(message));
};
